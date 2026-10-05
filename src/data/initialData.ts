import { Location, InventoryItem, ConsumptionRecord, LogisticsRoute, LogisticsMovement } from '../types/schema';
import { GIS_DEMO_LOCATIONS, GIS_DEMO_ROUTES } from './seedGisData';

export const INITIAL_LOCATIONS: Location[] = [
  ...GIS_DEMO_LOCATIONS,
  {
    location_id: 'loc-001',
    name: 'Srinagar Command Logistics Center',
    type: 'Command Depot',
    latitude: 34.0837,
    longitude: 74.7973,
    terrain: 'Valley Command',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    location_id: 'loc-002',
    name: 'Leh Main Supply Base (HQ 14 Corps)',
    type: 'Supply Hub',
    latitude: 34.1526,
    longitude: 77.5771,
    terrain: 'High Altitude Plateau',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    location_id: 'loc-003',
    name: 'Kargil Sector Forward Depot',
    type: 'Forward Operating Base',
    latitude: 34.5539,
    longitude: 76.1349,
    terrain: 'Mountain Ridge',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    location_id: 'loc-004',
    name: 'Siachen Base Camp (Northern Glacier)',
    type: 'Forward Operating Base',
    latitude: 35.5000,
    longitude: 77.1500,
    terrain: 'Glacial Valley (Extreme Altitude)',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    location_id: 'loc-005',
    name: 'Daulet Beg Oldi (DBO Outpost - Sub Sector North)',
    type: 'Forward Operating Base',
    latitude: 35.4140,
    longitude: 77.9250,
    terrain: 'Cold Desert Altitude (16,600 ft)',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    location_id: 'loc-006',
    name: 'Tawang Sector Forward Post',
    type: 'Forward Operating Base',
    latitude: 27.5860,
    longitude: 91.8594,
    terrain: 'Eastern Himalayan Ridge',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    inventory_id: 'inv-000',
    location_id: 'loc-depot-01',
    supply_type: 'Fuel',
    quantity: 10000,
    unit: 'L',
    safety_stock: 2000,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-001',
    location_id: 'loc-002', // Leh HQ
    supply_type: 'Ammunition 155mm Artillery',
    quantity: 14200,
    unit: 'Rounds',
    safety_stock: 5000,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-002',
    location_id: 'loc-002', // Leh HQ
    supply_type: 'Aviation Turbine Fuel (ATF-Winter)',
    quantity: 850,
    unit: 'KiloLiters',
    safety_stock: 300,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-003',
    location_id: 'loc-004', // Siachen
    supply_type: 'Extreme Cold Climate Rations (ECC)',
    quantity: 1850,
    unit: 'Rations',
    safety_stock: 4500, // CRITICAL LOW!
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-004',
    location_id: 'loc-004', // Siachen
    supply_type: 'Medical Plasma & Oxygen Cylinders',
    quantity: 340,
    unit: 'Units',
    safety_stock: 600, // LOW!
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-005',
    location_id: 'loc-005', // DBO
    supply_type: 'Diesel Winter Grade (-30C)',
    quantity: 920,
    unit: 'KiloLiters',
    safety_stock: 2000, // CRITICAL LOW!
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-006',
    location_id: 'loc-005', // DBO
    supply_type: 'High-Altitude Special Clothing (ECC Clothing)',
    quantity: 480,
    unit: 'Kits',
    safety_stock: 500,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-007',
    location_id: 'loc-003', // Kargil
    supply_type: 'Ammunition 155mm Artillery',
    quantity: 6800,
    unit: 'Rounds',
    safety_stock: 3000,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-008',
    location_id: 'loc-003', // Kargil
    supply_type: 'Extreme Cold Climate Rations (ECC)',
    quantity: 8200,
    unit: 'Rations',
    safety_stock: 4000,
    last_updated: new Date().toISOString()
  },
  {
    inventory_id: 'inv-009',
    location_id: 'loc-006', // Tawang
    supply_type: 'Extreme Cold Climate Rations (ECC)',
    quantity: 5400,
    unit: 'Rations',
    safety_stock: 3000,
    last_updated: new Date().toISOString()
  }
];

export const INITIAL_ROUTES: LogisticsRoute[] = [
  ...GIS_DEMO_ROUTES,
  {
    route_id: 'rt-001',
    source_id: 'loc-001', // Srinagar
    destination_id: 'loc-003', // Kargil
    distance_km: 204,
    travel_time_hr: 7.5,
    terrain: 'Zoji La Mountain Pass (11,575 ft)',
    road_condition: 'FAIR',
    weather_status: 'Heavy Snowfall',
    status: 'Restricted',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    route_id: 'rt-002',
    source_id: 'loc-003', // Kargil
    destination_id: 'loc-002', // Leh
    distance_km: 217,
    travel_time_hr: 6.0,
    terrain: 'Fotula Pass & Namkila Pass',
    road_condition: 'GOOD',
    weather_status: 'Clear',
    status: 'Open',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    route_id: 'rt-003',
    source_id: 'loc-002', // Leh
    destination_id: 'loc-004', // Siachen Base Camp
    distance_km: 212,
    travel_time_hr: 8.0,
    terrain: 'Khardung La Pass (17,982 ft)',
    road_condition: 'POOR',
    weather_status: 'Blizzard Warning',
    status: 'Blocked',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    route_id: 'rt-004',
    source_id: 'loc-002', // Leh
    destination_id: 'loc-005', // DBO
    distance_km: 255,
    travel_time_hr: 11.5,
    terrain: 'DS-DBO Highway (Shyok River Road)',
    road_condition: 'FAIR',
    weather_status: 'Landslide Risk',
    status: 'Restricted',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    route_id: 'rt-005',
    source_id: 'loc-001', // Srinagar
    destination_id: 'loc-002', // Leh
    distance_km: 421,
    travel_time_hr: 13.5,
    terrain: 'NH-1 National Highway',
    road_condition: 'GOOD',
    weather_status: 'Clear',
    status: 'Open',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString()
  }
];

export const INITIAL_LOGISTICS: LogisticsMovement[] = [
  {
    logistics_id: 'log-101',
    source_id: 'loc-002', // Leh
    destination_id: 'loc-004', // Siachen Base Camp
    supply_type: 'Extreme Cold Climate Rations (ECC)',
    quantity: 3000,
    unit: 'Rations',
    route_id: 'rt-003',
    status: 'In Transit',
    dispatch_time: new Date(Date.now() - 4 * 3600000).toISOString(),
    expected_arrival: new Date(Date.now() + 6 * 3600000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    logistics_id: 'log-102',
    source_id: 'loc-002', // Leh
    destination_id: 'loc-005', // DBO
    supply_type: 'Diesel Winter Grade (-30C)',
    quantity: 1500,
    unit: 'KiloLiters',
    route_id: 'rt-004',
    status: 'Dispatched',
    dispatch_time: new Date(Date.now() - 1 * 3600000).toISOString(),
    expected_arrival: new Date(Date.now() + 10 * 3600000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    logistics_id: 'log-103',
    source_id: 'loc-001', // Srinagar
    destination_id: 'loc-003', // Kargil
    supply_type: 'Ammunition 155mm Artillery',
    quantity: 2500,
    unit: 'Rounds',
    route_id: 'rt-001',
    status: 'Recommended',
    dispatch_time: null,
    expected_arrival: new Date(Date.now() + 18 * 3600000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    logistics_id: 'log-104',
    source_id: 'loc-002', // Leh
    destination_id: 'loc-004', // Siachen
    supply_type: 'Medical Plasma & Oxygen Cylinders',
    quantity: 500,
    unit: 'Units',
    route_id: 'rt-003',
    status: 'Recommended',
    dispatch_time: null,
    expected_arrival: new Date(Date.now() + 12 * 3600000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    logistics_id: 'log-105',
    source_id: 'loc-001', // Srinagar
    destination_id: 'loc-002', // Leh
    supply_type: 'Aviation Turbine Fuel (ATF-Winter)',
    quantity: 400,
    unit: 'KiloLiters',
    route_id: 'rt-005',
    status: 'Delivered',
    dispatch_time: new Date(Date.now() - 24 * 3600000).toISOString(),
    expected_arrival: new Date(Date.now() - 4 * 3600000).toISOString(),
    actual_arrival: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

export const INITIAL_CONSUMPTION: ConsumptionRecord[] = [
  {
    id: 'con-001',
    location_id: 'loc-004', // Siachen
    supply_type: 'Extreme Cold Climate Rations (ECC)',
    consumption_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    quantity_consumed: 320,
    unit: 'Rations',
    created_at: new Date().toISOString()
  },
  {
    id: 'con-002',
    location_id: 'loc-004', // Siachen
    supply_type: 'Medical Plasma & Oxygen Cylinders',
    consumption_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    quantity_consumed: 28,
    unit: 'Units',
    created_at: new Date().toISOString()
  },
  {
    id: 'con-003',
    location_id: 'loc-005', // DBO
    supply_type: 'Diesel Winter Grade (-30C)',
    consumption_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    quantity_consumed: 140,
    unit: 'KiloLiters',
    created_at: new Date().toISOString()
  },
  {
    id: 'con-004',
    location_id: 'loc-002', // Leh
    supply_type: 'Aviation Turbine Fuel (ATF-Winter)',
    consumption_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    quantity_consumed: 42,
    unit: 'KiloLiters',
    created_at: new Date().toISOString()
  },
  {
    id: 'con-005',
    location_id: 'loc-003', // Kargil
    supply_type: 'Ammunition 155mm Artillery',
    consumption_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    quantity_consumed: 150,
    unit: 'Rounds',
    created_at: new Date().toISOString()
  }
];
