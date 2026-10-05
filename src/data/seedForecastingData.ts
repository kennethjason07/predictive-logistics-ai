import { ConsumptionRecord } from '../types/schema';

/**
 * Generates 90 days of synthetic historical logistics consumption data
 * CLEARLY LABELED: DEMO / SIMULATED DATA
 */
export function generateSyntheticHistoricalConsumption(
  locations: { location_id: string; name: string }[]
): ConsumptionRecord[] {
  const records: ConsumptionRecord[] = [];
  const daysOfHistory = 90;
  const today = new Date();

  // Supply types mapping per base profile
  const baseProfiles: { [key: string]: { supply_type: string; baseQty: number; variance: number; unit: string; weekendSpike: boolean }[] } = {
    'loc-001': [ // Srinagar Command
      { supply_type: 'Aviation Turbine Fuel (ATF-Winter)', baseQty: 85, variance: 20, unit: 'KiloLiters', weekendSpike: true },
      { supply_type: 'Ammunition 155mm Artillery', baseQty: 210, variance: 60, unit: 'Rounds', weekendSpike: false }
    ],
    'loc-002': [ // Leh HQ 14 Corps
      { supply_type: 'Ammunition 155mm Artillery', baseQty: 320, variance: 90, unit: 'Rounds', weekendSpike: false },
      { supply_type: 'Aviation Turbine Fuel (ATF-Winter)', baseQty: 65, variance: 15, unit: 'KiloLiters', weekendSpike: true },
      { supply_type: 'Extreme Cold Climate Rations (ECC)', baseQty: 450, variance: 80, unit: 'Rations', weekendSpike: true }
    ],
    'loc-003': [ // Kargil Sector
      { supply_type: 'Ammunition 155mm Artillery', baseQty: 180, variance: 50, unit: 'Rounds', weekendSpike: false },
      { supply_type: 'Extreme Cold Climate Rations (ECC)', baseQty: 380, variance: 60, unit: 'Rations', weekendSpike: true }
    ],
    'loc-004': [ // Siachen Base Camp (Extreme Altitude)
      { supply_type: 'Extreme Cold Climate Rations (ECC)', baseQty: 520, variance: 110, unit: 'Rations', weekendSpike: true },
      { supply_type: 'Medical Plasma & Oxygen Cylinders', baseQty: 42, variance: 12, unit: 'Units', weekendSpike: false },
      { supply_type: 'Diesel Winter Grade (-30C)', baseQty: 185, variance: 35, unit: 'KiloLiters', weekendSpike: false }
    ],
    'loc-005': [ // Daulet Beg Oldi (DBO)
      { supply_type: 'Diesel Winter Grade (-30C)', baseQty: 160, variance: 30, unit: 'KiloLiters', weekendSpike: false },
      { supply_type: 'High-Altitude Special Clothing (ECC Clothing)', baseQty: 35, variance: 10, unit: 'Kits', weekendSpike: false }
    ],
    'loc-006': [ // Tawang Sector
      { supply_type: 'Extreme Cold Climate Rations (ECC)', baseQty: 310, variance: 50, unit: 'Rations', weekendSpike: true }
    ]
  };

  let idCounter = 1000;

  for (let i = daysOfHistory; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    for (const loc of locations) {
      const profiles = baseProfiles[loc.location_id] || [
        { supply_type: 'Extreme Cold Climate Rations (ECC)', baseQty: 250, variance: 40, unit: 'Rations', weekendSpike: true }
      ];

      for (const prof of profiles) {
        // Apply realistic random noise + weekend spike + slight upward seasonal trend
        const noise = (Math.random() - 0.5) * 2 * prof.variance;
        const weekendMult = isWeekend && prof.weekendSpike ? 1.25 : 1.0;
        const trendMult = 1 + ((daysOfHistory - i) / daysOfHistory) * 0.12; // 12% gradual surge

        let qty = Math.max(10, Math.round((prof.baseQty + noise) * weekendMult * trendMult));

        // Occasional training drill spike (every ~18 days)
        if (i % 18 === 0 && prof.supply_type.includes('Ammunition')) {
          qty = Math.round(qty * 1.75);
        }

        records.push({
          id: `sim-con-${idCounter++}`,
          location_id: loc.location_id,
          supply_type: prof.supply_type,
          consumption_date: dateStr,
          quantity_consumed: qty,
          unit: prof.unit,
          created_at: d.toISOString()
        });
      }
    }
  }

  return records;
}
