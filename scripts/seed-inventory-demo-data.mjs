import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mock global WebSocket for Node.js environment before loading Supabase
if (typeof globalThis.WebSocket === 'undefined') {
  class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  }
  globalThis.WebSocket = DummyWebSocket;
}

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envFile = loadEnvFile(path.join(rootDir, '.env'));
const envLocal = loadEnvFile(path.join(rootDir, '.env.local'));
const processEnv = { ...envFile, ...envLocal, ...process.env };

const supabaseUrl =
  processEnv.NEXT_PUBLIC_SUPABASE_URL ||
  processEnv.VITE_SUPABASE_URL ||
  processEnv.SUPABASE_URL;

const supabaseAnonKey =
  processEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  processEnv.VITE_SUPABASE_ANON_KEY ||
  processEnv.SUPABASE_ANON_KEY;

console.log('========================================================================');
console.log('  INDIAN ARMY LOGISTICS - MODULE 2 INVENTORY DEMO SEED DATA (180 DAYS)  ');
console.log('  NOTICE: CLEARLY LABELED DEMO / SIMULATED DATA                        ');
console.log('========================================================================\n');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.log('ℹ️  No remote Supabase credentials active in .env.local.');
  console.log('✅ Local simulated dataset (180 days) is fully integrated and used in memory.');
  console.log('Ready to run: npm run dev');
  process.exit(0);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: locations, error: locErr } = await supabase.from('locations').select('location_id, name');

  if (locErr || !locations || locations.length === 0) {
    console.log('⚠️ No locations found in remote Supabase.');
    console.log('Run schema.txt in Supabase SQL editor first.');
    process.exit(0);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  console.log(`Found ${locations.length} locations. Generating 180 days of realistic consumption logs...`);

  const daysOfHistory = 180;
  const today = new Date();
  const records = [];

  for (const loc of locations) {
    for (let i = daysOfHistory; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const baseDemand = loc.name.includes('Siachen') ? 480 : loc.name.includes('Leh') ? 380 : 250;
      const noise = (Math.random() - 0.5) * 50;
      const qty = Math.max(10, Math.round(baseDemand + noise));

      records.push({
        location_id: loc.location_id,
        supply_type: 'Extreme Cold Climate Rations (ECC)',
        consumption_date: dateStr,
        quantity_consumed: qty,
        unit: 'Rations'
      });
    }
  }

  // Insert in batches of 100 to avoid payload limits
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('consumption').insert(batch);
    if (!insErr) {
      inserted += batch.length;
    }
  }

  console.log(`✅ Successfully uploaded ${inserted} synthetic 180-day consumption records to Supabase!`);
  process.exit(0);
} catch (err) {
  console.error('Error during demo seed:', err.message || err);
  process.exit(1);
}
