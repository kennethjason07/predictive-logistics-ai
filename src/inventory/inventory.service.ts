/**
 * Inventory Intelligence Service
 * Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
 *
 * Core orchestrator combining:
 * 1. Supabase Database retrieval (via InventoryRepository)
 * 2. Pure deterministic calculations (via InventoryCalculator)
 * 3. AI Demand Forecasting consumption (Mode A vs Mode B)
 * 4. Risk determination & Decision-support action recommendations
 */

import { inventoryRepository } from './inventory.repository';
import { INVENTORY_CONFIG } from './inventory.config';
import {
  InventoryIntelligenceResult,
  MultiLocationInventoryRow,
  InventoryQueryParams,
  DemandBasis,
  DailyForecastPointWithCumulative
} from './inventory.types';
import {
  calculateAverageDailyConsumption,
  calculateDaysOfSupply,
  formatDaysOfSupply,
  calculateExpectedLeadTimeDemand,
  calculateSafetyStock,
  calculateReorderPoint,
  calculateShouldReorder,
  calculateTargetStockLevel,
  calculateRecommendedReorderQuantity,
  calculateProjectedShortage,
  calculateProjectedStockout,
  assessInventoryRisk,
  generateInventoryInsight,
  generateRecommendedAction
} from './inventory.calculator';
import { generateDemandForecast } from '../forecasting/forecastingService';
import { dataService } from '../services/dataService';

export class InventoryService {
  /**
   * Retrieves complete Inventory Intelligence for a specific Location + Supply
   */
  async getInventoryIntelligence(
    params: InventoryQueryParams
  ): Promise<InventoryIntelligenceResult> {
    const {
      location_id,
      supply_type,
      analysis_period_days = INVENTORY_CONFIG.DEFAULT_ANALYSIS_PERIOD_DAYS,
      planning_horizon_days = INVENTORY_CONFIG.DEFAULT_PLANNING_HORIZON_DAYS,
      custom_lead_time_days,
      use_forecast = true
    } = params;

    // 1. Fetch metadata & current stock
    const locations = await inventoryRepository.getLocations();
    const location = locations.find(l => l.location_id === location_id);
    const locationName = location ? location.name : location_id;
    const terrain = location?.terrain;

    const inventoryItems = await inventoryRepository.getInventory(location_id, supply_type);
    const currentItem = inventoryItems.find(
      i => i.location_id === location_id && i.supply_type === supply_type
    );

    const currentInventory = currentItem ? Number(currentItem.quantity) : 0;
    const unit = currentItem ? currentItem.unit : 'Units';
    const dbSafetyStock = currentItem ? Number(currentItem.safety_stock) : 0;

    // 2. Fetch Historical Consumption Logs
    const consumptionRecords = await inventoryRepository.getConsumption(
      location_id,
      supply_type,
      analysis_period_days
    );

    // 3. FEATURE 2: Calculate Average Daily Consumption & Std Dev
    const consumptionStats = calculateAverageDailyConsumption(
      consumptionRecords,
      analysis_period_days
    );
    const avgDailyConsumption = consumptionStats.averageDailyConsumption;
    const stdDev = consumptionStats.stdDev;
    const hasInsufficientData = consumptionStats.insufficientData;

    // 4. FEATURE 3: Calculate Days of Supply
    const daysOfSupply = calculateDaysOfSupply(currentInventory, avgDailyConsumption);
    const daysOfSupplyDisplay = formatDaysOfSupply(daysOfSupply);

    // 5. FEATURE 5: Replenishment Lead Time
    let leadTimeDays: number = INVENTORY_CONFIG.DEFAULT_LEAD_TIME_DAYS;
    let leadTimeSource: 'INVENTORY_SPECIFIC' | 'ROUTE_DERIVED' | 'CONFIG_DEFAULT' = 'CONFIG_DEFAULT';

    if (custom_lead_time_days && custom_lead_time_days > 0) {
      leadTimeDays = custom_lead_time_days;
      leadTimeSource = 'INVENTORY_SPECIFIC';
    } else {
      const resolved = await inventoryRepository.resolveLeadTimeDays(location_id, currentItem);
      leadTimeDays = resolved.leadTimeDays;
      leadTimeSource = resolved.source;
    }

    // Expected Demand During Lead Time
    const expectedLeadTimeDemand = calculateExpectedLeadTimeDemand(
      avgDailyConsumption,
      leadTimeDays
    );

    // 6. FEATURE 6: Safety Stock
    const safetyStockResult = calculateSafetyStock({
      dbSafetyStock,
      stdDev,
      leadTimeDays,
      zValue: INVENTORY_CONFIG.DEFAULT_SERVICE_LEVEL_Z,
      avgDailyConsumption
    });
    const safetyStock = safetyStockResult.safetyStock;
    const safetyStockMethod = safetyStockResult.method;

    // 7. FEATURE 7: Reorder Point
    const reorderPoint = calculateReorderPoint(expectedLeadTimeDemand, safetyStock);

    // 8. FEATURE 8: Should Reorder?
    const reorderRequired = calculateShouldReorder(currentInventory, reorderPoint);

    // 9. FEATURE 10 & 13: Mode A (Forecast Available) vs Mode B (Forecast Unavailable)
    let demandBasis: DemandBasis = 'HISTORICAL_AVERAGE';
    let predictedDemand: number | null = null;
    let dailyForecastWithCum: DailyForecastPointWithCumulative[] = [];

    // Attempt Forecast if requested
    if (use_forecast) {
      try {
        // Check for existing DB forecasts first
        const dbForecasts = await inventoryRepository.getDemandForecasts(
          location_id,
          supply_type,
          planning_horizon_days
        );

        if (dbForecasts && dbForecasts.length > 0) {
          demandBasis = 'FORECAST';
          let cum = 0;
          dailyForecastWithCum = dbForecasts.map(f => {
            cum += Number(f.predicted_quantity);
            return {
              date: f.forecast_date,
              predicted_quantity: Number(f.predicted_quantity),
              cumulative_demand: cum,
              remaining_inventory: Math.max(0, currentInventory - cum),
              lower_bound: f.lower_bound,
              upper_bound: f.upper_bound,
              confidence: f.confidence
            };
          });
          predictedDemand = Math.round(cum);
        } else {
          // Generate on-the-fly forecast using the forecasting engine
          const allLocs = await dataService.getLocations();
          const allInv = await dataService.getInventory();
          const allCons = await dataService.getConsumption();
          const allRoutes = await dataService.getRoutes();

          const validHorizon = ([1, 3, 7, 14].includes(planning_horizon_days)
            ? planning_horizon_days
            : 7) as 1 | 3 | 7 | 14;

          const forecast = await generateDemandForecast(
            location_id,
            supply_type,
            validHorizon,
            allLocs,
            allInv,
            allCons,
            allRoutes,
            'rf-v1'
          );

          if (forecast && !forecast.insufficient_data && forecast.daily_forecast.length > 0) {
            demandBasis = 'FORECAST';
            let cum = 0;
            dailyForecastWithCum = forecast.daily_forecast.map(p => {
              cum += p.predicted_quantity;
              return {
                date: p.date,
                predicted_quantity: p.predicted_quantity,
                cumulative_demand: cum,
                remaining_inventory: Math.max(0, currentInventory - cum),
                lower_bound: p.lower_bound,
                upper_bound: p.upper_bound,
                confidence: p.confidence
              };
            });
            predictedDemand = forecast.total_predicted_demand;
          }
        }
      } catch (e) {
        console.warn('Forecast unavailable, falling back to historical average:', e);
      }
    }

    // Mode B Fallback: Historical Average
    if (predictedDemand === null) {
      demandBasis = 'HISTORICAL_AVERAGE';
      if (avgDailyConsumption !== null && avgDailyConsumption > 0) {
        predictedDemand = Math.round(avgDailyConsumption * planning_horizon_days);

        // Generate synthetic projected daily sequence for visualization
        let cum = 0;
        const today = new Date();
        dailyForecastWithCum = [];
        for (let i = 1; i <= planning_horizon_days; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          cum += Math.round(avgDailyConsumption);
          dailyForecastWithCum.push({
            date: dateStr,
            predicted_quantity: Math.round(avgDailyConsumption),
            cumulative_demand: cum,
            remaining_inventory: Math.max(0, currentInventory - cum)
          });
        }
      } else {
        predictedDemand = 0;
      }
    }

    // 10. FEATURE 10: Projected Shortage
    const projectedShortage = calculateProjectedShortage(predictedDemand, currentInventory);

    // 11. FEATURE 9: Target Stock Level & Recommended Reorder Quantity
    const expectedHorizonDemand = predictedDemand;
    const targetStockLevel = calculateTargetStockLevel(expectedHorizonDemand, safetyStock);
    const recommendedReorderQuantity = calculateRecommendedReorderQuantity(
      targetStockLevel,
      currentInventory
    );

    // 12. FEATURE 11: Projected Stockout
    const stockoutResult = calculateProjectedStockout({
      currentInventory,
      avgDailyConsumption,
      dailyForecast: dailyForecastWithCum
    });

    // 13. FEATURE 4, 12, 16, 17: Inventory Risk Assessment
    const riskAssessment = assessInventoryRisk({
      daysOfSupply,
      currentInventory,
      reorderRequired,
      projectedShortage,
      hasInsufficientData
    });

    // 14. FEATURE 24: Dynamic Inventory Insight
    const insightSummary = generateInventoryInsight({
      locationName,
      supplyType: supply_type,
      unit,
      currentInventory,
      daysOfSupply,
      projectedShortage,
      demandBasis,
      horizonDays: planning_horizon_days,
      reorderRequired
    });

    // 15. FEATURE 25: Recommended Action
    const recommendedAction = generateRecommendedAction({
      status: riskAssessment.status,
      riskLevel: riskAssessment.riskLevel,
      reorderRequired,
      recommendedQuantity: recommendedReorderQuantity,
      projectedShortage,
      horizonDays: planning_horizon_days,
      unit
    });

    // 16. Warnings
    const warningMessages: string[] = [];
    if (hasInsufficientData) {
      warningMessages.push('Insufficient historical consumption logs recorded (requires at least 1 logged entry).');
    }
    if (currentInventory === 0) {
      warningMessages.push('Immediate stockout: Base currently has ZERO inventory on hand.');
    }
    if (daysOfSupply !== null && daysOfSupply < INVENTORY_CONFIG.THRESHOLDS.CRITICAL_DAYS) {
      warningMessages.push(`Days of supply is critically low (< ${INVENTORY_CONFIG.THRESHOLDS.CRITICAL_DAYS} days).`);
    }

    // Historical series for chart
    const historicalSeries = consumptionRecords.map(c => ({
      date: c.consumption_date,
      quantity: Number(c.quantity_consumed)
    }));

    return {
      location_id,
      location_name: locationName,
      terrain,
      supply_type,
      unit,
      current_inventory: currentInventory,
      analysis_period_days,
      planning_horizon_days,
      average_daily_consumption: avgDailyConsumption,
      consumption_std_dev: stdDev,
      total_period_consumption: consumptionStats.totalConsumption,
      recorded_days_count: consumptionStats.count,
      days_of_supply: daysOfSupply,
      days_of_supply_display: daysOfSupplyDisplay,
      lead_time_days: leadTimeDays,
      lead_time_source: leadTimeSource,
      expected_lead_time_demand: expectedLeadTimeDemand,
      safety_stock: safetyStock,
      safety_stock_method: safetyStockMethod,
      reorder_point: reorderPoint,
      reorder_required: reorderRequired,
      target_stock_level: targetStockLevel,
      recommended_reorder_quantity: recommendedReorderQuantity,
      demand_basis: demandBasis,
      predicted_demand: predictedDemand,
      projected_shortage: projectedShortage,
      projected_stockout_days: stockoutResult.stockoutDays,
      projected_stockout_date: stockoutResult.stockoutDate,
      stockout_day_index: stockoutResult.stockoutDayIndex,
      stockout_projection_narrative: stockoutResult.narrative,
      status: riskAssessment.status,
      risk_level: riskAssessment.riskLevel,
      risk_types: riskAssessment.riskTypes,
      risk_reasoning: riskAssessment.reasoning,
      insight_summary: insightSummary,
      recommended_action: recommendedAction,
      has_insufficient_data: hasInsufficientData,
      warning_messages: warningMessages,
      historical_series: historicalSeries,
      forecast_series: dailyForecastWithCum
    };
  }

  /**
   * FEATURE 26: Multi-Location Inventory Overview
   * Compiles inventory health across all forward operating bases & supply hubs
   */
  async getMultiLocationInventoryOverview(
    periodDays: number = INVENTORY_CONFIG.DEFAULT_ANALYSIS_PERIOD_DAYS,
    horizonDays: number = INVENTORY_CONFIG.DEFAULT_PLANNING_HORIZON_DAYS
  ): Promise<MultiLocationInventoryRow[]> {
    const locations = await inventoryRepository.getLocations();
    const inventory = await inventoryRepository.getInventory();

    const rows: MultiLocationInventoryRow[] = [];

    for (const item of inventory) {
      const loc = locations.find(l => l.location_id === item.location_id);
      const locName = loc ? loc.name : item.location_id;
      const terrain = loc?.terrain || 'Standard';
      const locType = loc?.type || 'Forward Base';

      // Lightweight intelligence calculation per item
      const consRecords = await inventoryRepository.getConsumption(
        item.location_id,
        item.supply_type,
        periodDays
      );
      const consStats = calculateAverageDailyConsumption(consRecords, periodDays);
      const avgDaily = consStats.averageDailyConsumption;
      const daysOfSupply = calculateDaysOfSupply(item.quantity, avgDaily);

      const resolvedLeadTime = await inventoryRepository.resolveLeadTimeDays(item.location_id, item);
      const expectedLeadTimeDemand = calculateExpectedLeadTimeDemand(avgDaily, resolvedLeadTime.leadTimeDays);
      const safetyStockResult = calculateSafetyStock({
        dbSafetyStock: item.safety_stock,
        stdDev: consStats.stdDev,
        leadTimeDays: resolvedLeadTime.leadTimeDays,
        avgDailyConsumption: avgDaily
      });
      const reorderPoint = calculateReorderPoint(expectedLeadTimeDemand, safetyStockResult.safetyStock);
      const reorderRequired = calculateShouldReorder(item.quantity, reorderPoint);

      const predictedDemand = avgDaily !== null ? Math.round(avgDaily * horizonDays) : 0;
      const projectedShortage = calculateProjectedShortage(predictedDemand, item.quantity);
      const targetStock = calculateTargetStockLevel(predictedDemand, safetyStockResult.safetyStock);
      const recommendedReorder = calculateRecommendedReorderQuantity(targetStock, item.quantity);

      const risk = assessInventoryRisk({
        daysOfSupply,
        currentInventory: item.quantity,
        reorderRequired,
        projectedShortage,
        hasInsufficientData: consStats.insufficientData
      });

      rows.push({
        location_id: item.location_id,
        location_name: locName,
        location_type: locType,
        terrain,
        supply_type: item.supply_type,
        unit: item.unit,
        current_inventory: Number(item.quantity),
        average_daily_consumption: avgDaily,
        days_of_supply: daysOfSupply,
        days_of_supply_display: formatDaysOfSupply(daysOfSupply),
        reorder_point: reorderPoint,
        projected_shortage: projectedShortage,
        recommended_reorder_quantity: recommendedReorder,
        reorder_required: reorderRequired,
        status: risk.status,
        risk_level: risk.riskLevel,
        demand_basis: 'HISTORICAL_AVERAGE'
      });
    }

    return rows;
  }
}

export const inventoryService = new InventoryService();
