import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to load .env.local manually if dotenv is not installed
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

// Load .env and .env.local and merge into process.env
const envFile = loadEnvFile(path.join(rootDir, '.env'));
for (const [k, v] of Object.entries(envFile)) {
  if (!process.env[k]) {
    process.env[k] = v;
  }
}
const envLocal = loadEnvFile(path.join(rootDir, '.env.local'));
for (const [k, v] of Object.entries(envLocal)) {
  process.env[k] = v; // .env.local overrides .env
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

console.log('----------------------------------------------------');
console.log('        Indian Army Logistics - Supabase Test       ');
console.log('----------------------------------------------------');
console.log(`Supabase URL      : ${supabaseUrl || 'MISSING'}`);
console.log(`Supabase Key Type : ${supabaseAnonKey ? (supabaseAnonKey.startsWith('sb_publishable_') ? 'Publishable Key' : 'Anon JWT') : 'MISSING'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ ERROR: Supabase credentials not found in .env.local.');
  console.error('Please verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('\nTesting connection to Supabase Auth & Gateway...');

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error(`\n❌ Supabase returned an error: ${error.message}`);
    process.exit(1);
  }

  console.log('✅ Connection Successful!');
  console.log(`Auth gateway responded with status 200 OK.`);
  console.log(`Current Session: ${data?.session ? 'Active' : 'No active user session (Anon client ready)'}`);
  console.log('----------------------------------------------------');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Unexpected error while connecting to Supabase:');
  console.error(err.message || err);
  process.exit(1);
}
