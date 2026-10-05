import React from 'react';
import { Location, LogisticsRoute } from '../types/schema';
import {
  CloudSnow,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Clock,
  ArrowRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';

interface RoutesViewProps {
  locations: Location[];
  routes: LogisticsRoute[];
  onOpenUpdateRouteModal: (route: LogisticsRoute) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({
  locations,
  routes,
  onOpenUpdateRouteModal
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CloudSnow size={22} color="#eab308" />
            <h2 className="font-heading" style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '0.05em' }}>
              HIGH-ALTITUDE MOUNTAIN ROUTE & WEATHER COMMAND (`public.routes`)
            </h2>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Monitor mountain passes, weather disruptions, avalanche risks, and road accessibility.
          </p>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid-2">
        {routes.map(r => {
          const srcLoc = locations.find(l => l.location_id === r.source_id);
          const destLoc = locations.find(l => l.location_id === r.destination_id);

          let statusBadge = <span className="badge badge-success">OPEN PASS</span>;
          if (r.status === 'Restricted') statusBadge = <span className="badge badge-warning">RESTRICTED PASS</span>;
          if (r.status === 'Blocked') statusBadge = <span className="badge badge-danger">BLOCKED / IMPASSABLE</span>;

          return (
            <div
              key={r.route_id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                border: r.status === 'Blocked' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.2rem', color: '#fff' }}>
                    {r.terrain}
                  </h3>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ROUTE ID: {r.route_id}
                  </span>
                </div>
                {statusBadge}
              </div>

              {/* Source -> Destination */}
              <div
                style={{
                  background: 'rgba(6, 11, 17, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.88rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>STARTING BASE</div>
                  <strong style={{ color: '#eab308' }}>{srcLoc ? srcLoc.name : r.source_id}</strong>
                </div>
                <ArrowRight size={18} color="#38bdf8" />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>DESTINATION BASE</div>
                  <strong style={{ color: '#eab308' }}>{destLoc ? destLoc.name : r.destination_id}</strong>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-dim)' }}>DISTANCE</div>
                  <div className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{r.distance_km} KM</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-dim)' }}>TRANSIT TIME</div>
                  <div className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{r.travel_time_hr} HRS</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-dim)' }}>WEATHER</div>
                  <div style={{ fontWeight: 700, color: r.weather_status === 'Clear' ? '#10b981' : '#f97316' }}>
                    {r.weather_status}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenUpdateRouteModal(r)}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: '0.85rem' }}
              >
                <Edit2 size={14} /> UPDATE WEATHER / PASS STATUS
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
