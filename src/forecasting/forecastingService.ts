import { Location, InventoryItem, ConsumptionRecord, LogisticsRoute } from '../types/schema';
import { ForecastResult } from '../types/forecasting';
import { validateAndCleanConsumptionData } from './dataValidation';
import { BaselineWeightedModel } from './models/baselineModel';
import { RandomForestModel } from './models/treeModel';
import { IForecastingModel } from './models/modelInterface';
import { supabase } from '../lib/supabase';

// Model Registry
const baselineModel = new BaselineWeightedModel();
const rfModel = new RandomForestModel();

export function getModel(version: 'baseline-v1' | 'rf-v1'): IForecastingModel {
  if (version === 'rf-v1') return rfModel;
  return baselineModel;
}

/**
 * Main Forecasting Engine
 * Accepts location_id, supply_type, horizon_days (1, 3, 7, 14) and model selection.
 */
export async function generateDemandForecast(
  locationId: string,
  supplyType: string,
  horizonDays: 1 | 3 | 7 | 14 = 7,
  locations: Location[],
  inventory: InventoryItem[],
  consumption: ConsumptionRecord[],
  routes: LogisticsRoute[],
  modelVersion: 'baseline-v1' | 'rf-v1' = 'baseline-v1'
): Promise<ForecastResult> {
  const loc = locations.find(l => l.location_id === locationId);
  const locName = loc ? loc.name : locationId || 'Unknown Base';

  // Find inventory item for unit & current quantity
  const invItem = inventory.find(
    i => i.location_id === locationId && i.supply_type === supplyType
  );
  const currentInventory = invItem ? Number(invItem.quantity) : 0;
  const unit = invItem ? invItem.unit : 'Units';

  // Find route weather if available for this location
  const locRoute = routes.find(
    r => r.destination_id === locationId || r.source_id === locationId
  );
  const weatherStatus = locRoute?.weather_status || 'Clear';

  // 1. Filter historical consumption for target location & supply_type
  const rawRecords = consumption.filter(
    c => c.location_id === locationId && c.supply_type === supplyType
  );

  // 2. Validate historical data
  const validation = validateAndCleanConsumptionData(rawRecords, 5);

  if (!validation.isValid || validation.cleanedData.length === 0) {
    return {
      location_id: locationId,
      location_name: locName,
      supply_type: supplyType,
      unit,
      horizon_days: horizonDays,
      total_predicted_demand: 0,
      current_inventory: currentInventory,
      projected_shortage: currentInventory > 0 ? 0 : 0,
      days_of_supply: null,
      status: 'SUFFICIENT',
      daily_forecast: [],
      historical_data: [],
      insight_text: `Forecast unavailable: Insufficient historical consumption data recorded for ${locName} (${supplyType}). Minimum 5 historical days of logs required.`,
      model_version: modelVersion,
      metrics: { mae: 0, rmse: 0, mape: 0 },
      created_at: new Date().toISOString(),
      insufficient_data: true,
      error_message: validation.errorMessage
    };
  }

  // 3. Execute Model Predictor
  const model = getModel(modelVersion);
  const modelResult = model.predict(validation.cleanedData, horizonDays, weatherStatus);

  // 4. Aggregations & Calculations
  const totalPredictedDemand = Math.round(
    modelResult.points.reduce((sum, p) => sum + p.predicted_quantity, 0)
  );

  const projectedShortage = Math.max(0, totalPredictedDemand - currentInventory);

  // Calculate average daily consumption from historical data
  const totalHistQty = validation.cleanedData.reduce((sum, r) => sum + r.quantity, 0);
  const avgDailyConsumption = totalHistQty / validation.cleanedData.length;

  let daysOfSupply: number | null = null;
  if (currentInventory === 0) {
    daysOfSupply = 0;
  } else if (avgDailyConsumption > 0) {
    daysOfSupply = Math.round((currentInventory / avgDailyConsumption) * 10) / 10;
  }

  const status: 'SUFFICIENT' | 'SHORTAGE' =
    totalPredictedDemand <= currentInventory ? 'SUFFICIENT' : 'SHORTAGE';

  // 5. Dynamic Decision-Support Insight String Generation
  let insightText = '';
  if (status === 'SHORTAGE') {
    insightText = `Decision Support Insight: ${locName} is predicted to require ${totalPredictedDemand.toLocaleString()} ${unit} of ${supplyType} over the next ${horizonDays} days. Current inventory is ${currentInventory.toLocaleString()} ${unit}, resulting in a projected shortage of ${projectedShortage.toLocaleString()} ${unit} (${daysOfSupply !== null ? daysOfSupply + ' days of supply remaining' : 'immediate stockout risk'}). Recommend dispatching a supply convoy.`;
  } else {
    insightText = `Decision Support Insight: ${locName} is predicted to require ${totalPredictedDemand.toLocaleString()} ${unit} of ${supplyType} over the next ${horizonDays} days. Current inventory is ${currentInventory.toLocaleString()} ${unit}, which provides sufficient buffer (${daysOfSupply !== null ? daysOfSupply + ' days of supply' : 'adequate stock'}). No immediate emergency supply dispatch needed.`;
  }

  // 6. Persist Forecast to Supabase if connected
  try {
    const forecastRowsToInsert = modelResult.points.map(p => ({
      location_id: locationId,
      supply_type: supplyType,
      forecast_date: p.date,
      predicted_quantity: p.predicted_quantity,
      lower_bound: p.lower_bound,
      upper_bound: p.upper_bound,
      confidence: p.confidence,
      model_version: modelVersion
    }));

    await (supabase.from('demand_forecasts') as any).insert(forecastRowsToInsert);
  } catch (e) {
    // Non-blocking log if DB table not yet created
    console.warn('Persisting forecast to Supabase skipped/deferred:', e);
  }

  return {
    location_id: locationId,
    location_name: locName,
    supply_type: supplyType,
    unit,
    horizon_days: horizonDays,
    total_predicted_demand: totalPredictedDemand,
    current_inventory: currentInventory,
    projected_shortage: projectedShortage,
    days_of_supply: daysOfSupply,
    status,
    daily_forecast: modelResult.points,
    historical_data: validation.cleanedData,
    insight_text: insightText,
    model_version: modelVersion,
    metrics: modelResult.metrics,
    created_at: new Date().toISOString()
  };
}
