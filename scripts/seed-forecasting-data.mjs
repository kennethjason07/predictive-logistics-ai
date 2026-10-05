import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mock global WebSocket for Node.js < 22 environment before loading Supabase
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

// Helper to load .env manually
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

console.log('====================================================');
console.log('  INDIAN ARMY LOGISTICS - DEMO SEED DATA GENERATOR ');
console.log('====================================================');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.log('⚠️ Supabase credentials not found or set to placeholder.');
  console.log('Skipping remote DB seed. Local in-memory demo dataset will be used automatically.');
  process.exit(0);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log('Connecting to Supabase database...');

  // Fetch locations from DB
  const { data: locations, error: locErr } = await supabase.from('locations').select('location_id, name');

  if (locErr || !locations || locations.length === 0) {
    console.log('⚠️ No locations found in Supabase tables.');
    console.log('Please make sure you have applied schema.txt in Supabase SQL Editor and populated locations.');
    process.exit(0);
  }

  console.log(`Found ${locations.length} operating locations. Generating 90 days of synthetic historical consumption...`);

  const daysOfHistory = 90;
  const today = new Date();
  const recordsToInsert = [];

  for (const loc of locations) {
    for (let i = daysOfHistory; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Generate realistic daily demand per location
      const baseQty = loc.name.includes('Siachen') ? 500 : loc.name.includes('Leh') ? 350 : 220;
      const noise = Math.floor((Math.random() - 0.5) * 60);
      const qty = Math.max(20, baseQty + noise);

      recordsToInsert.push({
        location_id: loc.location_id,
        supply_type: 'Extreme Cold Climate Rations (ECC)',
        consumption_date: dateStr,
        quantity_consumed: qty,
        unit: 'Rations'
      });
    }
  }

  const { error: insertErr } = await supabase.from('consumption').insert(recordsToInsert);

  if (insertErr) {
    console.warn('Notice while seeding consumption table:', insertErr.message);
  } else {
    console.log(`✅ Successfully seeded ${recordsToInsert.length} synthetic historical records into public.consumption table!`);
  }

  process.exit(0);
} catch (err) {
  console.error('Error seeding data:', err.message || err);
  process.exit(1);
}
