-- ==============================================================================
-- MODULE 2 — INVENTORY INTELLIGENCE DATABASE ENHANCEMENTS
-- Problem Statement: Indian Army - Predictive Logistics & Forward Supply Chain (PS ID: 26251)
-- ==============================================================================
--
-- This migration adheres strictly to schema.txt:
-- 1. Reuses existing tables: locations, inventory, consumption, demand_forecasts, routes
-- 2. Preserves existing column 'safety_stock' in public.inventory
-- 3. Adds only minimal missing field 'lead_time_days' and optional 'reorder_level'
-- 4. Creates optimal indexes for real-time military intelligence queries
--

-- 1. Minimal additive columns to public.inventory
ALTER TABLE IF EXISTS public.inventory
ADD COLUMN IF NOT EXISTS lead_time_days NUMERIC DEFAULT 3 CHECK (lead_time_days >= 0);

ALTER TABLE IF EXISTS public.inventory
ADD COLUMN IF NOT EXISTS reorder_level NUMERIC DEFAULT 0 CHECK (reorder_level >= 0);

-- 2. Performance Indexes (Section 30)
-- Optimize lookup of stock by base and supply item
CREATE INDEX IF NOT EXISTS idx_inventory_loc_supply 
ON public.inventory(location_id, supply_type);

-- Optimize consumption history queries by base, supply, and date window
CREATE INDEX IF NOT EXISTS idx_consumption_loc_supply_date 
ON public.consumption(location_id, supply_type, consumption_date DESC);

-- Optimize global consumption date filtering
CREATE INDEX IF NOT EXISTS idx_consumption_date 
ON public.consumption(consumption_date DESC);

-- Optimize demand forecasts retrieval for predictive shortage calculations
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_lookup 
ON public.demand_forecasts(location_id, supply_type, forecast_date);

-- Optimize routing query for transit lead-time calculation
CREATE INDEX IF NOT EXISTS idx_routes_destination 
ON public.routes(destination_id);

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.demand_forecasts ENABLE ROW LEVEL SECURITY;

-- Allow public read policies if needed for development/demo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Allow public read inventory'
  ) THEN
    CREATE POLICY "Allow public read inventory" ON public.inventory FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'consumption' AND policyname = 'Allow public read consumption'
  ) THEN
    CREATE POLICY "Allow public read consumption" ON public.consumption FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'demand_forecasts' AND policyname = 'Allow public read demand_forecasts'
  ) THEN
    CREATE POLICY "Allow public read demand_forecasts" ON public.demand_forecasts FOR SELECT USING (true);
  END IF;
END
$$;
