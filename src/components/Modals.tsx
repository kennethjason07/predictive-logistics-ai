import React, { useState } from 'react';
import { Location, InventoryItem, LogisticsRoute, LogisticsMovement } from '../types/schema';
import { X, MapPin, Package, Truck, CloudSnow, TrendingUp } from 'lucide-react';

/* =========================================================================
   1. ADD LOCATION MODAL
   ========================================================================= */
interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (location: Omit<Location, 'location_id' | 'created_at'>) => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Forward Operating Base');
  const [latitude, setLatitude] = useState('34.2000');
  const [longitude, setLongitude] = useState('77.5000');
  const [terrain, setTerrain] = useState('High Altitude Alpine');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({
      name,
      type,
      latitude: parseFloat(latitude) || 34.0,
      longitude: parseFloat(longitude) || 77.0,
      terrain
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} /> ADD OPERATING LOCATION (`public.locations`)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LOCATION NAME</label>
            <input type="text" placeholder="e.g. Pangong Tso Forward Post" value={name} onChange={e => setName(e.target.value)} required className="input-field" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>BASE TYPE</label>
              <select value={type} onChange={e => setType(e.target.value)} className="input-field">
                <option value="Forward Operating Base">Forward Operating Base</option>
                <option value="Supply Hub">Supply Hub</option>
                <option value="Command Depot">Command Depot</option>
                <option value="Transit Depot">Transit Depot</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TERRAIN</label>
              <input type="text" value={terrain} onChange={e => setTerrain(e.target.value)} className="input-field" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LATITUDE</label>
              <input type="number" step="0.0001" value={latitude} onChange={e => setLatitude(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LONGITUDE</label>
              <input type="number" step="0.0001" value={longitude} onChange={e => setLongitude(e.target.value)} className="input-field" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">CANCEL</button>
            <button type="submit" className="btn-primary">REGISTER LOCATION</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   2. ADD / UPDATE INVENTORY MODAL
   ========================================================================= */
interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onAdd: (item: Omit<InventoryItem, 'inventory_id' | 'last_updated'>) => void;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ isOpen, onClose, locations, onAdd }) => {
  const [locationId, setLocationId] = useState(locations[0]?.location_id || '');
  const [supplyType, setSupplyType] = useState('Extreme Cold Climate Rations (ECC)');
  const [quantity, setQuantity] = useState('2500');
  const [unit, setUnit] = useState('Rations');
  const [safetyStock, setSafetyStock] = useState('4000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !supplyType) return;
    onAdd({
      location_id: locationId,
      supply_type: supplyType,
      quantity: parseFloat(quantity) || 0,
      unit,
      safety_stock: parseFloat(safetyStock) || 0
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> UPDATE / ADD INVENTORY (`public.inventory`)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>BASE LOCATION</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)} className="input-field">
              {locations.map(loc => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SUPPLY TYPE</label>
            <select value={supplyType} onChange={e => setSupplyType(e.target.value)} className="input-field">
              <option value="Extreme Cold Climate Rations (ECC)">Extreme Cold Climate Rations (ECC)</option>
              <option value="Ammunition 155mm Artillery">Ammunition 155mm Artillery</option>
              <option value="Aviation Turbine Fuel (ATF-Winter)">Aviation Turbine Fuel (ATF-Winter)</option>
              <option value="Diesel Winter Grade (-30C)">Diesel Winter Grade (-30C)</option>
              <option value="Medical Plasma & Oxygen Cylinders">Medical Plasma & Oxygen Cylinders</option>
              <option value="High-Altitude Special Clothing (ECC Clothing)">High-Altitude Special Clothing (ECC Clothing)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>QUANTITY</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>UNIT</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SAFETY STOCK</label>
              <input type="number" value={safetyStock} onChange={e => setSafetyStock(e.target.value)} className="input-field" required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">CANCEL</button>
            <button type="submit" className="btn-primary">SAVE INVENTORY</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   3. DISPATCH CONVOY MODAL
   ========================================================================= */
interface DispatchConvoyModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  routes: LogisticsRoute[];
  initialDestinationId?: string;
  initialSupplyType?: string;
  initialQuantity?: number;
  onAdd: (movement: Omit<LogisticsMovement, 'logistics_id' | 'created_at'>) => void;
}

export const DispatchConvoyModal: React.FC<DispatchConvoyModalProps> = ({
  isOpen,
  onClose,
  locations,
  routes,
  initialDestinationId,
  initialSupplyType,
  initialQuantity,
  onAdd
}) => {
  const [sourceId, setSourceId] = useState('loc-002'); // Leh HQ default
  const [destinationId, setDestinationId] = useState(initialDestinationId || 'loc-004');
  const [supplyType, setSupplyType] = useState(initialSupplyType || 'Extreme Cold Climate Rations (ECC)');
  const [quantity, setQuantity] = useState(initialQuantity ? String(initialQuantity) : '2000');
  const [unit, setUnit] = useState('Rations');

  if (!isOpen) return null;

  const matchedRoute = routes.find(r => r.source_id === sourceId && r.destination_id === destinationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      source_id: sourceId,
      destination_id: destinationId,
      supply_type: supplyType,
      quantity: parseFloat(quantity) || 1000,
      unit,
      route_id: matchedRoute ? matchedRoute.route_id : null,
      status: 'Dispatched',
      dispatch_time: new Date().toISOString(),
      expected_arrival: new Date(Date.now() + (matchedRoute ? matchedRoute.travel_time_hr * 3600000 : 8 * 3600000)).toISOString()
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} /> DISPATCH MILITARY CONVOY (`public.logistics`)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SOURCE DEPO (ORIGIN)</label>
              <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="input-field">
                {locations.map(loc => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DESTINATION BASE</label>
              <select value={destinationId} onChange={e => setDestinationId(e.target.value)} className="input-field">
                {locations.map(loc => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SUPPLY PAYLOAD TYPE</label>
            <input type="text" value={supplyType} onChange={e => setSupplyType(e.target.value)} className="input-field" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PAYLOAD QUANTITY</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>UNIT</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="input-field" required />
            </div>
          </div>

          {matchedRoute && (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: '#38bdf8' }}>
              Mapped Route: <strong>{matchedRoute.terrain}</strong> ({matchedRoute.distance_km}km, Weather: {matchedRoute.weather_status})
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">CANCEL</button>
            <button type="submit" className="btn-primary">AUTHORIZE DISPATCH</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   4. UPDATE ROUTE MODAL
   ========================================================================= */
interface UpdateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: LogisticsRoute | null;
  onUpdate: (routeId: string, status: LogisticsRoute['status'], weatherStatus: LogisticsRoute['weather_status']) => void;
}

export const UpdateRouteModal: React.FC<UpdateRouteModalProps> = ({ isOpen, onClose, route, onUpdate }) => {
  if (!isOpen || !route) return null;

  const [status, setStatus] = useState<LogisticsRoute['status']>(route.status);
  const [weatherStatus, setWeatherStatus] = useState<LogisticsRoute['weather_status']>(route.weather_status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(route.route_id, status, weatherStatus);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSnow size={18} /> UPDATE MOUNTAIN ROUTE STATUS (`public.routes`)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ROUTE</label>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>{route.terrain}</strong>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>WEATHER CONDITION</label>
            <select value={weatherStatus} onChange={e => setWeatherStatus(e.target.value as any)} className="input-field">
              <option value="Clear">Clear</option>
              <option value="Heavy Snowfall">Heavy Snowfall</option>
              <option value="Blizzard Warning">Blizzard Warning</option>
              <option value="Landslide Risk">Landslide Risk</option>
              <option value="Foggy">Foggy</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PASS ACCESSIBILITY STATUS</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="input-field">
              <option value="Open">Open</option>
              <option value="Restricted">Restricted (Military Priority Only)</option>
              <option value="Blocked">Blocked (Impassable Avalanche / Landslide)</option>
              <option value="Priority Only">Priority Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">CANCEL</button>
            <button type="submit" className="btn-primary">UPDATE ROUTE</button>
          </div>
        </form>
      </div>
    </div>
  );
};
