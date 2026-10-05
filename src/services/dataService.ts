import { supabase } from '../lib/supabase';
import { Location, InventoryItem, ConsumptionRecord, LogisticsRoute, LogisticsMovement } from '../types/schema';
import {
  INITIAL_LOCATIONS,
  INITIAL_INVENTORY,
  INITIAL_ROUTES,
  INITIAL_LOGISTICS,
  INITIAL_CONSUMPTION
} from '../data/initialData';
import { generateSyntheticHistoricalConsumption } from '../data/seedForecastingData';
import { generate180DaySimulatedConsumption } from '../data/seedInventoryData';

// Memory cache fallback state - pre-populated with 180-day synthetic history for ML forecasting & Inventory Intelligence
const syntheticHistory = [
  ...generate180DaySimulatedConsumption(INITIAL_LOCATIONS),
  ...generateSyntheticHistoricalConsumption(INITIAL_LOCATIONS)
];
let memoryLocations = [...INITIAL_LOCATIONS];
let memoryInventory = [...INITIAL_INVENTORY];
let memoryRoutes = [...INITIAL_ROUTES];
let memoryLogistics = [...INITIAL_LOGISTICS];
let memoryConsumption = [...syntheticHistory, ...INITIAL_CONSUMPTION];

// Helper to access Supabase table safely with fallback typing
const db = (tableName: string) => supabase.from(tableName as any) as any;

export const dataService = {
  // Check if Supabase connection is active
  async checkSupabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await db('locations').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Locations
  async getLocations(): Promise<Location[]> {
    try {
      const { data, error } = await db('locations').select('*');
      if (error || !data || data.length === 0) {
        return memoryLocations;
      }
      memoryLocations = data as Location[];
      return memoryLocations;
    } catch {
      return memoryLocations;
    }
  },

  async addLocation(location: Omit<Location, 'location_id' | 'created_at'>): Promise<Location> {
    const newLoc: Location = {
      ...location,
      location_id: 'loc-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await db('locations').insert([newLoc]).select().single();
      if (!error && data) {
        memoryLocations.push(data as Location);
        return data as Location;
      }
    } catch (e) {
      console.warn('Supabase insert failed, using local state:', e);
    }
    memoryLocations.push(newLoc);
    return newLoc;
  },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await db('inventory').select('*');
      if (error || !data || data.length === 0) {
        return memoryInventory;
      }
      memoryInventory = data as InventoryItem[];
      return memoryInventory;
    } catch {
      return memoryInventory;
    }
  },

  async addOrUpdateInventory(item: Omit<InventoryItem, 'inventory_id' | 'last_updated'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      inventory_id: 'inv-' + Math.random().toString(36).substr(2, 9),
      last_updated: new Date().toISOString()
    };

    try {
      const { data, error } = await db('inventory').insert([newItem]).select().single();
      if (!error && data) {
        memoryInventory.push(data as InventoryItem);
        return data as InventoryItem;
      }
    } catch (e) {
      console.warn('Supabase inventory write failed, updating local state:', e);
    }

    const existingIdx = memoryInventory.findIndex(
      i => i.location_id === item.location_id && i.supply_type === item.supply_type
    );
    if (existingIdx >= 0) {
      memoryInventory[existingIdx] = {
        ...memoryInventory[existingIdx],
        quantity: item.quantity,
        safety_stock: item.safety_stock,
        last_updated: new Date().toISOString()
      };
      return memoryInventory[existingIdx];
    } else {
      memoryInventory.push(newItem);
      return newItem;
    }
  },

  // Routes
  async getRoutes(): Promise<LogisticsRoute[]> {
    try {
      const { data, error } = await db('routes').select('*');
      if (error || !data || data.length === 0) {
        return memoryRoutes;
      }
      memoryRoutes = data as LogisticsRoute[];
      return memoryRoutes;
    } catch {
      return memoryRoutes;
    }
  },

  async updateRouteStatus(routeId: string, status: LogisticsRoute['status'], weather_status: LogisticsRoute['weather_status']): Promise<void> {
    try {
      await db('routes').update({ status, weather_status }).eq('route_id', routeId);
    } catch (e) {
      console.warn('Supabase route update failed:', e);
    }
    const idx = memoryRoutes.findIndex(r => r.route_id === routeId);
    if (idx >= 0) {
      memoryRoutes[idx] = { ...memoryRoutes[idx], status, weather_status };
    }
  },

  // Logistics Movements
  async getLogistics(): Promise<LogisticsMovement[]> {
    try {
      const { data, error } = await db('logistics').select('*');
      if (error || !data || data.length === 0) {
        return memoryLogistics;
      }
      memoryLogistics = data as LogisticsMovement[];
      return memoryLogistics;
    } catch {
      return memoryLogistics;
    }
  },

  async addLogisticsMovement(movement: Omit<LogisticsMovement, 'logistics_id' | 'created_at'>): Promise<LogisticsMovement> {
    const newMov: LogisticsMovement = {
      ...movement,
      logistics_id: 'log-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await db('logistics').insert([newMov]).select().single();
      if (!error && data) {
        memoryLogistics.push(data as LogisticsMovement);
        return data as LogisticsMovement;
      }
    } catch (e) {
      console.warn('Supabase logistics write failed:', e);
    }
    memoryLogistics.push(newMov);
    return newMov;
  },

  async updateLogisticsStatus(logisticsId: string, status: LogisticsMovement['status']): Promise<void> {
    const patch: Partial<LogisticsMovement> = { status };
    if (status === 'Dispatched') patch.dispatch_time = new Date().toISOString();
    if (status === 'Delivered') patch.actual_arrival = new Date().toISOString();

    try {
      await db('logistics').update(patch).eq('logistics_id', logisticsId);
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }

    const idx = memoryLogistics.findIndex(l => l.logistics_id === logisticsId);
    if (idx >= 0) {
      memoryLogistics[idx] = { ...memoryLogistics[idx], ...patch };
    }
  },

  // Consumption
  async getConsumption(): Promise<ConsumptionRecord[]> {
    try {
      const { data, error } = await db('consumption').select('*').order('consumption_date', { ascending: true });
      if (error || !data || data.length === 0) {
        return memoryConsumption;
      }
      // If DB has fewer than 20 records, merge synthetic demo history to ensure ML models have rich training data
      if (data.length < 20) {
        return [...memoryConsumption, ...(data as ConsumptionRecord[])];
      }
      memoryConsumption = data as ConsumptionRecord[];
      return memoryConsumption;
    } catch {
      return memoryConsumption;
    }
  },

  async addConsumption(record: Omit<ConsumptionRecord, 'id' | 'created_at'>): Promise<ConsumptionRecord> {
    const newRecord: ConsumptionRecord = {
      ...record,
      id: 'con-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await db('consumption').insert([newRecord]).select().single();
      if (!error && data) {
        memoryConsumption.push(data as ConsumptionRecord);
        return data as ConsumptionRecord;
      }
    } catch (e) {
      console.warn('Supabase consumption write failed:', e);
    }
    memoryConsumption.push(record as ConsumptionRecord);
    return newRecord;
  },

  // Reseed local demo dataset
  reseedDemoData(): void {
    const freshHistory = [
      ...generate180DaySimulatedConsumption(memoryLocations),
      ...generateSyntheticHistoricalConsumption(memoryLocations)
    ];
    memoryConsumption = [...freshHistory];
  }
};
