export interface Location {
  location_id: string;
  name: string;
  type: string; // 'Command Depot' | 'Forward Operating Base' | 'Supply Hub' | 'Transit Depot'
  latitude: number;
  longitude: number;
  terrain: string;
  created_at?: string;
}

export interface InventoryItem {
  inventory_id: string;
  location_id: string;
  supply_type: string;
  quantity: number;
  unit: string;
  safety_stock: number;
  lead_time_days?: number;
  reorder_level?: number;
  last_updated?: string;
  location?: Location; // joined
}

export interface ConsumptionRecord {
  id: string;
  location_id: string;
  supply_type: string;
  consumption_date: string;
  quantity_consumed: number;
  unit: string;
  created_at?: string;
  location?: Location; // joined
}

export interface LogisticsRoute {
  route_id: string;
  source_id: string;
  destination_id: string;
  distance_km: number;
  travel_time_hr: number;
  terrain: string;
  road_condition?: 'GOOD' | 'FAIR' | 'POOR';
  weather_status: 'Clear' | 'Heavy Snowfall' | 'Blizzard Warning' | 'Landslide Risk' | 'Foggy';
  status: 'Open' | 'Restricted' | 'Blocked' | 'Priority Only';
  created_at?: string;
  source_location?: Location;
  destination_location?: Location;
}

export interface Vehicle {
  vehicle_id: string;
  name: string;
  vehicle_type: string;
  capacity: number;
  capacity_unit: string;
  availability_status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE';
  current_location_id: string;
  created_at?: string;
  current_location?: Location;
}

export interface LogisticsMovement {
  logistics_id: string;
  source_id: string;
  destination_id: string;
  supply_type: string;
  quantity: number;
  unit: string;
  route_id?: string | null;
  status: 'Recommended' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Delayed';
  dispatch_time?: string | null;
  expected_arrival?: string | null;
  actual_arrival?: string | null;
  created_at?: string;
  source_location?: Location;
  destination_location?: Location;
  route?: LogisticsRoute;
}

export interface AIPredictionAlert {
  id: string;
  location_name: string;
  supply_type: string;
  current_quantity: number;
  daily_burn_rate: number;
  days_remaining: number;
  critical_threshold: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'STABLE';
  recommended_action: string;
}
