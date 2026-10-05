/**
 * Inventory Intelligence Repository Layer
 * Interacts with Supabase PostgreSQL tables:
 * - public.locations
 * - public.inventory
 * - public.consumption
 * - public.demand_forecasts
 * - public.routes
 *
 * Uses dataService fallback cache when operating in local demo / disconnected mode.
 */

import { supabase } from '../lib/supabase';
import { Location, InventoryItem, ConsumptionRecord, LogisticsRoute } from '../types/schema';
import { dataService } from '../services/dataService';
import { INVENTORY_CONFIG } from './inventory.config';

const db = (tableName: string) => supabase.from(tableName as any) as any;

export interface ForecastRecord {
  forecast_id: string;
  location_id: string;
  supply_type: string;
  forecast_date: string;
  predicted_quantity: number;
  lower_bound?: number | null;
  upper_bound?: number | null;
  confidence?: number | null;
  model_version: string;
  created_at?: string;
}

export class InventoryRepository {
  /**
   * Fetch all base locations
   */
  async getLocations(): Promise<Location[]> {
    return await dataService.getLocations();
  }

  /**
   * Fetch inventory items, optionally filtered by location and supply type
   */
  async getInventory(locationId?: string, supplyType?: string): Promise<InventoryItem[]> {
    try {
      let query = db('inventory').select('*');
      if (locationId && locationId !== 'ALL') {
        query = query.eq('location_id', locationId);
      }
      if (supplyType && supplyType !== 'ALL') {
        query = query.eq('supply_type', supplyType);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as InventoryItem[];
      }
    } catch (e) {
      // Fallback below
    }

    const allInv = await dataService.getInventory();
    return allInv.filter(item => {
      const matchLoc = !locationId || locationId === 'ALL' || item.location_id === locationId;
      const matchSupply = !supplyType || supplyType === 'ALL' || item.supply_type === supplyType;
      return matchLoc && matchSupply;
    });
  }

  /**
   * Fetch consumption logs for a location and supply over the analysis period
   */
  async getConsumption(
    locationId: string,
    supplyType: string,
    periodDays: number = INVENTORY_CONFIG.DEFAULT_ANALYSIS_PERIOD_DAYS
  ): Promise<ConsumptionRecord[]> {
    const cutoffDate = new Date(Date.now() - periodDays * 86400000).toISOString().split('T')[0];

    try {
      const { data, error } = await db('consumption')
        .select('*')
        .eq('location_id', locationId)
        .eq('supply_type', supplyType)
        .gte('consumption_date', cutoffDate)
        .order('consumption_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ConsumptionRecord[];
      }
    } catch (e) {
      // Fallback below
    }

    const allCons = await dataService.getConsumption();
    return allCons
      .filter(c => c.location_id === locationId && c.supply_type === supplyType && c.consumption_date >= cutoffDate)
      .sort((a, b) => a.consumption_date.localeCompare(b.consumption_date));
  }

  /**
   * Fetch demand forecasts for a location and supply
   */
  async getDemandForecasts(
    locationId: string,
    supplyType: string,
    horizonDays: number = INVENTORY_CONFIG.DEFAULT_PLANNING_HORIZON_DAYS
  ): Promise<ForecastRecord[]> {
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await db('demand_forecasts')
        .select('*')
        .eq('location_id', locationId)
        .eq('supply_type', supplyType)
        .gte('forecast_date', todayStr)
        .order('forecast_date', { ascending: true })
        .limit(horizonDays);

      if (!error && data && data.length > 0) {
        return data as ForecastRecord[];
      }
    } catch (e) {
      // Fallback
    }

    return [];
  }

  /**
   * Fetch routes destined to a given location (to derive transit lead times)
   */
  async getIncomingRoutes(destinationLocationId: string): Promise<LogisticsRoute[]> {
    const allRoutes = await dataService.getRoutes();
    return allRoutes.filter(r => r.destination_id === destinationLocationId);
  }

  /**
   * Determine lead time in days for a location and supply item
   * Priority:
   * 1. inventoryItem.lead_time_days (if present in schema/database)
   * 2. Derived from incoming route travel_time_hr
   * 3. Config default
   */
  async resolveLeadTimeDays(
    locationId: string,
    inventoryItem?: InventoryItem
  ): Promise<{ leadTimeDays: number; source: 'INVENTORY_SPECIFIC' | 'ROUTE_DERIVED' | 'CONFIG_DEFAULT' }> {
    // 1. Explicit lead_time_days on inventory item
    if (inventoryItem && (inventoryItem as any).lead_time_days !== undefined) {
      const explicit = Number((inventoryItem as any).lead_time_days);
      if (!isNaN(explicit) && explicit > 0) {
        return { leadTimeDays: explicit, source: 'INVENTORY_SPECIFIC' };
      }
    }

    // 2. Derive from incoming supply route travel time
    const routes = await this.getIncomingRoutes(locationId);
    if (routes.length > 0) {
      const openRoutes = routes.filter(r => r.status !== 'Blocked');
      const targetRoutes = openRoutes.length > 0 ? openRoutes : routes;

      // Find average travel time in hours
      const avgHours = targetRoutes.reduce((sum, r) => sum + Number(r.travel_time_hr), 0) / targetRoutes.length;

      // In high altitude mountain military logistics, convoys travel ~6-8 hrs/day
      // Plus convoy staging and prep time: 1 day prep + travel days
      const days = Math.max(1, Math.ceil(avgHours / 8));
      return { leadTimeDays: days, source: 'ROUTE_DERIVED' };
    }

    // 3. Fallback to default
    return {
      leadTimeDays: INVENTORY_CONFIG.DEFAULT_LEAD_TIME_DAYS,
      source: 'CONFIG_DEFAULT'
    };
  }
}

export const inventoryRepository = new InventoryRepository();
