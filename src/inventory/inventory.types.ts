/**
 * Inventory Intelligence Module Types
 * Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
 * Module 2 — Inventory Intelligence
 */

export type InventoryStatus = 'CRITICAL' | 'HIGH_RISK' | 'AT_RISK' | 'HEALTHY' | 'INSUFFICIENT_DATA';

export type RiskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskType =
  | 'LOW_STOCK'
  | 'STOCKOUT_RISK'
  | 'REORDER_REQUIRED'
  | 'DEMAND_SPIKE'
  | 'INSUFFICIENT_DATA'
  | 'NONE';

export type DemandBasis = 'FORECAST' | 'HISTORICAL_AVERAGE';

export interface DailyHistoricalPoint {
  date: string;
  quantity: number;
}

export interface DailyForecastPointWithCumulative {
  date: string;
  predicted_quantity: number;
  cumulative_demand: number;
  remaining_inventory: number;
  lower_bound?: number | null;
  upper_bound?: number | null;
  confidence?: number | null;
}

export interface InventoryIntelligenceResult {
  // Identification
  location_id: string;
  location_name: string;
  terrain?: string;
  supply_type: string;
  unit: string;

  // Feature 1: Current Inventory
  current_inventory: number;

  // Analysis Configuration
  analysis_period_days: number;
  planning_horizon_days: number;

  // Feature 2: Average Daily Consumption
  average_daily_consumption: number | null;
  consumption_std_dev: number | null;
  total_period_consumption: number;
  recorded_days_count: number;

  // Feature 3: Days of Supply
  days_of_supply: number | null;
  days_of_supply_display: string; // e.g. "4.9 days" or "N/A"

  // Feature 5, 6, 7: Lead Time, Safety Stock & Reorder Point
  lead_time_days: number;
  lead_time_source: 'INVENTORY_SPECIFIC' | 'ROUTE_DERIVED' | 'CONFIG_DEFAULT';
  expected_lead_time_demand: number | null;
  safety_stock: number;
  safety_stock_method: 'DATABASE_SPECIFIED' | 'STATISTICAL_Z' | 'FALLBACK';
  reorder_point: number | null;

  // Feature 8: Should Reorder?
  reorder_required: boolean;

  // Feature 9: Recommended Reorder Quantity & Target Stock
  target_stock_level: number | null;
  recommended_reorder_quantity: number;

  // Feature 10 & 13: Forecast Integration & Projected Shortage
  demand_basis: DemandBasis;
  predicted_demand: number | null;
  projected_shortage: number;

  // Feature 11: Projected Stockout
  projected_stockout_days: number | null;
  projected_stockout_date: string | null;
  stockout_day_index: number | null; // e.g., 5 for "Day 5"
  stockout_projection_narrative: string;

  // Feature 4, 12, 16, 17: Inventory Risk & Status
  status: InventoryStatus;
  risk_level: RiskPriority;
  risk_types: RiskType[];
  risk_reasoning: string;

  // Feature 24: Dynamic Inventory Insight
  insight_summary: string;

  // Feature 25: Recommended Action (Decision-Support)
  recommended_action: {
    action: string;
    quantity: number;
    priority: RiskPriority;
    reason: string;
  };

  // Data flags & series for visualization
  has_insufficient_data: boolean;
  warning_messages: string[];
  historical_series: DailyHistoricalPoint[];
  forecast_series: DailyForecastPointWithCumulative[];
}

export interface MultiLocationInventoryRow {
  location_id: string;
  location_name: string;
  location_type: string;
  terrain: string;
  supply_type: string;
  unit: string;
  current_inventory: number;
  average_daily_consumption: number | null;
  days_of_supply: number | null;
  days_of_supply_display: string;
  reorder_point: number | null;
  projected_shortage: number;
  recommended_reorder_quantity: number;
  reorder_required: boolean;
  status: InventoryStatus;
  risk_level: RiskPriority;
  demand_basis: DemandBasis;
}

export interface InventoryQueryParams {
  location_id: string;
  supply_type: string;
  analysis_period_days?: number;
  planning_horizon_days?: number;
  custom_lead_time_days?: number;
  use_forecast?: boolean;
}
