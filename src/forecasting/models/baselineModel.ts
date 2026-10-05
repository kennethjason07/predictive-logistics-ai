import { IForecastingModel, ModelPredictionOutput } from './modelInterface';
import { ValidatedRecord } from '../dataValidation';
import { DailyForecastPoint, ModelMetrics } from '../../types/forecasting';
import { getWeatherFactor } from '../featureEngineering';

/**
 * Level 1 Model: Baseline Weighted Exponential Moving Average with Day-of-Week Seasonality
 * Model Version: baseline-v1
 */
export class BaselineWeightedModel implements IForecastingModel {
  version: 'baseline-v1' = 'baseline-v1';

  predict(
    historicalData: ValidatedRecord[],
    horizonDays: number,
    weatherStatus?: string
  ): ModelPredictionOutput {
    const n = historicalData.length;
    const weatherMult = getWeatherFactor(weatherStatus);

    // 1. Calculate Day-of-Week Seasonality Factors (0 to 6)
    const dayTotals: { [key: number]: number[] } = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let overallSum = 0;

    for (const item of historicalData) {
      const d = new Date(item.date);
      const dow = d.getDay();
      dayTotals[dow].push(item.quantity);
      overallSum += item.quantity;
    }

    const overallAvg = overallSum / Math.max(n, 1);
    const dowFactors: { [key: number]: number } = {};
    for (let dow = 0; dow < 7; dow++) {
      const arr = dayTotals[dow];
      if (arr.length > 0) {
        const dowAvg = arr.reduce((a, b) => a + b, 0) / arr.length;
        dowFactors[dow] = overallAvg > 0 ? dowAvg / overallAvg : 1.0;
      } else {
        dowFactors[dow] = 1.0;
      }
    }

    // 2. Exponentially Weighted Moving Average (EMA) of last 14 days
    const recentWindow = historicalData.slice(Math.max(0, n - 14));
    let weightedSum = 0;
    let weightSum = 0;
    const alpha = 0.25;

    for (let i = 0; i < recentWindow.length; i++) {
      const weight = Math.pow(1 - alpha, recentWindow.length - 1 - i);
      weightedSum += recentWindow[i].quantity * weight;
      weightSum += weight;
    }
    const baseEma = weightSum > 0 ? weightedSum / weightSum : overallAvg;

    // 3. Compute Historical Residuals & Standard Error for Confidence Intervals
    let totalResidual = 0;
    let residualSqSum = 0;
    const errors: number[] = [];

    for (let i = 1; i < n; i++) {
      const actual = historicalData[i].quantity;
      const prev = historicalData[i - 1].quantity;
      const err = Math.abs(actual - prev);
      errors.push(err);
      totalResidual += err;
      residualSqSum += Math.pow(actual - prev, 2);
    }

    const mae = errors.length > 0 ? totalResidual / errors.length : 0;
    const rmse = errors.length > 0 ? Math.sqrt(residualSqSum / errors.length) : 0;
    const mape = overallAvg > 0 ? Math.min((mae / overallAvg) * 100, 100) : 0;

    const stdError = rmse > 0 ? rmse : mae > 0 ? mae * 1.25 : baseEma * 0.15;

    // 4. Generate Future Forecast Points
    const lastDate = new Date(historicalData[n - 1].date);
    const points: DailyForecastPoint[] = [];

    for (let h = 1; h <= horizonDays; h++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + h);
      const dow = futureDate.getDay();

      const seasonality = dowFactors[dow] || 1.0;
      // Slight trend dampening multiplier + weather adjustment
      const predicted = Math.max(0, Math.round(baseEma * seasonality * weatherMult * 10) / 10);

      // Uncertainty expands with horizon length (1.96 * stdError * sqrt(h))
      const margin = Math.round(1.96 * stdError * Math.sqrt(1 + h * 0.1) * 10) / 10;
      const lower = Math.max(0, Math.round((predicted - margin) * 10) / 10);
      const upper = Math.round((predicted + margin) * 10) / 10;

      // Confidence score based on historical MAPE & horizon length
      const confidence = Math.max(0.5, Math.round((1 - Math.min(mape / 100, 0.4) - h * 0.015) * 100) / 100);

      points.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_quantity: predicted,
        lower_bound: lower,
        upper_bound: upper,
        confidence
      });
    }

    const metrics: ModelMetrics = {
      mae: Math.round(mae * 10) / 10,
      rmse: Math.round(rmse * 10) / 10,
      mape: Math.round(mape * 10) / 10
    };

    return {
      points,
      metrics,
      modelVersion: this.version
    };
  }
}
