import React, { useState } from 'react';
import { Location, LogisticsMovement, LogisticsRoute } from '../types/schema';
import {
  Truck,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CloudSnow,
  Radio,
  Play
} from 'lucide-react';

interface LogisticsViewProps {
  locations: Location[];
  routes: LogisticsRoute[];
  logistics: LogisticsMovement[];
  onOpenDispatchModal: () => void;
  onUpdateStatus: (logisticsId: string, status: LogisticsMovement['status']) => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  locations,
  routes,
  logistics,
  onOpenDispatchModal,
  onUpdateStatus
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredLogistics = logistics.filter(l => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const getStatusBadge = (status: LogisticsMovement['status']) => {
    switch (status) {
      case 'Recommended':
        return <span className="badge badge-warning">AI RECOMMENDED</span>;
      case 'Dispatched':
        return <span className="badge badge-info"><Radio size={12} className="animate-pulse-glow" /> DISPATCHED</span>;
      case 'In Transit':
        return <span className="badge badge-purple"><Truck size={12} className="animate-pulse-glow" /> IN TRANSIT</span>;
      case 'Delivered':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> DELIVERED</span>;
      case 'Delayed':
        return <span className="badge badge-danger"><AlertTriangle size={12} /> DELAYED</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={22} color="#eab308" />
            <h2 className="font-heading" style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '0.05em' }}>
              LOGISTICS CONVOY & DISPATCH TRACKER (`public.logistics`)
            </h2>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Track supply movements, high-altitude military convoys, and automated dispatch orders.
          </p>
        </div>

        <button onClick={onOpenDispatchModal} className="btn-primary">
          <Plus size={16} /> DISPATCH NEW CONVOY ORDER
        </button>
      </div>

      {/* Pipeline Tabs */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {['ALL', 'Recommended', 'Dispatched', 'In Transit', 'Delivered'].map(st => {
          const count = st === 'ALL' ? logistics.length : logistics.filter(l => l.status === st).length;
          const isActive = statusFilter === st;

          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="font-heading"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: isActive ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(234, 179, 8, 0.15)' : 'rgba(6, 11, 17, 0.5)',
                color: isActive ? '#eab308' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {st.toUpperCase()}
              <span
                style={{
                  background: isActive ? '#eab308' : 'rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#000' : '#fff',
                  borderRadius: '9999px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Convoy Grid */}
      <div className="grid-2">
        {filteredLogistics.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No convoy dispatch records found for status filter: {statusFilter}.
          </div>
        ) : (
          filteredLogistics.map(item => {
            const srcLoc = locations.find(l => l.location_id === item.source_id);
            const destLoc = locations.find(l => l.location_id === item.destination_id);
            const route = routes.find(r => r.route_id === item.route_id);

            const isRouteBlocked = route?.status === 'Blocked';

            return (
              <div
                key={item.logistics_id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: isRouteBlocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ID: {item.logistics_id}
                    </span>
                    <h3 className="font-heading" style={{ fontSize: '1.2rem', color: '#eab308', marginTop: '2px' }}>
                      {item.supply_type}
                    </h3>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Source -> Destination Route representation */}
                <div
                  style={{
                    background: 'rgba(6, 11, 17, 0.7)',
                    padding: '14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ORIGIN DEPO</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                      {srcLoc ? srcLoc.name : item.source_id}
                    </div>
                  </div>

                  <ArrowRight size={20} color="#38bdf8" />

                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>DESTINATION FORWARD BASE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                      {destLoc ? destLoc.name : item.destination_id}
                    </div>
                  </div>
                </div>

                {/* Quantity & Route Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-dim)' }}>PAYLOAD QUANTITY</div>
                    <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                      {item.quantity.toLocaleString()} {item.unit}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-dim)' }}>ASSIGNED MOUNTAIN ROUTE</div>
                    <div style={{ fontWeight: 600, color: route ? (route.status === 'Blocked' ? '#ef4444' : '#38bdf8') : '#9ca3af', marginTop: '2px' }}>
                      {route ? `${route.terrain} (${route.distance_km}km)` : 'Direct Air/Land'}
                    </div>
                  </div>
                </div>

                {/* Weather / Blocked Warning */}
                {route && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: isRouteBlocked ? '#ef4444' : '#f97316',
                      background: isRouteBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.08)',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <CloudSnow size={15} /> Route Weather: <strong>{route.weather_status}</strong> (Status: {route.status})
                  </div>
                )}

                {/* Timing */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }} className="font-mono">
                  <span>Dispatch: {item.dispatch_time ? new Date(item.dispatch_time).toLocaleTimeString() : 'Pending'}</span>
                  <span>Expected ETA: {item.expected_arrival ? new Date(item.expected_arrival).toLocaleTimeString() : 'TBD'}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  {item.status === 'Recommended' && (
                    <button
                      onClick={() => onUpdateStatus(item.logistics_id, 'Dispatched')}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
                    >
                      <Play size={14} /> AUTHORIZE & DISPATCH CONVOY
                    </button>
                  )}

                  {item.status === 'Dispatched' && (
                    <button
                      onClick={() => onUpdateStatus(item.logistics_id, 'In Transit')}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px', borderColor: '#38bdf8', color: '#38bdf8' }}
                    >
                      <Truck size={14} /> CONFIRM HIGH PASS TRANSIT
                    </button>
                  )}

                  {item.status === 'In Transit' && (
                    <button
                      onClick={() => onUpdateStatus(item.logistics_id, 'Delivered')}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px', borderColor: '#10b981', color: '#10b981' }}
                    >
                      <CheckCircle2 size={14} /> MARK DELIVERED TO BASE
                    </button>
                  )}

                  {item.status === 'Delivered' && (
                    <div style={{ width: '100%', textAlign: 'center', fontSize: '0.82rem', color: '#10b981', fontWeight: 600, padding: '6px' }}>
                      ✓ Delivered & Stock Reconciled
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
