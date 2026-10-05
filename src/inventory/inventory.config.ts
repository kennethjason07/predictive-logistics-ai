/**
 * Central Configuration for Inventory Intelligence
 * Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
 *
 * IMPORTANT (Section 7 & 17):
 * Keep these thresholds configurable.
 * Do NOT scatter hard-coded numbers throughout the frontend.
 */

export const INVENTORY_CONFIG = {
  // Days of Supply Thresholds
  THRESHOLDS: {
    CRITICAL_DAYS: 2.0,   // < 2 days
    HIGH_RISK_DAYS: 4.0,  // 2 - 4 days
    AT_RISK_DAYS: 7.0     // 4 - 7 days
    // Healthy: > 7.0 days
  },

  // Analysis Periods (Section 5)
  ANALYSIS_PERIODS: [7, 14, 30, 60, 90] as const,
  DEFAULT_ANALYSIS_PERIOD_DAYS: 30,

  // Planning Horizons (Section 12)
  PLANNING_HORIZONS: [3, 7, 14, 30] as const,
  DEFAULT_PLANNING_HORIZON_DAYS: 7,

  // Safety Stock Parameters (Section 9)
  // Z = 1.65 represents ~95% service level under normal-demand assumptions
  DEFAULT_SERVICE_LEVEL_Z: 1.65,
  MIN_DAYS_FOR_STD_DEV: 5,
  FALLBACK_SAFETY_STOCK_DAYS: 3.0, // Used if neither database nor std dev can be computed

  // Replenishment Lead Time Defaults (Section 8.1)
  DEFAULT_LEAD_TIME_DAYS: 3.0,
  MIN_LEAD_TIME_DAYS: 1.0,

  // Precision and Formatting
  DECIMAL_PRECISION: {
    DAYS_OF_SUPPLY: 1,
    AVG_DAILY_CONSUMPTION: 1,
    SAFETY_STOCK: 0,
    REORDER_POINT: 0,
    QUANTITY: 0
  },

  // Status Labels and Color Tokens for Mil-Grade UI
  STATUS_METADATA: {
    CRITICAL: {
      label: 'CRITICAL',
      color: '#ef4444',
      badgeClass: 'badge-danger',
      description: 'Stockout imminent (< 2 days supply). Immediate replenishment priority.'
    },
    HIGH_RISK: {
      label: 'HIGH RISK',
      color: '#f97316',
      badgeClass: 'badge-warning',
      description: 'Severe buffer depletion (2–4 days supply). Expedited reorder required.'
    },
    AT_RISK: {
      label: 'AT RISK',
      color: '#eab308',
      badgeClass: 'badge-warning',
      description: 'Stock approaching reorder threshold (4–7 days supply). Scheduled replenishment needed.'
    },
    HEALTHY: {
      label: 'HEALTHY',
      color: '#10b981',
      badgeClass: 'badge-success',
      description: 'Sufficient operational buffer (> 7 days supply). Stock levels optimal.'
    },
    INSUFFICIENT_DATA: {
      label: 'INSUFFICIENT DATA',
      color: '#64748b',
      badgeClass: 'badge-secondary',
      description: 'Insufficient historical consumption recorded to compute metrics reliably.'
    }
  }
} as const;
