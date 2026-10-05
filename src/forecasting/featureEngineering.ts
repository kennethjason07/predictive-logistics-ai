import { ValidatedRecord } from './dataValidation';
import { EngineeredFeatureRow } from '../types/forecasting';

/**
 * Derives the season from month index (0-11)
 * High-altitude military sectors experience extreme winter consumption demand (Oct - Mar)
 */
export function getSeason(month: number): 'Winter' | 'Spring' | 'Summer' | 'Autumn' {
  if (month === 11 || month === 0 || month === 1) return 'Winter'; // Dec, Jan, Feb
  if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
  return 'Autumn'; // Sep, Oct, Nov
}

/**
 * Calculates week of year (1-52)
 */
export function getWeekOfYear(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Map optional weather condition string to numeric multiplier factor
 */
export function getWeatherFactor(weatherStatus?: string): number {
  if (!weatherStatus) return 1.0; // neutral default
  const status = weatherStatus.toLowerCase();
  if (status.includes('blizzard')) return 1.6; // high thermal heating & ration burn
  if (status.includes('snow')) return 1.35;
  if (status.includes('landslide') || status.includes('blocked')) return 1.25;
  if (status.includes('fog')) return 1.1;
  return 1.0;
}

/**
 * Builds time-series features for historical training / evaluation
 */
export function buildFeatureDataset(
  data: ValidatedRecord[],
  weatherStatus?: string
): EngineeredFeatureRow[] {
  const rows: EngineeredFeatureRow[] = [];
  const weatherFactor = getWeatherFactor(weatherStatus);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const dateObj = new Date(item.date);

    const dayOfWeek = dateObj.getDay();
    const dayOfMonth = dateObj.getDate();
    const month = dateObj.getMonth();
    const weekOfYear = getWeekOfYear(dateObj);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const season = getSeason(month);

    // Lags (looking strictly backward to prevent data leakage)
    const lag1 = i >= 1 ? data[i - 1].quantity : item.quantity;
    const lag3 = i >= 3 ? data[i - 3].quantity : lag1;
    const lag7 = i >= 7 ? data[i - 7].quantity : lag3;

    // Rolling statistics (backward windows)
    const slice3 = data.slice(Math.max(0, i - 2), i + 1).map(d => d.quantity);
    const rollingMean3 = slice3.reduce((a, b) => a + b, 0) / slice3.length;

    const slice7 = data.slice(Math.max(0, i - 6), i + 1).map(d => d.quantity);
    const rollingMean7 = slice7.reduce((a, b) => a + b, 0) / slice7.length;

    const slice14 = data.slice(Math.max(0, i - 13), i + 1).map(d => d.quantity);
    const rollingMean14 = slice14.reduce((a, b) => a + b, 0) / slice14.length;

    // Standard deviation over 7 days
    const variance7 =
      slice7.reduce((sum, val) => sum + Math.pow(val - rollingMean7, 2), 0) / slice7.length;
    const rollingStd7 = Math.sqrt(variance7);

    rows.push({
      date: item.date,
      quantity: item.quantity,
      day_of_week: dayOfWeek,
      day_of_month: dayOfMonth,
      month,
      week_of_year: weekOfYear,
      is_weekend: isWeekend,
      season,
      lag_1: lag1,
      lag_3: lag3,
      lag_7: lag7,
      rolling_mean_3: Math.round(rollingMean3 * 100) / 100,
      rolling_mean_7: Math.round(rollingMean7 * 100) / 100,
      rolling_mean_14: Math.round(rollingMean14 * 100) / 100,
      rolling_std_7: Math.round(rollingStd7 * 100) / 100,
      weather_factor: weatherFactor
    });
  }

  return rows;
}
