import { LogisticsRoute, Vehicle } from '../types/schema';
import {
  RouteWeights,
  DEFAULT_ROUTE_WEIGHTS,
  RouteFactorComponents,
  RankedRouteResult,
  InfeasibleRouteResult
} from '../types/gis';

// Terrain numeric multiplier mapping
export function getTerrainFactor(terrain: string | undefined): number {
  if (!terrain) return 1.0;
  const t = terrain.toLowerCase();
  if (t.includes('valley') || t.includes('low') || t.includes('plain')) return 1.0;
  if (t.includes('mountain') || t.includes('pass') || t.includes('medium') || t.includes('ridge')) return 1.25;
  if (t.includes('glacial') || t.includes('extreme') || t.includes('high') || t.includes('altitude')) return 1.60;
  return 1.25;
}

// Road condition multiplier mapping
export function getRoadConditionFactor(roadCondition: string | undefined): number {
  if (!roadCondition) return 1.0;
  const r = roadCondition.toUpperCase();
  if (r === 'GOOD') return 1.0;
  if (r === 'FAIR') return 1.15;
  if (r === 'POOR') return 1.35;
  return 1.0;
}

// Weather impact multiplier mapping
export function getWeatherImpactFactor(weatherStatus: string | undefined): number {
  if (!weatherStatus) return 1.0;
  const w = weatherStatus.toLowerCase();
  if (w.includes('clear') || w.includes('normal')) return 1.0;
  if (w.includes('foggy') || w.includes('heavy snowfall') || w.includes('moderate')) return 1.30;
  if (w.includes('blizzard') || w.includes('landslide') || w.includes('severe')) return 1.70;
  return 1.15;
}

// Helper for min-max normalization into [0.1, 1.0] range
function normalizeValue(value: number, minVal: number, maxVal: number): number {
  if (maxVal === minVal || maxVal <= 0) return 0.5;
  const norm = (value - minVal) / (maxVal - minVal);
  return Number((0.1 + 0.9 * norm).toFixed(4));
}

export interface RouteEvaluationOptions {
  routes: LogisticsRoute[];
  vehicles: Vehicle[];
  sourceLocationId: string;
  destinationLocationId: string;
  requiredQuantity: number;
  customWeights?: Partial<RouteWeights>;
}

export function evaluateAndRankRoutes(options: RouteEvaluationOptions): {
  feasibleRoutes: RankedRouteResult[];
  infeasibleRoutes: InfeasibleRouteResult[];
  recommendedRoute: RankedRouteResult | null;
  weightsUsed: RouteWeights;
} {
  const weights: RouteWeights = {
    ...DEFAULT_ROUTE_WEIGHTS,
    ...options.customWeights
  };

  const candidateRoutes = options.routes.filter(
    r =>
      (r.source_id === options.sourceLocationId && r.destination_id === options.destinationLocationId) ||
      (r.source_id === options.destinationLocationId && r.destination_id === options.sourceLocationId)
  );

  const infeasibleRoutes: InfeasibleRouteResult[] = [];
  const validCandidates: { route: LogisticsRoute; assignedVehicle?: Vehicle }[] = [];

  // Find available vehicles at source location or regional depot pool
  let availableVehicles = options.vehicles.filter(
    v =>
      v.availability_status === 'AVAILABLE' &&
      (v.current_location_id === options.sourceLocationId ||
        v.current_location_id === 'loc-depot-01' ||
        !v.current_location_id)
  );

  // Fallback to any available vehicle in fleet if source specific vehicles not explicitly set
  if (availableVehicles.length === 0) {
    availableVehicles = options.vehicles.filter(v => v.availability_status === 'AVAILABLE');
  }

  const maxVehicleCap = availableVehicles.reduce((max, v) => Math.max(max, v.capacity), 0);

  for (const route of candidateRoutes) {
    // Check 1: Route Status BLOCKED
    if (route.status === 'Blocked') {
      infeasibleRoutes.push({
        route,
        reason: 'Route status is BLOCKED due to severe weather, blizzard, or landslide risk.'
      });
      continue;
    }

    // Check 2: Transport Vehicle Capacity
    if (options.requiredQuantity > 0) {
      if (availableVehicles.length === 0) {
        infeasibleRoutes.push({
          route,
          reason: 'No available transport vehicles at source depot.'
        });
        continue;
      }

      if (maxVehicleCap < options.requiredQuantity) {
        infeasibleRoutes.push({
          route,
          reason: `Insufficient transport capacity (Required: ${options.requiredQuantity}, Max Vehicle Cap: ${maxVehicleCap}).`
        });
        continue;
      }
    }

    // Best matching vehicle
    const suitableVehicle = availableVehicles
      .filter(v => v.capacity >= options.requiredQuantity)
      .sort((a, b) => a.capacity - b.capacity)[0];

    validCandidates.push({ route, assignedVehicle: suitableVehicle });
  }

  if (validCandidates.length === 0) {
    return {
      feasibleRoutes: [],
      infeasibleRoutes,
      recommendedRoute: null,
      weightsUsed: weights
    };
  }

  // Calculate raw metrics for min-max normalization
  const distances = validCandidates.map(c => c.route.distance_km || 1);
  const times = validCandidates.map(c => c.route.travel_time_hr || 1);
  const terrains = validCandidates.map(c => getTerrainFactor(c.route.terrain));
  const roads = validCandidates.map(c => getRoadConditionFactor(c.route.road_condition));
  const weathers = validCandidates.map(c => getWeatherImpactFactor(c.route.weather_status));
  const capacityRatios = validCandidates.map(c => {
    if (!c.assignedVehicle || c.assignedVehicle.capacity <= 0) return 1.0;
    return options.requiredQuantity / c.assignedVehicle.capacity;
  });

  const minDist = Math.min(...distances), maxDist = Math.max(...distances);
  const minTime = Math.min(...times), maxTime = Math.max(...times);
  const minTer = Math.min(...terrains), maxTer = Math.max(...terrains);
  const minRoad = Math.min(...roads), maxRoad = Math.max(...roads);
  const minWeath = Math.min(...weathers), maxWeath = Math.max(...weathers);
  const minCapRatio = Math.min(...capacityRatios), maxCapRatio = Math.max(...capacityRatios);

  const rankedRoutes: RankedRouteResult[] = validCandidates.map(({ route, assignedVehicle }, idx) => {
    const normDist = normalizeValue(distances[idx], minDist, maxDist);
    const normTime = normalizeValue(times[idx], minTime, maxTime);
    const normTer = normalizeValue(terrains[idx], minTer, maxTer);
    const normRoad = normalizeValue(roads[idx], minRoad, maxRoad);
    const normWeath = normalizeValue(weathers[idx], minWeath, maxWeath);
    const normCap = normalizeValue(capacityRatios[idx], minCapRatio, maxCapRatio);

    const components: RouteFactorComponents = {
      normalized_distance: normDist,
      normalized_time: normTime,
      normalized_terrain: normTer,
      normalized_road: normRoad,
      normalized_weather: normWeath,
      normalized_capacity: normCap
    };

    const rawScore =
      weights.distance * normDist +
      weights.time * normTime +
      weights.terrain * normTer +
      weights.road * normRoad +
      weights.weather * normWeath +
      weights.capacity * normCap;

    const score = Number(rawScore.toFixed(3));

    return {
      route,
      score,
      is_recommended: false,
      components,
      assigned_vehicle: assignedVehicle,
      explanation_points: []
    };
  });

  // Sort ascending by score (lower score = superior route)
  rankedRoutes.sort((a, b) => a.score - b.score);

  if (rankedRoutes.length > 0) {
    rankedRoutes[0].is_recommended = true;
    rankedRoutes[0].explanation_points = generateRouteExplanation(rankedRoutes[0], rankedRoutes.slice(1));
  }

  return {
    feasibleRoutes: rankedRoutes,
    infeasibleRoutes,
    recommendedRoute: rankedRoutes.length > 0 ? rankedRoutes[0] : null,
    weightsUsed: weights
  };
}

export function generateRouteExplanation(
  best: RankedRouteResult,
  others: RankedRouteResult[]
): string[] {
  const points: string[] = [];

  if (others.length === 0) {
    points.push('✓ Single feasible route connecting source and destination locations.');
  } else {
    const avgDist = others.reduce((sum, o) => sum + o.route.distance_km, 0) / others.length;
    const avgTime = others.reduce((sum, o) => sum + o.route.travel_time_hr, 0) / others.length;

    if (best.route.distance_km <= avgDist) {
      points.push(`✓ Shorter route distance (${best.route.distance_km} km vs ${avgDist.toFixed(0)} km average).`);
    }

    if (best.route.travel_time_hr <= avgTime) {
      points.push(`✓ Lower estimated travel time (${best.route.travel_time_hr}h vs ${avgTime.toFixed(1)}h average).`);
    }

    const roadCondition = (best.route.road_condition || 'GOOD').toUpperCase();
    if (roadCondition === 'GOOD') {
      points.push('✓ Superior road condition rating (GOOD).');
    } else if (roadCondition === 'FAIR') {
      points.push('✓ Acceptable road condition rating (FAIR).');
    }

    const weatherFac = getWeatherImpactFactor(best.route.weather_status);
    if (weatherFac === 1.0) {
      points.push('✓ Favorable weather status (Clear / Minimal impact).');
    } else {
      points.push(`✓ Manageable weather status (${best.route.weather_status}).`);
    }

    const terrainFac = getTerrainFactor(best.route.terrain);
    if (terrainFac === 1.0) {
      points.push('✓ Favorable terrain difficulty (Low terrain penalty).');
    }
  }

  if (best.assigned_vehicle) {
    points.push(`✓ Suitable transport capacity verified (${best.assigned_vehicle.name} — ${best.assigned_vehicle.capacity} ${best.assigned_vehicle.capacity_unit}).`);
  } else {
    points.push('✓ Transport capacity criteria satisfied.');
  }

  return points;
}
