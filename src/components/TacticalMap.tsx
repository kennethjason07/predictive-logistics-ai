import React, { useState } from 'react';
import { Location, InventoryItem, LogisticsRoute, LogisticsMovement } from '../types/schema';
import {
  MapPin,
  Shield,
  AlertTriangle,
  Radio,
  Truck,
  CloudSnow,
  ChevronRight,
  Zap,
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface TacticalMapProps {
  locations: Location[];
  inventory: InventoryItem[];
  routes: LogisticsRoute[];
  logistics: LogisticsMovement[];
  onSelectLocation?: (loc: Location) => void;
  onOpenDispatchModal?: (locId?: string) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  locations,
  inventory,
  routes,
  logistics,
  onSelectLocation,
  onOpenDispatchModal
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('loc-004'); // default Siachen

  // Map coordinates (scaled to 1000 x 600 canvas)
  // Coordinates mapping algorithm for Indian Army northern & eastern sectors:
  const getCanvasCoords = (loc: Location) => {
    // Map latitude [27 to 36] and longitude [74 to 92] into 1000 x 600 svg
    const minLat = 27.0, maxLat = 36.5;
    const minLng = 73.5, maxLng = 92.5;

    const x = ((loc.longitude - minLng) / (maxLng - minLng)) * 880 + 60;
    // Y is inverted in SVG
    const y = 540 - ((loc.latitude - minLat) / (maxLat - minLat)) * 480;

    return { x, y };
  };

  const selectedLoc = locations.find(l => l.location_id === selectedLocationId) || locations[0];
  const locInventory = inventory.filter(i => i.location_id === selectedLoc?.location_id);
  const locLogistics = logistics.filter(
    l => l.source_id === selectedLoc?.location_id || l.destination_id === selectedLoc?.location_id
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* SVG Canvas Map */}
      <div className="glass-panel military-grid-pattern" style={{ position: 'relative', minHeight: '560px', padding: '20px', overflow: 'hidden' }}>
        {/* Header HUD */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Navigation size={18} color="#eab308" />
            <h2 className="font-heading" style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: '0.05em' }}>
              NORTHERN & EASTERN SECTOR TACTICAL DISPLAY
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }} className="font-mono">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Route Open
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }}></span> Restricted Pass
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Blocked / Blizzard
            </span>
          </div>
        </div>

        {/* Tactical Map Container */}
        <div style={{ position: 'relative', width: '100%', height: '480px', background: 'rgba(6, 11, 17, 0.7)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.15)', overflow: 'hidden' }}>
          
          {/* Radar background sweep effect */}
          <div
            className="radar-sweeper"
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-25%',
              width: '150%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 330deg, rgba(16, 185, 129, 0.08) 360deg)',
              pointerEvents: 'none'
            }}
          />

          <svg width="100%" height="100%" viewBox="0 0 1000 560" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              {/* Route line glowing filters */}
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Draw Routes lines */}
            {routes.map(r => {
              const srcLoc = locations.find(l => l.location_id === r.source_id);
              const destLoc = locations.find(l => l.location_id === r.destination_id);
              if (!srcLoc || !destLoc) return null;

              const p1 = getCanvasCoords(srcLoc);
              const p2 = getCanvasCoords(destLoc);

              let lineColor = '#10b981'; // Open
              let strokeDash = 'none';

              if (r.status === 'Restricted') {
                lineColor = '#f97316';
                strokeDash = '6,4';
              } else if (r.status === 'Blocked') {
                lineColor = '#ef4444';
                strokeDash = '4,4';
              }

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={r.route_id}>
                  {/* Route path line */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={lineColor}
                    strokeWidth={r.status === 'Blocked' ? 3 : 2}
                    strokeDasharray={strokeDash}
                    opacity={0.8}
                  />

                  {/* Route Info Pill */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-55"
                      y="-12"
                      width="110"
                      height="24"
                      rx="4"
                      fill="#0a111a"
                      stroke={lineColor}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill={lineColor}
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {r.distance_km}km • {r.weather_status}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Draw Location Markers */}
            {locations.map(loc => {
              const { x, y } = getCanvasCoords(loc);
              const isSelected = loc.location_id === selectedLocationId;
              const locInv = inventory.filter(i => i.location_id === loc.location_id);
              const hasCriticalDeficit = locInv.some(i => i.quantity < i.safety_stock);

              return (
                <g
                  key={loc.location_id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => {
                    setSelectedLocationId(loc.location_id);
                    if (onSelectLocation) onSelectLocation(loc);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulse Circle for Critical Low Stock */}
                  {hasCriticalDeficit && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      className="animate-pulse-glow"
                    />
                  )}

                  {/* Node Outer Ring */}
                  <circle
                    r={isSelected ? '14' : '10'}
                    fill={isSelected ? 'rgba(234, 179, 8, 0.25)' : 'rgba(15, 23, 36, 0.9)'}
                    stroke={hasCriticalDeficit ? '#ef4444' : isSelected ? '#eab308' : '#38bdf8'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />

                  {/* Center Dot */}
                  <circle
                    r="4"
                    fill={hasCriticalDeficit ? '#ef4444' : isSelected ? '#eab308' : '#38bdf8'}
                  />

                  {/* Location Name & Type Label */}
                  <g transform="translate(18, 4)">
                    <rect
                      x="-4"
                      y="-14"
                      width={loc.name.length * 7 + 16}
                      height="22"
                      rx="4"
                      fill="rgba(10, 17, 26, 0.88)"
                      stroke={isSelected ? '#eab308' : 'rgba(255, 255, 255, 0.1)'}
                      strokeWidth="1"
                    />
                    <text
                      x="2"
                      y="0"
                      fill={isSelected ? '#eab308' : '#ffffff'}
                      fontSize="11"
                      fontFamily="Rajdhani"
                      fontWeight="700"
                    >
                      {loc.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Side Inspector Drawer */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '6px' }}>
              {selectedLoc?.type}
            </span>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#fff', marginTop: '4px' }}>
              {selectedLoc?.name}
            </h3>
          </div>
        </div>

        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Terrain Sector:</span>
            <strong style={{ color: '#fff' }}>{selectedLoc?.terrain}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GPS Coordinates:</span>
            <strong className="font-mono" style={{ color: '#eab308' }}>
              {selectedLoc?.latitude.toFixed(4)}°N, {selectedLoc?.longitude.toFixed(4)}°E
            </strong>
          </div>
        </div>

        {/* Stock Level Summary */}
        <div style={{ marginTop: '8px' }}>
          <h4 className="font-heading" style={{ fontSize: '0.95rem', color: '#eab308', marginBottom: '10px' }}>
            CURRENT BASE INVENTORY ({locInventory.length} ITEMS)
          </h4>

          {locInventory.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No inventory items registered at this base.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {locInventory.map(item => {
                const ratio = item.safety_stock > 0 ? (item.quantity / item.safety_stock) * 100 : 100;
                const isCritical = item.quantity < item.safety_stock;

                return (
                  <div
                    key={item.inventory_id}
                    style={{
                      background: 'rgba(6, 11, 17, 0.6)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{item.supply_type}</span>
                      <span className="font-mono" style={{ color: isCritical ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                        {item.quantity.toLocaleString()} {item.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(ratio, 100)}%`,
                          background: isCritical ? '#ef4444' : ratio < 150 ? '#f97316' : '#10b981',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      <span>Safety Stock: {item.safety_stock.toLocaleString()} {item.unit}</span>
                      {isCritical && <span style={{ color: '#ef4444', fontWeight: 700 }}>DEFICIT ALERT</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <button
            onClick={() => onOpenDispatchModal && onOpenDispatchModal(selectedLoc?.location_id)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Truck size={16} /> DISPATCH CONVOY TO THIS BASE
          </button>
        </div>
      </div>
    </div>
  );
};
