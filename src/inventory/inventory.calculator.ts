/**
 * Inventory Intelligence Calculation Engine
 * Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
 *
 * Implements deterministic inventory calculations:
 * - Average Daily Consumption (Section 5)
 * - Days of Supply (Section 6)
 * - Expected Demand during Lead Time (Section 8.2)
 * - Safety Stock (Section 9)
 * - Reorder Point (Section 10)
 * - Should Reorder? (Section 11)
 * - Recommended Reorder Quantity (Section 12)
 * - Projected Shortage (Section 14)
 * - Projected Stockout Date & Days (Section 15)
 * - Inventory Risk Engine & Priorities (Section 16 & 17)
 * - Dynamic Insight & Recommended Actions (Section 24 & 25)
 */

import { INVENTORY_CONFIG } from './inventory.config';
import {
  ConsumptionRecord
} from '../types/schema';
import {
  InventoryStatus,
  RiskPriority,
  RiskType,
  DemandBasis,
  DailyForecastPointWithCumulative
} from './inventory.types';

export interface ConsumptionStats {
  averageDailyConsumption: number | null;
  totalConsumption: number;
  count: number;
  stdDev: number | null;
  insufficientData: boolean;
}

/**
 * FEATURE 2: Calculate Average Daily Consumption
 * Average Daily Consumption = Total Consumption During Period / Number of Days
 *
 * Respects analysis period: 7, 14, 30, 60, 90 days.
 * Does NOT invent an average if there is no historical data.
 */
export function calculateAverageDailyConsumption(
  records: ConsumptionRecord[],
  periodDays: number = INVENTORY_CONFIG.DEFAULT_ANALYSIS_PERIOD_DAYS
): ConsumptionStats {
  if (!records || records.length === 0 || periodDays <= 0) {
    return {
      averageDailyConsumption: null,
      totalConsumption: 0,
      count: 0,
      stdDev: null,
      insufficientData: true
    };
  }

  // Filter records within the specified time window
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - periodDays * 86400000);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const recentRecords = records.filter(r => {
    if (!r.consumption_date) return false;
    return r.consumption_date >= cutoffDateStr;
  });

  if (recentRecords.length === 0) {
    return {
      averageDailyConsumption: null,
      totalConsumption: 0,
      count: 0,
      stdDev: null,
      insufficientData: true
    };
  }

  // Reject negative consumption values (data validation)
  const validQuantities = recentRecords
    .map(r => Number(r.quantity_consumed))
    .filter(q => !isNaN(q) && q >= 0);

  if (validQuantities.length === 0) {
    return {
      averageDailyConsumption: null,
      totalConsumption: 0,
      count: 0,
      stdDev: null,
      insufficientData: true
    };
  }

  const totalConsumption = validQuantities.reduce((sum, q) => sum + q, 0);

  // Use the actual period days as divisor (or days count if history is shorter than period)
  // According to specification: Total Consumption During Period / Number of Days
  const daysDivisor = Math.max(1, Math.min(periodDays, validQuantities.length));
  const avg = totalConsumption / daysDivisor;

  // Calculate standard deviation of demand if sufficient samples
  let stdDev: number | null = null;
  if (validQuantities.length >= INVENTORY_CONFIG.MIN_DAYS_FOR_STD_DEV) {
    const mean = totalConsumption / validQuantities.length;
    const variance =
      validQuantities.reduce((acc, q) => acc + Math.pow(q - mean, 2), 0) /
      (validQuantities.length - 1);
    stdDev = Math.sqrt(variance);
  }

  return {
    averageDailyConsumption: avg,
    totalConsumption,
    count: validQuantities.length,
    stdDev,
    insufficientData: false
  };
}

/**
 * FEATURE 3: Calculate Days of Supply
 * Days of Supply = Current Inventory / Average Daily Consumption
 *
 * Edge cases:
 * - Inventory = 0 -> 0 days
 * - Average daily consumption = 0 -> null / N/A (Do NOT divide by zero)
 * - No historical consumption -> null
 */
export function calculateDaysOfSupply(
  currentInventory: number,
  avgDailyConsumption: number | null
): number | null {
  if (currentInventory <= 0) {
    return 0;
  }
  if (avgDailyConsumption === null || isNaN(avgDailyConsumption) || avgDailyConsumption <= 0) {
    return null;
  }
  return currentInventory / avgDailyConsumption;
}

/**
 * Formats Days of Supply for UI presentation
 */
export function formatDaysOfSupply(daysOfSupply: number | null): string {
  if (daysOfSupply === null) {
    return 'N/A';
  }
  if (daysOfSupply === 0) {
    return '0.0 days';
  }
  return `${daysOfSupply.toFixed(INVENTORY_CONFIG.DECIMAL_PRECISION.DAYS_OF_SUPPLY)} days`;
}

/**
 * FEATURE 5: Expected Demand During Lead Time
 * Expected Demand During Lead Time = Average Daily Consumption * Lead Time Days
 */
export function calculateExpectedLeadTimeDemand(
  avgDailyConsumption: number | null,
  leadTimeDays: number
): number | null {
  if (avgDailyConsumption === null || avgDailyConsumption < 0 || leadTimeDays < 0) {
    return null;
  }
  return avgDailyConsumption * leadTimeDays;
}

/**
 * FEATURE 6: Safety Stock
 * If database already contains safety_stock > 0, use it.
 * Otherwise calculate: Safety Stock = Z * Standard Deviation of Demand * sqrt(Lead Time)
 * If not enough data, use fallback or return null/N/A.
 */
export function calculateSafetyStock(params: {
  dbSafetyStock?: number;
  stdDev: number | null;
  leadTimeDays: number;
  zValue?: number;
  avgDailyConsumption?: number | null;
}): {
  safetyStock: number;
  method: 'DATABASE_SPECIFIED' | 'STATISTICAL_Z' | 'FALLBACK';
} {
  const {
    dbSafetyStock,
    stdDev,
    leadTimeDays,
    zValue = INVENTORY_CONFIG.DEFAULT_SERVICE_LEVEL_Z,
    avgDailyConsumption
  } = params;

  // 1. Priority: Existing database safety stock
  if (dbSafetyStock !== undefined && dbSafetyStock !== null && dbSafetyStock > 0) {
    return {
      safetyStock: Math.round(dbSafetyStock),
      method: 'DATABASE_SPECIFIED'
    };
  }

  // 2. Statistical calculation if stdDev is available
  if (stdDev !== null && stdDev > 0 && leadTimeDays > 0) {
    const calculated = zValue * stdDev * Math.sqrt(leadTimeDays);
    return {
      safetyStock: Math.max(0, Math.round(calculated)),
      method: 'STATISTICAL_Z'
    };
  }

  // 3. Fallback based on daily consumption and fallback days
  if (avgDailyConsumption && avgDailyConsumption > 0) {
    const fallback = avgDailyConsumption * INVENTORY_CONFIG.FALLBACK_SAFETY_STOCK_DAYS;
    return {
      safetyStock: Math.max(0, Math.round(fallback)),
      method: 'FALLBACK'
    };
  }

  return {
    safetyStock: 0,
    method: 'FALLBACK'
  };
}

/**
 * FEATURE 7: Reorder Point Calculation
 * Reorder Point = Expected Demand During Lead Time + Safety Stock
 */
export function calculateReorderPoint(
  expectedLeadTimeDemand: number | null,
  safetyStock: number
): number | null {
  if (expectedLeadTimeDemand === null) {
    return null;
  }
  return Math.round(expectedLeadTimeDemand + (safetyStock || 0));
}

/**
 * FEATURE 8: Should Reorder?
 * IF Current Inventory <= Reorder Point -> REORDER REQUIRED
 * ELSE -> NO IMMEDIATE REORDER
 */
export function calculateShouldReorder(
  currentInventory: number,
  reorderPoint: number | null
): boolean {
  if (reorderPoint === null) {
    return false;
  }
  return currentInventory <= reorderPoint;
}

/**
 * FEATURE 9: Target Stock Level & Recommended Reorder Quantity
 * Target Stock Level = Expected Demand During Planning Horizon + Safety Stock
 * Recommended Reorder Quantity = max(0, Target Stock Level - Current Inventory)
 */
export function calculateTargetStockLevel(
  expectedHorizonDemand: number | null,
  safetyStock: number
): number | null {
  if (expectedHorizonDemand === null) {
    return null;
  }
  return Math.round(expectedHorizonDemand + (safetyStock || 0));
}

export function calculateRecommendedReorderQuantity(
  targetStockLevel: number | null,
  currentInventory: number
): number {
  if (targetStockLevel === null) {
    return 0;
  }
  return Math.max(0, Math.round(targetStockLevel - currentInventory));
}

/**
 * FEATURE 10: Projected Shortage
 * Projected Shortage = max(0, Predicted Demand - Current Inventory)
 */
export function calculateProjectedShortage(
  predictedDemand: number | null,
  currentInventory: number
): number {
  if (predictedDemand === null) {
    return 0;
  }
  return Math.max(0, Math.round(predictedDemand - currentInventory));
}

/**
 * FEATURE 11: Projected Stockout Days & Simulation
 * Determines when inventory will run out, evaluating cumulative predicted demand
 * per day or falling back to average daily consumption.
 */
export function calculateProjectedStockout(params: {
  currentInventory: number;
  avgDailyConsumption: number | null;
  dailyForecast?: { date: string; predicted_quantity: number }[];
}): {
  stockoutDays: number | null;
  stockoutDate: string | null;
  stockoutDayIndex: number | null;
  narrative: string;
} {
  const { currentInventory, avgDailyConsumption, dailyForecast } = params;

  if (currentInventory <= 0) {
    return {
      stockoutDays: 0,
      stockoutDate: new Date().toISOString().split('T')[0],
      stockoutDayIndex: 0,
      narrative: 'Inventory depleted. Stockout is immediate (Day 0).'
    };
  }

  // If daily forecast points exist, trace cumulative consumption
  if (dailyForecast && dailyForecast.length > 0) {
    let cumulative = 0;
    for (let i = 0; i < dailyForecast.length; i++) {
      const dayDemand = dailyForecast[i].predicted_quantity;
      const prevCumulative = cumulative;
      cumulative += dayDemand;

      if (cumulative >= currentInventory) {
        const dayNum = i + 1;
        const remainingToDeplete = currentInventory - prevCumulative;
        const fraction = dayDemand > 0 ? remainingToDeplete / dayDemand : 0;
        const exactDays = Math.round((i + fraction) * 10) / 10;

        return {
          stockoutDays: exactDays,
          stockoutDate: dailyForecast[i].date,
          stockoutDayIndex: dayNum,
          narrative: `Stockout projected during Day ${dayNum} (${dailyForecast[i].date}) based on cumulative AI demand (${Math.round(cumulative).toLocaleString()} units demanded).`
        };
      }
    }
  }

  // Fallback to average daily consumption calculation
  if (avgDailyConsumption && avgDailyConsumption > 0) {
    const days = currentInventory / avgDailyConsumption;
    const roundedDays = Math.round(days * 10) / 10;
    const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

    return {
      stockoutDays: roundedDays,
      stockoutDate: targetDate,
      stockoutDayIndex: Math.ceil(days),
      narrative: `Expected stockout in approximately ${roundedDays} days (${targetDate}) based on recent average burn rate.`
    };
  }

  return {
    stockoutDays: null,
    stockoutDate: null,
    stockoutDayIndex: null,
    narrative: 'Stockout date indeterminate due to insufficient consumption logs.'
  };
}

/**
 * FEATURE 4, 12, 16, 17: Deterministic Inventory Risk & Status Engine
 * Uses clearly defined thresholds:
 * CRITICAL: < 2 days
 * HIGH RISK: 2–4 days
 * AT RISK: 4–7 days
 * HEALTHY: > 7 days
 */
export function assessInventoryRisk(params: {
  daysOfSupply: number | null;
  currentInventory: number;
  reorderRequired: boolean;
  projectedShortage: number;
  hasInsufficientData: boolean;
}): {
  status: InventoryStatus;
  riskLevel: RiskPriority;
  riskTypes: RiskType[];
  reasoning: string;
} {
  const {
    daysOfSupply,
    currentInventory,
    reorderRequired,
    projectedShortage,
    hasInsufficientData
  } = params;

  const riskTypes: RiskType[] = [];

  if (hasInsufficientData || daysOfSupply === null) {
    return {
      status: 'INSUFFICIENT_DATA',
      riskLevel: 'MEDIUM',
      riskTypes: ['INSUFFICIENT_DATA'],
      reasoning: 'Insufficient historical consumption data to reliably project operational risk.'
    };
  }

  if (currentInventory === 0) {
    riskTypes.push('STOCKOUT_RISK', 'LOW_STOCK', 'REORDER_REQUIRED');
    return {
      status: 'CRITICAL',
      riskLevel: 'CRITICAL',
      riskTypes,
      reasoning: 'Zero stock available. Emergency priority replenishment required.'
    };
  }

  if (reorderRequired) {
    riskTypes.push('REORDER_REQUIRED');
  }
  if (projectedShortage > 0) {
    riskTypes.push('DEMAND_SPIKE');
  }

  // Threshold evaluations
  if (daysOfSupply < INVENTORY_CONFIG.THRESHOLDS.CRITICAL_DAYS) {
    riskTypes.push('STOCKOUT_RISK', 'LOW_STOCK');
    return {
      status: 'CRITICAL',
      riskLevel: 'CRITICAL',
      riskTypes,
      reasoning: `Critical reserve breach: Only ${daysOfSupply.toFixed(1)} days of supply remain (< ${INVENTORY_CONFIG.THRESHOLDS.CRITICAL_DAYS} days threshold).`
    };
  }

  if (daysOfSupply < INVENTORY_CONFIG.THRESHOLDS.HIGH_RISK_DAYS) {
    riskTypes.push('LOW_STOCK');
    return {
      status: 'HIGH_RISK',
      riskLevel: 'HIGH',
      riskTypes,
      reasoning: `High risk: Days of supply is ${daysOfSupply.toFixed(1)} days (within ${INVENTORY_CONFIG.THRESHOLDS.CRITICAL_DAYS}–${INVENTORY_CONFIG.THRESHOLDS.HIGH_RISK_DAYS} days window). Immediate convoy allocation advised.`
    };
  }

  if (daysOfSupply <= INVENTORY_CONFIG.THRESHOLDS.AT_RISK_DAYS || reorderRequired || projectedShortage > 0) {
    return {
      status: 'AT_RISK',
      riskLevel: 'MEDIUM',
      riskTypes,
      reasoning: reorderRequired
        ? `Stock level has breached reorder point. ${daysOfSupply.toFixed(1)} days of supply remaining.`
        : projectedShortage > 0
        ? `Projected planning demand exceeds current stock by ${projectedShortage.toLocaleString()} units.`
        : `Stock is within cautionary window (${daysOfSupply.toFixed(1)} days of supply).`
    };
  }

  return {
    status: 'HEALTHY',
    riskLevel: 'LOW',
    riskTypes: ['NONE'],
    reasoning: `Operational stock is healthy with ${daysOfSupply.toFixed(1)} days of supply buffer exceeding minimum requirements.`
  };
}

/**
 * FEATURE 24: Dynamic Inventory Insight Generator
 * Generates dynamic, structured sentences based on calculated metrics
 */
export function generateInventoryInsight(params: {
  locationName: string;
  supplyType: string;
  unit: string;
  currentInventory: number;
  daysOfSupply: number | null;
  projectedShortage: number;
  demandBasis: DemandBasis;
  horizonDays: number;
  reorderRequired: boolean;
}): string {
  const {
    locationName,
    supplyType,
    unit,
    currentInventory,
    daysOfSupply,
    projectedShortage,
    demandBasis,
    horizonDays,
    reorderRequired
  } = params;

  if (daysOfSupply === null) {
    return `Inventory records for ${supplyType} at ${locationName} show ${currentInventory.toLocaleString()} ${unit} on hand, but historical consumption records are insufficient to compute days of supply. Standard replenishment review is recommended.`;
  }

  const daysStr = daysOfSupply.toFixed(INVENTORY_CONFIG.DECIMAL_PRECISION.DAYS_OF_SUPPLY);
  const basisStr = demandBasis === 'FORECAST' ? 'predictive demand modeling' : 'historical daily burn rate';

  let insight = `${supplyType} inventory at ${locationName} is currently sufficient for approximately ${daysStr} days based on ${basisStr}.`;

  if (projectedShortage > 0) {
    insight += ` The projected ${horizonDays}-day demand exceeds current inventory by approximately ${projectedShortage.toLocaleString()} ${unit}. Replenishment should be scheduled promptly.`;
  } else if (reorderRequired) {
    insight += ` Current stock has breached the calculated reorder point. Replenishment convoy dispatch should be initiated to avoid stockout.`;
  } else {
    insight += ` Current stock levels provide an adequate operational buffer over the ${horizonDays}-day planning horizon. No emergency replenishment required.`;
  }

  return insight;
}

/**
 * FEATURE 25: Recommended Decision-Support Action Generator
 */
export function generateRecommendedAction(params: {
  status: InventoryStatus;
  riskLevel: RiskPriority;
  reorderRequired: boolean;
  recommendedQuantity: number;
  projectedShortage: number;
  horizonDays: number;
  unit: string;
}): {
  action: string;
  quantity: number;
  priority: RiskPriority;
  reason: string;
} {
  const {
    status,
    riskLevel,
    reorderRequired,
    recommendedQuantity,
    projectedShortage,
    horizonDays,
    unit
  } = params;

  if (status === 'INSUFFICIENT_DATA') {
    return {
      action: 'Conduct Manual Stock Audit',
      quantity: 0,
      priority: 'MEDIUM',
      reason: 'Insufficient consumption data to calculate automated replenishment quantity.'
    };
  }

  if (status === 'CRITICAL') {
    return {
      action: 'Emergency Convoy Replenishment Required',
      quantity: recommendedQuantity > 0 ? recommendedQuantity : projectedShortage,
      priority: 'CRITICAL',
      reason: `Immediate stockout risk detected. Current inventory cannot sustain minimum operational buffer for the next ${horizonDays} days.`
    };
  }

  if (reorderRequired || recommendedQuantity > 0) {
    return {
      action: 'Replenishment Required',
      quantity: recommendedQuantity,
      priority: riskLevel,
      reason: projectedShortage > 0
        ? `Projected demand exceeds current available inventory over the ${horizonDays}-day planning horizon.`
        : `Current stock has fallen below the lead-time reorder threshold.`
    };
  }

  return {
    action: 'Maintain Normal Monitoring',
    quantity: 0,
    priority: 'LOW',
    reason: `Stock level exceeds reorder threshold and provides adequate operational coverage for the ${horizonDays}-day horizon.`
  };
}
