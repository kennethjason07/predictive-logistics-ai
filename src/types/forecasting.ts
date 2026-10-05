export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  predicted_quantity: number;
  lower_bound: number | null;
  upper_bound: number | null;
  confidence: number | null; // 0 to 1
}

export interface ModelMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error (%)
}

export interface ForecastResult {
  location_id: string;
  location_name: string;
  supply_type: string;
  unit: string;
  horizon_days: 1 | 3 | 7 | 14;
  total_predicted_demand: number;
  current_inventory: number;
  projected_shortage: number; // max(0, predicted_demand - current_inventory)
  days_of_supply: number | null; // current_inventory / avg_daily_consumption
  status: 'SUFFICIENT' | 'SHORTAGE';
  daily_forecast: DailyForecastPoint[];
  historical_data: { date: string; quantity: number }[];
  insight_text: string;
  model_version: 'baseline-v1' | 'rf-v1';
  metrics: ModelMetrics;
  created_at: string;
  insufficient_data?: boolean;
  error_message?: string;
}

export interface EngineeredFeatureRow {
  date: string;
  quantity: number;
  day_of_week: number; // 0 (Sun) - 6 (Sat)
  day_of_month: number;
  month: number;
  week_of_year: number;
  is_weekend: boolean;
  season: 'Winter' | 'Spring' | 'Summer' | 'Autumn';
  lag_1: number;
  lag_3: number;
  lag_7: number;
  rolling_mean_3: number;
  rolling_mean_7: number;
  rolling_mean_14: number;
  rolling_std_7: number;
  weather_factor?: number; // Optional weather multiplier
}
