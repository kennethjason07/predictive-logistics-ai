/**
 * Inventory Intelligence API Client
 * Provides typed access to Module 2 endpoints:
 * - GET /api/inventory/intelligence
 * - GET /api/inventory/overview
 */

import { inventoryService } from './inventory.service';
import {
  InventoryIntelligenceResult,
  MultiLocationInventoryRow,
  InventoryQueryParams
} from './inventory.types';

export const inventoryApi = {
  /**
   * GET /api/inventory/intelligence
   * Query parameters: location_id, supply_id / supply_type, period_days, horizon_days, use_forecast
   */
  async getIntelligence(params: InventoryQueryParams): Promise<InventoryIntelligenceResult> {
    // Attempt standard fetch to /api/inventory/intelligence if in browser
    if (typeof window !== 'undefined' && window.location) {
      try {
        const query = new URLSearchParams({
          location_id: params.location_id,
          supply_type: params.supply_type,
          period_days: String(params.analysis_period_days || 30),
          horizon_days: String(params.planning_horizon_days || 7),
          use_forecast: String(params.use_forecast !== false)
        });

        const resp = await fetch(`/api/inventory/intelligence?${query.toString()}`);
        if (resp.ok) {
          const json = await resp.json();
          return json as InventoryIntelligenceResult;
        }
      } catch (err) {
        // Fallback to direct service execution
      }
    }

    // Direct service execution (deterministic calculation pipeline)
    return await inventoryService.getInventoryIntelligence(params);
  },

  /**
   * GET /api/inventory/overview
   */
  async getOverview(
    periodDays: number = 30,
    horizonDays: number = 7
  ): Promise<MultiLocationInventoryRow[]> {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const query = new URLSearchParams({
          period_days: String(periodDays),
          horizon_days: String(horizonDays)
        });
        const resp = await fetch(`/api/inventory/overview?${query.toString()}`);
        if (resp.ok) {
          const json = await resp.json();
          return json as MultiLocationInventoryRow[];
        }
      } catch (err) {
        // Fallback to direct service
      }
    }

    return await inventoryService.getMultiLocationInventoryOverview(periodDays, horizonDays);
  }
};
