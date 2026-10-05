import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Copy, Terminal, Server } from 'lucide-react';

interface SupabaseSyncViewProps {
  isSupabaseConnected: boolean;
  onRefresh: () => void;
}

export const SupabaseSyncView: React.FC<SupabaseSyncViewProps> = ({
  isSupabaseConnected,
  onRefresh
}) => {
  const [copied, setCopied] = useState(false);

  const schemaSQL = `-- Indian Army Predictive Logistics & Forward Supply Chain Schema

CREATE TABLE public.locations (
  location_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type character varying NOT NULL,
  latitude numeric,
  longitude numeric,
  terrain character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (location_id)
);

CREATE TABLE public.inventory (
  inventory_id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  supply_type character varying NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0::numeric),
  unit character varying NOT NULL,
  safety_stock numeric NOT NULL DEFAULT 0 CHECK (safety_stock >= 0::numeric),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id),
  CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
);

CREATE TABLE public.consumption (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  supply_type character varying NOT NULL,
  consumption_date date NOT NULL,
  quantity_consumed numeric NOT NULL CHECK (quantity_consumed >= 0::numeric),
  unit character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT consumption_pkey PRIMARY KEY (id),
  CONSTRAINT fk_consumption_location FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
);

CREATE TABLE public.routes (
  route_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  destination_id uuid NOT NULL,
  distance_km numeric NOT NULL CHECK (distance_km > 0::numeric),
  travel_time_hr numeric NOT NULL CHECK (travel_time_hr > 0::numeric),
  terrain character varying,
  weather_status character varying DEFAULT 'Clear'::character varying,
  status character varying DEFAULT 'Open'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT routes_pkey PRIMARY KEY (route_id),
  CONSTRAINT fk_route_source FOREIGN KEY (source_id) REFERENCES public.locations(location_id),
  CONSTRAINT fk_route_destination FOREIGN KEY (destination_id) REFERENCES public.locations(location_id)
);

CREATE TABLE public.logistics (
  logistics_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  destination_id uuid NOT NULL,
  supply_type character varying NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit character varying NOT NULL,
  route_id uuid,
  status character varying NOT NULL DEFAULT 'Recommended'::character varying,
  dispatch_time timestamp with time zone,
  expected_arrival timestamp with time zone,
  actual_arrival timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT logistics_pkey PRIMARY KEY (logistics_id),
  CONSTRAINT fk_logistics_source FOREIGN KEY (source_id) REFERENCES public.locations(location_id),
  CONSTRAINT fk_logistics_destination FOREIGN KEY (destination_id) REFERENCES public.locations(location_id),
  CONSTRAINT fk_logistics_route FOREIGN KEY (route_id) REFERENCES public.routes(route_id)
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(schemaSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Status Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} color="#eab308" />
            <h2 className="font-heading" style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '0.05em' }}>
              DATABASE ENGINE & SCHEMA MANAGEMENT (`schema.txt`)
            </h2>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inspect system SQL tables and verify live connection with Supabase backend.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSupabaseConnected ? (
            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <CheckCircle2 size={15} /> SUPABASE INSTANCE CONNECTED
            </span>
          ) : (
            <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <AlertTriangle size={15} /> LOCAL SIMULATED DATABASE ACTIVE
            </span>
          )}
          <button onClick={onRefresh} className="btn-primary">
            TEST CONNECTION
          </button>
        </div>
      </div>

      {/* Database Tables Overview */}
      <div className="grid-3">
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1rem' }}>`public.locations`</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Forward Operating Bases, Command Depots, and sector GPS coordinates.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1rem' }}>`public.inventory`</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Stock quantities, supply categories, and safety stock thresholds.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1rem' }}>`public.consumption`</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Daily consumption logs for predictive AI stockout modeling.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1rem' }}>`public.routes`</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Mountain passes, terrain types, distances, travel times, and weather.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1rem' }}>`public.logistics`</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Convoy dispatch orders, payload tracking, dispatch & arrival timestamps.
          </p>
        </div>
      </div>

      {/* SQL Schema Code Viewer */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="#38bdf8" /> EXACT DATABASE SCHEMA (`schema.txt`)
          </h3>

          <button onClick={copyToClipboard} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <Copy size={14} /> {copied ? 'COPIED TO CLIPBOARD!' : 'COPY SQL SCHEMA'}
          </button>
        </div>

        <pre
          className="font-mono"
          style={{
            background: 'rgba(6, 11, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '0.82rem',
            color: '#34d399',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {schemaSQL}
        </pre>
      </div>
    </div>
  );
};
