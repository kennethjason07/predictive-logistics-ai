import { dataService } from './dataService';
import { Location, LogisticsRoute, Vehicle } from '../types/schema';
import { RoutePlanRequest, RoutePlanResponse, RouteWeights } from '../types/gis';
import { evaluateAndRankRoutes } from './routeScoringEngine';
import { GIS_DEMO_LOCATIONS, GIS_DEMO_ROUTES, INITIAL_VEHICLES } from '../data/seedGisData';
import { supabase } from '../lib/supabase';

let memoryVehicles: Vehicle[] = [...INITIAL_VEHICLES];

// Helper to access Supabase safely
const db = (tableName: string) => supabase.from(tableName as any) as any;

export const gisLogisticsService = {
  // Fetch vehicles with DB or local fallback
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const { data, error } = await db('vehicles').select('*');
      if (error || !data || data.length === 0) {
        return memoryVehicles;
      }
      memoryVehicles = data as Vehicle[];
      return memoryVehicles;
    } catch {
      return memoryVehicles;
    }
  },

  async addVehicle(vehicle: Omit<Vehicle, 'vehicle_id' | 'created_at'>): Promise<Vehicle> {
    const newVeh: Vehicle = {
      ...vehicle,
      vehicle_id: 'veh-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await db('vehicles').insert([newVeh]).select().single();
      if (!error && data) {
        memoryVehicles.push(data as Vehicle);
        return data as Vehicle;
      }
    } catch (e) {
      console.warn('Supabase vehicle insert failed, using memory state:', e);
    }
    memoryVehicles.push(newVeh);
    return newVeh;
  },

  // Main Route Planning Endpoint / Service function
  async planRoute(request: RoutePlanRequest): Promise<RoutePlanResponse> {
    const { source_location_id, destination_location_id, supply_type, quantity, custom_weights } = request;

    // Validation 1: Missing Source
    if (!source_location_id) {
      return {
        source: null,
        destination: null,
        supply_type: supply_type || '',
        quantity: quantity || 0,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: [],
        assigned_vehicle: null,
        weights_used: custom_weights as RouteWeights || {},
        explanation: '',
        status: 'INVALID_INPUT',
        error_message: 'Please select a source location.'
      };
    }

    // Validation 2: Missing Destination
    if (!destination_location_id) {
      return {
        source: null,
        destination: null,
        supply_type: supply_type || '',
        quantity: quantity || 0,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: [],
        assigned_vehicle: null,
        weights_used: custom_weights as RouteWeights || {},
        explanation: '',
        status: 'INVALID_INPUT',
        error_message: 'Please select a destination location.'
      };
    }

    // Validation 3: Same Source and Destination
    if (source_location_id === destination_location_id) {
      return {
        source: null,
        destination: null,
        supply_type: supply_type || '',
        quantity: quantity || 0,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: [],
        assigned_vehicle: null,
        weights_used: custom_weights as RouteWeights || {},
        explanation: '',
        status: 'INVALID_INPUT',
        error_message: 'Source and destination must be different.'
      };
    }

    // Fetch locations, routes, and vehicles
    const allLocations = await dataService.getLocations();
    const allRoutes = await dataService.getRoutes();
    const allVehicles = await this.getVehicles();

    // Merge demo GIS locations and routes if not already in memory
    const combinedLocations = [...allLocations];
    for (const loc of GIS_DEMO_LOCATIONS) {
      if (!combinedLocations.some(l => l.location_id === loc.location_id)) {
        combinedLocations.push(loc);
      }
    }

    const combinedRoutes = [...allRoutes];
    for (const rt of GIS_DEMO_ROUTES) {
      if (!combinedRoutes.some(r => r.route_id === rt.route_id)) {
        combinedRoutes.push(rt);
      }
    }

    const sourceLoc = combinedLocations.find(l => l.location_id === source_location_id) || null;
    const destLoc = combinedLocations.find(l => l.location_id === destination_location_id) || null;

    if (!sourceLoc || !destLoc) {
      return {
        source: sourceLoc,
        destination: destLoc,
        supply_type,
        quantity,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: [],
        assigned_vehicle: null,
        weights_used: custom_weights as RouteWeights || {},
        explanation: '',
        status: 'INVALID_INPUT',
        error_message: 'Specified source or destination location was not found.'
      };
    }

    // Run scoring engine
    const evaluation = evaluateAndRankRoutes({
      routes: combinedRoutes,
      vehicles: allVehicles,
      sourceLocationId: source_location_id,
      destinationLocationId: destination_location_id,
      requiredQuantity: quantity || 0,
      customWeights: custom_weights
    });

    const candidateCount = evaluation.feasibleRoutes.length + evaluation.infeasibleRoutes.length;

    if (candidateCount === 0) {
      return {
        source: sourceLoc,
        destination: destLoc,
        supply_type,
        quantity,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: [],
        assigned_vehicle: null,
        weights_used: evaluation.weightsUsed,
        explanation: 'No routes available for this source and destination.',
        status: 'NO_ROUTES',
        error_message: 'No routes available for this source and destination.'
      };
    }

    if (!evaluation.recommendedRoute) {
      const isCapacityIssue = evaluation.infeasibleRoutes.some(r => r.reason.toLowerCase().includes('capacity'));
      const isBlockedIssue = evaluation.infeasibleRoutes.some(r => r.reason.toLowerCase().includes('blocked'));

      let statusMsg: 'ALL_BLOCKED' | 'INSUFFICIENT_CAPACITY' = 'ALL_BLOCKED';
      let errorMsg = 'No feasible route is currently available.';

      if (isCapacityIssue) {
        statusMsg = 'INSUFFICIENT_CAPACITY';
        errorMsg = 'No available transport has sufficient capacity for this shipment.';
      } else if (isBlockedIssue) {
        statusMsg = 'ALL_BLOCKED';
        errorMsg = 'All routes between selected locations are currently blocked due to severe conditions.';
      }

      return {
        source: sourceLoc,
        destination: destLoc,
        supply_type,
        quantity,
        recommended_route: null,
        alternatives: [],
        infeasible_routes: evaluation.infeasibleRoutes,
        assigned_vehicle: null,
        weights_used: evaluation.weightsUsed,
        explanation: errorMsg,
        status: statusMsg,
        error_message: errorMsg
      };
    }

    const rec = evaluation.recommendedRoute;
    const alternatives = evaluation.feasibleRoutes.slice(1);
    const assignedVehicle = rec.assigned_vehicle || null;

    const explanationText = `Recommended Route: ${rec.route.terrain} (${rec.route.distance_km} km, ${rec.route.travel_time_hr}h, Score: ${rec.score}). ${rec.explanation_points.join(' ')}`;

    return {
      source: sourceLoc,
      destination: destLoc,
      supply_type,
      quantity,
      recommended_route: rec,
      alternatives,
      infeasible_routes: evaluation.infeasibleRoutes,
      assigned_vehicle: assignedVehicle,
      weights_used: evaluation.weightsUsed,
      explanation: explanationText,
      status: 'SUCCESS'
    };
  }
};
