import { Location, LogisticsRoute, Vehicle } from '../types/schema';

export const GIS_DEMO_LOCATIONS: Location[] = [
  {
    location_id: 'loc-depot-01',
    name: 'Central Command Depot (Hub-1)',
    type: 'Command Depot',
    latitude: 33.7782,
    longitude: 76.5762,
    terrain: 'Valley Command',
    created_at: new Date().toISOString()
  },
  {
    location_id: 'loc-base-alpha',
    name: 'Forward Operating Base Alpha',
    type: 'Forward Operating Base',
    latitude: 34.2500,
    longitude: 77.2000,
    terrain: 'Mountain Ridge Sector',
    created_at: new Date().toISOString()
  },
  {
    location_id: 'loc-base-bravo',
    name: 'Forward Operating Base Bravo',
    type: 'Forward Operating Base',
    latitude: 34.4200,
    longitude: 76.8500,
    terrain: 'High Altitude Plateau',
    created_at: new Date().toISOString()
  },
  {
    location_id: 'loc-base-charlie',
    name: 'Forward Operating Base Charlie',
    type: 'Forward Operating Base',
    latitude: 34.8000,
    longitude: 77.4000,
    terrain: 'Glacial Pass',
    created_at: new Date().toISOString()
  }
];

export const GIS_DEMO_ROUTES: LogisticsRoute[] = [
  // Routes between Central Depot and Forward Base Alpha (Scenario from Specification #30)
  {
    route_id: 'rt-alpha-1',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-alpha',
    distance_km: 120,
    travel_time_hr: 4.5,
    terrain: 'High Mountain Pass',
    road_condition: 'FAIR',
    weather_status: 'Heavy Snowfall',
    status: 'Open',
    created_at: new Date().toISOString()
  },
  {
    route_id: 'rt-alpha-2',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-alpha',
    distance_km: 140,
    travel_time_hr: 4.0,
    terrain: 'Low Valley Highway',
    road_condition: 'GOOD',
    weather_status: 'Clear',
    status: 'Open',
    created_at: new Date().toISOString()
  },
  {
    route_id: 'rt-alpha-3',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-alpha',
    distance_km: 110,
    travel_time_hr: 6.0,
    terrain: 'High Altitude Ridge',
    road_condition: 'POOR',
    weather_status: 'Blizzard Warning',
    status: 'Blocked', // BLOCKED per spec
    created_at: new Date().toISOString()
  },

  // Routes between Central Depot and Forward Base Bravo
  {
    route_id: 'rt-bravo-1',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-bravo',
    distance_km: 165,
    travel_time_hr: 5.2,
    terrain: 'Mountain Plateau',
    road_condition: 'GOOD',
    weather_status: 'Clear',
    status: 'Open',
    created_at: new Date().toISOString()
  },
  {
    route_id: 'rt-bravo-2',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-bravo',
    distance_km: 185,
    travel_time_hr: 6.8,
    terrain: 'Valley Cut-Through',
    road_condition: 'FAIR',
    weather_status: 'Foggy',
    status: 'Restricted',
    created_at: new Date().toISOString()
  },

  // Routes between Central Depot and Forward Base Charlie
  {
    route_id: 'rt-charlie-1',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-charlie',
    distance_km: 210,
    travel_time_hr: 7.5,
    terrain: 'Glacial Canyon',
    road_condition: 'POOR',
    weather_status: 'Landslide Risk',
    status: 'Restricted',
    created_at: new Date().toISOString()
  },
  {
    route_id: 'rt-charlie-2',
    source_id: 'loc-depot-01',
    destination_id: 'loc-base-charlie',
    distance_km: 235,
    travel_time_hr: 6.5,
    terrain: 'High Pass Highway',
    road_condition: 'GOOD',
    weather_status: 'Clear',
    status: 'Open',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 'veh-001',
    name: 'Ashok Leyland Stallion 6x6 Heavy Fuel Tanker (TK-401)',
    vehicle_type: 'Heavy Fuel Tanker',
    capacity: 500,
    capacity_unit: 'L',
    availability_status: 'AVAILABLE',
    current_location_id: 'loc-depot-01',
    created_at: new Date().toISOString()
  },
  {
    vehicle_id: 'veh-002',
    name: 'Tata 4x4 High-Capacity Logistics Truck (TRK-208)',
    vehicle_type: 'Heavy Transport Truck',
    capacity: 1000,
    capacity_unit: 'L',
    availability_status: 'AVAILABLE',
    current_location_id: 'loc-depot-01',
    created_at: new Date().toISOString()
  },
  {
    vehicle_id: 'veh-003',
    name: 'Mahindra Marksman Light All-Terrain Carrier (LAT-105)',
    vehicle_type: 'Light Cargo Carrier',
    capacity: 300,
    capacity_unit: 'L',
    availability_status: 'AVAILABLE',
    current_location_id: 'loc-depot-01',
    created_at: new Date().toISOString()
  },
  {
    vehicle_id: 'veh-004',
    name: 'Leh Command Heavy Tanker Alpha (TK-Leh-1)',
    vehicle_type: 'Heavy Fuel Tanker',
    capacity: 1200,
    capacity_unit: 'KiloLiters',
    availability_status: 'AVAILABLE',
    current_location_id: 'loc-002', // Leh
    created_at: new Date().toISOString()
  },
  {
    vehicle_id: 'veh-005',
    name: 'Srinagar Express Cargo Truck (TRK-Srn-4)',
    vehicle_type: 'Medium Transport Truck',
    capacity: 800,
    capacity_unit: 'Rations',
    availability_status: 'AVAILABLE',
    current_location_id: 'loc-001', // Srinagar
    created_at: new Date().toISOString()
  }
];
