import { ValidatedRecord } from '../dataValidation';
import { DailyForecastPoint, ModelMetrics } from '../../types/forecasting';

export interface ModelPredictionOutput {
  points: DailyForecastPoint[];
  metrics: ModelMetrics;
  modelVersion: 'baseline-v1' | 'rf-v1';
}

export interface IForecastingModel {
  version: 'baseline-v1' | 'rf-v1';
  predict(
    historicalData: ValidatedRecord[],
    horizonDays: number,
    weatherStatus?: string
  ): ModelPredictionOutput;
}
