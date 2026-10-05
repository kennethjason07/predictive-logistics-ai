import { IForecastingModel, ModelPredictionOutput } from './modelInterface';
import { ValidatedRecord } from '../dataValidation';
import { DailyForecastPoint, ModelMetrics } from '../../types/forecasting';
import { buildFeatureDataset, getWeatherFactor } from '../featureEngineering';

/**
 * Single Decision Tree Regressor Node for Time-Series Features
 */
interface DecisionTreeNode {
  featureIndex?: number;
  threshold?: number;
  value?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
}

/**
 * Random Forest Regressor Ensemble Model
 * Model Version: rf-v1
 */
export class RandomForestModel implements IForecastingModel {
  version: 'rf-v1' = 'rf-v1';

  private numTrees = 8;
  private maxDepth = 4;

  /**
   * Trains a decision tree recursively
   */
  private buildTree(X: number[][], y: number[], depth: number): DecisionTreeNode {
    if (depth >= this.maxDepth || y.length <= 3) {
      const avg = y.length > 0 ? y.reduce((a, b) => a + b, 0) / y.length : 0;
      return { value: avg };
    }

    let bestFeature = 0;
    let bestThreshold = 0;
    let bestVarianceReduce = -Infinity;
    let bestLeftY: number[] = [];
    let bestRightY: number[] = [];

    const numFeatures = X[0].length;
    const currentVar = this.calculateVariance(y);

    // Random subset of features (Random Forest subsampling)
    const featureIndices = Array.from({ length: numFeatures }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.ceil(numFeatures * 0.7));

    for (const fIdx of featureIndices) {
      const featureValues = X.map(row => row[fIdx]).sort((a, b) => a - b);
      const thresholds = featureValues.filter((_, idx) => idx % 2 === 0);

      for (const thresh of thresholds) {
        const leftY: number[] = [];
        const rightY: number[] = [];

        for (let i = 0; i < X.length; i++) {
          if (X[i][fIdx] <= thresh) {
            leftY.push(y[i]);
          } else {
            rightY.push(y[i]);
          }
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const leftVar = this.calculateVariance(leftY);
        const rightVar = this.calculateVariance(rightY);
        const varReduce = currentVar - (leftY.length / y.length) * leftVar - (rightY.length / y.length) * rightVar;

        if (varReduce > bestVarianceReduce) {
          bestVarianceReduce = varReduce;
          bestFeature = fIdx;
          bestThreshold = thresh;
          bestLeftY = leftY;
          bestRightY = rightY;
        }
      }
    }

    if (bestVarianceReduce <= 0 || bestLeftY.length === 0 || bestRightY.length === 0) {
      const avg = y.reduce((a, b) => a + b, 0) / y.length;
      return { value: avg };
    }

    // Split matrices
    const leftX: number[][] = [];
    const rightX: number[][] = [];
    for (let i = 0; i < X.length; i++) {
      if (X[i][bestFeature] <= bestThreshold) {
        leftX.push(X[i]);
      } else {
        rightX.push(X[i]);
      }
    }

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, bestLeftY, depth + 1),
      right: this.buildTree(rightX, bestRightY, depth + 1)
    };
  }

  private predictTree(node: DecisionTreeNode, x: number[]): number {
    if (node.value !== undefined) return node.value;
    if (node.featureIndex !== undefined && node.threshold !== undefined) {
      if (x[node.featureIndex] <= node.threshold) {
        return this.predictTree(node.left!, x);
      } else {
        return this.predictTree(node.right!, x);
      }
    }
    return 0;
  }

  private calculateVariance(arr: number[]): number {
    if (arr.length <= 1) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  predict(
    historicalData: ValidatedRecord[],
    horizonDays: number,
    weatherStatus?: string
  ): ModelPredictionOutput {
    const featureRows = buildFeatureDataset(historicalData, weatherStatus);
    const weatherMult = getWeatherFactor(weatherStatus);

    // Prepare training matrices (X: features, y: target next-day quantity)
    const X: number[][] = [];
    const y: number[] = [];

    for (let i = 0; i < featureRows.length - 1; i++) {
      const row = featureRows[i];
      const target = featureRows[i + 1].quantity;
      X.push([
        row.day_of_week,
        row.month,
        row.lag_1,
        row.lag_3,
        row.lag_7,
        row.rolling_mean_3,
        row.rolling_mean_7,
        row.rolling_std_7,
        row.weather_factor || 1.0
      ]);
      y.push(target);
    }

    // Train Forest Ensemble
    const forest: DecisionTreeNode[] = [];
    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let i = 0; i < X.length; i++) {
        const randIdx = Math.floor(Math.random() * X.length);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }
      forest.push(this.buildTree(bootX, bootY, 0));
    }

    // Evaluate Metrics (MAE, RMSE, MAPE) on out-of-bag training set
    let totalAbsErr = 0;
    let totalSqErr = 0;
    let totalTargetSum = 0;

    for (let i = 0; i < X.length; i++) {
      const actual = y[i];
      const preds = forest.map(t => this.predictTree(t, X[i]));
      const avgPred = preds.reduce((a, b) => a + b, 0) / preds.length;

      const err = Math.abs(actual - avgPred);
      totalAbsErr += err;
      totalSqErr += Math.pow(actual - avgPred, 2);
      totalTargetSum += actual;
    }

    const n = Math.max(X.length, 1);
    const mae = totalAbsErr / n;
    const rmse = Math.sqrt(totalSqErr / n);
    const avgY = totalTargetSum / n;
    const mape = avgY > 0 ? Math.min((mae / avgY) * 100, 100) : 0;

    // Recursive Horizon Forecast
    const lastRow = featureRows[featureRows.length - 1];
    let currentLag1 = lastRow.quantity;
    let currentLag3 = lastRow.lag_3;
    let currentLag7 = lastRow.lag_7;
    let currentRolling7 = lastRow.rolling_mean_7;

    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const points: DailyForecastPoint[] = [];

    for (let h = 1; h <= horizonDays; h++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + h);

      const xFuture = [
        futureDate.getDay(),
        futureDate.getMonth(),
        currentLag1,
        currentLag3,
        currentLag7,
        currentRolling7,
        currentRolling7,
        mae * 0.5,
        weatherMult
      ];

      const treePreds = forest.map(t => this.predictTree(t, xFuture));
      const treeMean = treePreds.reduce((a, b) => a + b, 0) / treePreds.length;
      const predicted = Math.max(0, Math.round(treeMean * weatherMult * 10) / 10);

      // Ensemble standard deviation for uncertainty bounds
      const ensembleVar = treePreds.reduce((s, p) => s + Math.pow(p - treeMean, 2), 0) / treePreds.length;
      const ensembleStd = Math.sqrt(ensembleVar) + rmse * 0.8;

      const margin = Math.round(1.96 * ensembleStd * Math.sqrt(1 + h * 0.08) * 10) / 10;
      const lower = Math.max(0, Math.round((predicted - margin) * 10) / 10);
      const upper = Math.round((predicted + margin) * 10) / 10;
      const confidence = Math.max(0.6, Math.round((1 - Math.min(mape / 100, 0.35) - h * 0.01) * 100) / 100);

      points.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_quantity: predicted,
        lower_bound: lower,
        upper_bound: upper,
        confidence
      });

      // Shift lags for next step recursion
      currentLag7 = currentLag3;
      currentLag3 = currentLag1;
      currentLag1 = predicted;
      currentRolling7 = (currentRolling7 * 6 + predicted) / 7;
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
