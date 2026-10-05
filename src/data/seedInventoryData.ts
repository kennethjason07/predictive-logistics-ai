/**
 * DEMO / SIMULATED DATA GENERATOR — MODULE 2 INVENTORY INTELLIGENCE
 * Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
 *
 * NOTE (Section 32):
 * This dataset is explicitly labeled as SYNTHETIC / SIMULATED DEMO DATA for system
 * evaluation and algorithm benchmarking. It does NOT represent actual classified operational records.
 *
 * Scenarios Included:
 * 1. Healthy Inventory: Leh HQ - Ammunition (Days of Supply ~20+ days)
 * 2. At Risk Inventory: Forward Base DBO - High-Altitude Clothing (Days of Supply ~4.8 days)
 * 3. Critical Inventory: Siachen Base Camp - Extreme Cold Rations (Days of Supply < 2 days, Reorder Required)
 * 4. Critical Depletion: Siachen Base Camp - Medical Oxygen (Days of Supply ~1.5 days)
 * 5. Reorder Point Breached: DBO Outpost - Diesel (-30C)
 */

import { ConsumptionRecord, InventoryItem, Location } from '../types/schema';

export function generate180DaySimulatedConsumption(locations: Location[]): ConsumptionRecord[] {
  const records: ConsumptionRecord[] = [];
  const daysOfHistory = 180;
  const today = new Date();

  // Distinct behavioral profiles for each operating base and supply type
  const profiles = [
    // Siachen Base Camp (Extreme cold, high rations burn, critical shortages simulated)
    {
      locId: 'loc-004',
      supply: 'Extreme Cold Climate Rations (ECC)',
      baseQty: 480,
      volatility: 0.18,
      trend: 0.15, // Surge over winter
      spikeInterval: 14,
      unit: 'Rations'
    },
    {
      locId: 'loc-004',
      supply: 'Medical Plasma & Oxygen Cylinders',
      baseQty: 32,
      volatility: 0.25,
      trend: 0.05,
      spikeInterval: 21,
      unit: 'Units'
    },
    {
      locId: 'loc-004',
      supply: 'Diesel Winter Grade (-30C)',
      baseQty: 180,
      volatility: 0.12,
      trend: 0.20,
      spikeInterval: 30,
      unit: 'KiloLiters'
    },

    // Daulet Beg Oldi (DBO) - High altitude cold desert
    {
      locId: 'loc-005',
      supply: 'Diesel Winter Grade (-30C)',
      baseQty: 160,
      volatility: 0.15,
      trend: 0.10,
      spikeInterval: 20,
      unit: 'KiloLiters'
    },
    {
      locId: 'loc-005',
      supply: 'High-Altitude Special Clothing (ECC Clothing)',
      baseQty: 25,
      volatility: 0.20,
      trend: 0.08,
      spikeInterval: 45,
      unit: 'Kits'
    },

    // Leh Main Supply Base (Large HQ Hub, stable healthy stock)
    {
      locId: 'loc-002',
      supply: 'Ammunition 155mm Artillery',
      baseQty: 220,
      volatility: 0.30,
      trend: 0.0,
      spikeInterval: 12, // Periodic artillery drills
      unit: 'Rounds'
    },
    {
      locId: 'loc-002',
      supply: 'Aviation Turbine Fuel (ATF-Winter)',
      baseQty: 55,
      volatility: 0.15,
      trend: 0.05,
      spikeInterval: 7, // Regular weekend sorties
      unit: 'KiloLiters'
    },
    {
      locId: 'loc-002',
      supply: 'Extreme Cold Climate Rations (ECC)',
      baseQty: 380,
      volatility: 0.10,
      trend: 0.05,
      spikeInterval: 30,
      unit: 'Rations'
    },

    // Kargil Sector Forward Depot
    {
      locId: 'loc-003',
      supply: 'Ammunition 155mm Artillery',
      baseQty: 140,
      volatility: 0.25,
      trend: 0.02,
      spikeInterval: 15,
      unit: 'Rounds'
    },
    {
      locId: 'loc-003',
      supply: 'Extreme Cold Climate Rations (ECC)',
      baseQty: 340,
      volatility: 0.12,
      trend: 0.08,
      spikeInterval: 25,
      unit: 'Rations'
    },

    // Tawang Sector Forward Post
    {
      locId: 'loc-006',
      supply: 'Extreme Cold Climate Rations (ECC)',
      baseQty: 290,
      volatility: 0.14,
      trend: 0.06,
      spikeInterval: 20,
      unit: 'Rations'
    }
  ];

  let idCounter = 5000;

  for (let i = daysOfHistory; i >= 1; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(dateObj.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dow = dateObj.getDay();
    const isWeekend = dow === 0 || dow === 6;

    for (const p of profiles) {
      // Base variability
      const randomNoise = (Math.random() - 0.5) * 2 * (p.baseQty * p.volatility);
      const trendMultiplier = 1 + ((daysOfHistory - i) / daysOfHistory) * p.trend;
      const weekendMultiplier = isWeekend ? 1.15 : 1.0;

      let quantity = Math.round((p.baseQty + randomNoise) * trendMultiplier * weekendMultiplier);

      // Occasional operational spike
      if (i % p.spikeInterval === 0) {
        quantity = Math.round(quantity * 1.6);
      }

      quantity = Math.max(5, quantity);

      records.push({
        id: `sim-demo-${idCounter++}`,
        location_id: p.locId,
        supply_type: p.supply,
        consumption_date: dateStr,
        quantity_consumed: quantity,
        unit: p.unit,
        created_at: dateObj.toISOString()
      });
    }
  }

  return records;
}
