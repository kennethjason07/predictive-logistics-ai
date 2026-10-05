import { Location, LogisticsRoute, Vehicle } from './schema';

export interface RouteWeights {
  distance: number;
  time: number;
  terrain: number;
  road: number;
  weather: number;
  capacity: number;
}

export const DEFAULT_ROUTE_WEIGHTS: RouteWeights = {
  distance: 0.30,
  time: 0.20,
  terrain: 0.15,
  road: 0.15,
  weather: 0.10,
  capacity: 0.10
};

export interface RouteFactorComponents {
  normalized_distance: number;
  normalized_time: number;
  normalized_terrain: number;
  normalized_road: number;
  normalized_weather: number;
  normalized_capacity: number;
}

export interface RankedRouteResult {
  route: LogisticsRoute;
  score: number;
  is_recommended: boolean;
  components: RouteFactorComponents;
  assigned_vehicle?: Vehicle;
  explanation_points: string[];
}

export interface InfeasibleRouteResult {
  route: LogisticsRoute;
  reason: string;
}

export interface RoutePlanRequest {
  source_location_id: string;
  destination_location_id: string;
  supply_type: string;
  quantity: number;
  custom_weights?: Partial<RouteWeights>;
}

export interface RoutePlanResponse {
  source: Location | null;
  destination: Location | null;
  supply_type: string;
  quantity: number;
  recommended_route: RankedRouteResult | null;
  alternatives: RankedRouteResult[];
  infeasible_routes: InfeasibleRouteResult[];
  assigned_vehicle: Vehicle | null;
  weights_used: RouteWeights;
  explanation: string;
  status: 'SUCCESS' | 'NO_ROUTES' | 'ALL_BLOCKED' | 'INSUFFICIENT_CAPACITY' | 'INVALID_INPUT';
  error_message?: string;
}
