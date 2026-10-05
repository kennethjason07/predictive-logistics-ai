import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Radio,
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  MapPin,
  Package,
  Truck,
  CloudSnow,
  AlertTriangle,
  Brain,
  Layers,
  Navigation
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSupabaseConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  criticalAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSupabaseConnected,
  onRefresh,
  isLoading,
  criticalAlertCount
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'gis-logistics', label: 'GIS Route Planning (Mod 3)', icon: Navigation },
    { id: 'inventory-intelligence', label: 'Inventory Intelligence (Mod 2)', icon: Layers },
    { id: 'overview', label: 'Tactical Command Map', icon: Shield },
    { id: 'forecasting', label: 'AI Demand Forecasting', icon: Brain },
    { id: 'inventory', label: 'Inventory & Safety Stock', icon: Package },
    { id: 'logistics', label: 'Logistics & Convoys', icon: Truck },
    { id: 'consumption', label: 'Consumption Logs', icon: TrendingUp },
    { id: 'routes', label: 'Routes & Weather Status', icon: CloudSnow },
    { id: 'database', label: 'Database & Schema', icon: Database }
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 24px', marginBottom: '20px' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        {/* Title & Crest */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(16,185,129,0.2))',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)'
            }}
          >
            <Shield size={28} color="#eab308" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff', textTransform: 'uppercase' }}>
                INDIAN ARMY <span style={{ color: '#eab308' }}>LOGISTICS COMMAND</span>
              </h1>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                <Radio size={12} className="animate-pulse-glow" /> SECURE MIL-NET
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              AI-Powered Predictive Logistics & Forward Operating Supply Chain Management System
            </p>
          </div>
        </div>

        {/* Right side info & status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* UTC Clock */}
          <div
            className="font-mono glass-panel"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'rgba(56, 189, 248, 0.2)'
            }}
          >
            <Clock size={15} color="#38bdf8" />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{time || 'ZULU TIME'}</span>
          </div>

          {/* Database Connection Status */}
          <div
            className="glass-panel"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Database size={15} color={isSupabaseConnected ? '#10b981' : '#f97316'} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supabase DB:</span>
            {isSupabaseConnected ? (
              <span className="badge badge-success">LIVE HYBRID</span>
            ) : (
              <span className="badge badge-warning">LOCAL SIMULATED</span>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            title="Reload Tactical State"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            SYNC
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasAlert =
            (tab.id === 'inventory' || tab.id === 'inventory-intelligence') &&
            criticalAlertCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="font-heading"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(16, 185, 129, 0.08))'
                  : 'rgba(15, 23, 36, 0.5)',
                color: isActive ? '#eab308' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#eab308' : 'var(--text-muted)'} />
              {tab.label}
              {hasAlert && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    marginLeft: '4px'
                  }}
                >
                  {criticalAlertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
