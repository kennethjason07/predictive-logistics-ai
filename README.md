# Indian-Army
AI-powered predictive logistics and forward supply chain management system.

---

## ⚡ Supabase Setup & Connection

This project is connected to **Supabase** for database, real-time sync, and authentication.

### 1. Environment Configuration

Your local credentials are saved in `.env.local` (and ignored from Git for security):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xrzpubirvinygagffupw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

For new setups, copy `.env.example` to `.env.local` and paste your project URL and publishable/anon key from your Supabase Dashboard (**Project Settings -> API**).

### 2. Testing the Connection

Run the automated verification script:

```bash
npm run test:supabase
```

Or directly via Node:

```bash
node scripts/test-supabase.mjs
```

### 3. Database Schema

A ready-to-use schema tailored for military predictive supply chain management is included in [`supabase/schema.sql`](file:///supabase/schema.sql):
- **`supply_bases`**: Forward operating bases, logistics hubs, and sector coordinates.
- **`inventory_items`**: Stock levels (fuel, ammunition, rations, medical, spares) with minimum and critical thresholds.
- **`convoys`**: Transit tracking, convoy numbers, escort units, and status.
- **`predictive_alerts`**: AI predictive models for stockout warnings, weather disruptions, and demand surges.

To apply this schema, copy the SQL in [`supabase/schema.sql`](file:///supabase/schema.sql) into your [Supabase Dashboard](https://supabase.com/dashboard) -> **SQL Editor** and run it.

### 4. Client Usage in Code

Import the typed Supabase client anywhere in `src/`:

```typescript
import { supabase } from './lib/supabase';

// Fetch supply bases
const { data, error } = await supabase
  .from('supply_bases')
  .select('*');
```
