-- Indian Army AI-Powered Predictive Logistics & Supply Chain Schema
-- Run this in your Supabase Dashboard -> SQL Editor to initialize your database tables

-- 1. Bases & Depots (Forward Operating Bases, Hubs, Depots)
CREATE TABLE IF NOT EXISTS public.supply_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    sector TEXT NOT NULL, -- e.g., 'Northern Command', 'Eastern Command'
    location_coordinates POINT,
    altitude_meters INTEGER,
    contact_person TEXT,
    status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'alert', 'compromised'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inventory Items & Stock Levels
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID REFERENCES public.supply_bases(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Fuel/POL', 'Ammunition', 'Rations', 'Medical', 'Spares', 'Cold-Weather Gear'
    item_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    current_quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- 'liters', 'crates', 'rounds', 'tons', 'units'
    minimum_threshold NUMERIC NOT NULL,
    critical_threshold NUMERIC NOT NULL,
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Convoys & Shipments (Forward Logistics Movement)
CREATE TABLE IF NOT EXISTS public.convoys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convoy_number TEXT UNIQUE NOT NULL,
    origin_base_id UUID REFERENCES public.supply_bases(id),
    destination_base_id UUID REFERENCES public.supply_bases(id),
    departure_time TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    route_name TEXT,
    transit_status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_transit', 'delayed', 'delivered', 'aborted'
    assigned_escort_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AI Predictive Logistics Alerts
CREATE TABLE IF NOT EXISTS public.predictive_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID REFERENCES public.supply_bases(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL, -- 'critical_shortage_predicted', 'weather_route_blockage', 'consumption_surge', 'shelf_life_expiry'
    severity TEXT NOT NULL DEFAULT 'warning', -- 'low', 'medium', 'high', 'critical'
    confidence_score NUMERIC(5, 2), -- e.g. 94.50 %
    predicted_stockout_date TIMESTAMPTZ,
    recommendation TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Transport Fleet Vehicles (Module 3 GIS Logistics)
CREATE TABLE IF NOT EXISTS public.vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity NUMERIC NOT NULL CHECK (capacity > 0),
    capacity_unit TEXT NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_location_id UUID REFERENCES public.locations(location_id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.supply_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convoys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Default Policies: Allow read access for authenticated and anonymous client read (or customize per your requirements)
CREATE POLICY "Allow public read supply_bases" ON public.supply_bases FOR SELECT USING (true);
CREATE POLICY "Allow public read inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow public read convoys" ON public.convoys FOR SELECT USING (true);
CREATE POLICY "Allow public read predictive_alerts" ON public.predictive_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read vehicles" ON public.vehicles FOR SELECT USING (true);
