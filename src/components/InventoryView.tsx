import React, { useState } from 'react';
import { Location, InventoryItem } from '../types/schema';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

interface InventoryViewProps {
  locations: Location[];
  inventory: InventoryItem[];
  onOpenAddInventoryModal: () => void;
  onOpenAddLocationModal: () => void;
  onNavigateToIntelligence?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  locations,
  inventory,
  onOpenAddInventoryModal,
  onOpenAddLocationModal,
  onNavigateToIntelligence
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');
  const [selectedSupplyFilter, setSelectedSupplyFilter] = useState('ALL');

  const supplyTypes = Array.from(new Set(inventory.map(i => i.supply_type)));

  const filteredInventory = inventory.filter(item => {
    const loc = locations.find(l => l.location_id === item.location_id);
    const locName = loc ? loc.name.toLowerCase() : '';
    const supplyName = item.supply_type.toLowerCase();
    const matchesSearch = locName.includes(searchTerm.toLowerCase()) || supplyName.includes(searchTerm.toLowerCase());

    const matchesLocation = selectedLocationFilter === 'ALL' || item.location_id === selectedLocationFilter;
    const matchesSupply = selectedSupplyFilter === 'ALL' || item.supply_type === selectedSupplyFilter;

    return matchesSearch && matchesLocation && matchesSupply;
  });

  const criticalCount = inventory.filter(i => i.quantity < i.safety_stock).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Actions */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={22} color="#eab308" />
            <h2 className="font-heading" style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '0.05em' }}>
              FORWARD BASE INVENTORY & SAFETY STOCK (`public.inventory`)
            </h2>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time stock monitoring, critical threshold alerts, and reserve allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onNavigateToIntelligence && (
            <button
              onClick={onNavigateToIntelligence}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000' }}
            >
              <TrendingUp size={16} /> OPEN MODULE 2 INTELLIGENCE
            </button>
          )}
          <button onClick={onOpenAddLocationModal} className="btn-secondary">
            <MapPin size={16} /> ADD OPERATING LOCATION
          </button>
          <button onClick={onOpenAddInventoryModal} className="btn-secondary">
            <Plus size={16} /> UPDATE STOCK
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search base location or supply item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Location Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={selectedLocationFilter}
            onChange={e => setSelectedLocationFilter(e.target.value)}
            className="input-field"
            style={{ width: '220px' }}
          >
            <option value="ALL">All Base Locations ({locations.length})</option>
            {locations.map(loc => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supply Type Filter */}
        <div>
          <select
            value={selectedSupplyFilter}
            onChange={e => setSelectedSupplyFilter(e.target.value)}
            className="input-field"
            style={{ width: '220px' }}
          >
            <option value="ALL">All Supply Types ({supplyTypes.length})</option>
            {supplyTypes.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>
            INVENTORY ITEMS TABLE ({filteredInventory.length} RECORDS)
          </h3>
          {criticalCount > 0 && (
            <span className="badge badge-danger">
              <AlertTriangle size={13} /> {criticalCount} STOCKS BELOW SAFETY THRESHOLD
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(6, 11, 17, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#9ca3af', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>BASE LOCATION (`location_id`)</th>
                <th style={{ padding: '12px 16px' }}>SUPPLY TYPE (`supply_type`)</th>
                <th style={{ padding: '12px 16px' }}>AVAILABLE QUANTITY</th>
                <th style={{ padding: '12px 16px' }}>SAFETY THRESHOLD</th>
                <th style={{ padding: '12px 16px' }}>STATUS & PROGRESS</th>
                <th style={{ padding: '12px 16px' }}>LAST UPDATED</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No matching inventory records found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const loc = locations.find(l => l.location_id === item.location_id);
                  const isCritical = item.quantity < item.safety_stock;
                  const ratio = item.safety_stock > 0 ? (item.quantity / item.safety_stock) * 100 : 100;

                  return (
                    <tr
                      key={item.inventory_id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {/* Location Name */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                        <div>{loc ? loc.name : item.location_id}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '2px' }}>{loc?.type}</div>
                      </td>

                      {/* Supply Type */}
                      <td style={{ padding: '14px 16px', color: '#eab308', fontWeight: 600 }}>
                        {item.supply_type}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px' }} className="font-mono">
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: isCritical ? '#ef4444' : '#ffffff' }}>
                          {item.quantity.toLocaleString()}
                        </span>{' '}
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.unit}</span>
                      </td>

                      {/* Safety Stock */}
                      <td style={{ padding: '14px 16px' }} className="font-mono">
                        <span style={{ color: 'var(--text-muted)' }}>{item.safety_stock.toLocaleString()}</span>{' '}
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.unit}</span>
                      </td>

                      {/* Status & Bar */}
                      <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          {isCritical ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                              CRITICAL DEFICIT
                            </span>
                          ) : ratio < 150 ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                              MODERATE
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              HEALTHY
                            </span>
                          )}
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {ratio.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(ratio, 100)}%`,
                              background: isCritical ? '#ef4444' : ratio < 150 ? '#f97316' : '#10b981',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }} className="font-mono">
                        {item.last_updated ? new Date(item.last_updated).toLocaleString() : 'Just Now'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
