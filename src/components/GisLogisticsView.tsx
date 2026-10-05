import React, { useState, useEffect } from 'react';
import { Location, LogisticsRoute, Vehicle } from '../types/schema';
import {
  RoutePlanResponse,
  RouteWeights,
  DEFAULT_ROUTE_WEIGHTS,
  RankedRouteResult,
  InfeasibleRouteResult
} from '../types/gis';
import { gisLogisticsService } from '../services/gisLogisticsService';
import { GisMap } from './GisMap';
import {
  Navigation,
  MapPin,
  Truck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Layers,
  ChevronRight,
  Info,
  Zap,
  Gauge,
  CloudSnow,
  Activity
} from 'lucide-react';

interface GisLogisticsViewProps {
  locations: Location[];
  routes: LogisticsRoute[];
  onAutoDispatch?: (sourceId: string, destId: string, supplyType: string, quantity: number, routeId?: string) => void;
}

export const GisLogisticsView: React.FC<GisLogisticsViewProps> = ({
  locations,
  routes,
  onAutoDispatch
}) => {
  // Form selections
  const [sourceId, setSourceId] = useState<string>('loc-depot-01');
  const [destinationId, setDestinationId] = useState<string>('loc-base-alpha');
  const [supplyType, setSupplyType] = useState<string>('Fuel');
  const [quantity, setQuantity] = useState<number>(400);

  // Configurable weights state
  const [weights, setWeights] = useState<RouteWeights>({ ...DEFAULT_ROUTE_WEIGHTS });
  const [showWeightsConfig, setShowWeightsConfig] = useState<boolean>(false);

  // Results & UI State
  const [planResult, setPlanResult] = useState<RoutePlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<LogisticsRoute | null>(null);

  // Load vehicles
  const fetchVehicles = async () => {
    const vehs = await gisLogisticsService.getVehicles();
    setAvailableVehicles(vehs);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Execute Route Planning Engine
  const handlePlanRoute = async () => {
    setIsPlanning(true);
    try {
      const response = await gisLogisticsService.planRoute({
        source_location_id: sourceId,
        destination_location_id: destinationId,
        supply_type: supplyType,
        quantity,
        custom_weights: weights
      });
      setPlanResult(response);
      if (response.recommended_route) {
        setSelectedRouteDetail(response.recommended_route.route);
      }
    } catch (e) {
      console.error('Failed to evaluate routes:', e);
    } finally {
      setIsPlanning(false);
    }
  };

  // Auto-plan whenever parameters or underlying data updates
  useEffect(() => {
    handlePlanRoute();
  }, [sourceId, destinationId, supplyType, quantity, weights, locations.length, routes.length]);

  // Preset Scenario Loader (Section 30 Demo Scenario)
  const handleLoadDemoScenario = () => {
    setSourceId('loc-depot-01');
    setDestinationId('loc-base-alpha');
    setSupplyType('Fuel');
    setQuantity(400);
    setWeights({ ...DEFAULT_ROUTE_WEIGHTS });
  };

  const selectedSourceLoc = locations.find(l => l.location_id === sourceId);
  const selectedDestLoc = locations.find(l => l.location_id === destinationId);

  const totalWeightSum = (
    weights.distance +
    weights.time +
    weights.terrain +
    weights.road +
    weights.weather +
    weights.capacity
  ).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner & Demo Preset Quick Action */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(10, 17, 26, 0.9), rgba(15, 23, 36, 0.8))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Navigation size={24} color="#eab308" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.4rem', color: '#fff', letterSpacing: '0.04em' }}>
                MODULE 3 — GIS LOGISTICS & ROUTE PLANNING ENGINE
              </h2>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                PROTOTYPE SCORING ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Data-driven multi-criteria route optimization considering road conditions, terrain, weather delays, & transport capacity constraints.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleLoadDemoScenario}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            title="Load Section 30 Demo Scenario (Central Depot → Forward Base Alpha, 400 L Fuel)"
          >
            <Zap size={14} color="#eab308" /> LOAD DEMO SCENARIO
          </button>

          <button
            onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            className="btn-secondary"
            style={{
              fontSize: '0.85rem',
              padding: '8px 14px',
              borderColor: showWeightsConfig ? '#eab308' : 'var(--border-card)'
            }}
          >
            <Sliders size={14} color={showWeightsConfig ? '#eab308' : 'var(--text-muted)'} />
            {showWeightsConfig ? 'HIDE WEIGHTS' : 'CONFIGURE WEIGHTS'}
          </button>
        </div>
      </div>

      {/* Weight Tuning Config Drawer */}
      {showWeightsConfig && (
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            background: 'rgba(10, 17, 26, 0.95)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 className="font-heading" style={{ color: '#eab308', fontSize: '1.1rem' }}>
              ⚙️ ROUTE EVALUATION MULTI-CRITERIA WEIGHT CONFIGURATION
            </h4>
            <span style={{ fontSize: '0.8rem', color: totalWeightSum === '1.00' ? '#10b981' : '#f97316' }} className="font-mono">
              Total Weights Sum: <strong>{totalWeightSum}</strong>
            </span>
          </div>

          <div className="grid-3" style={{ gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Distance Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.distance * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.distance}
                onChange={e => setWeights({ ...weights, distance: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Travel Time Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.time * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.time}
                onChange={e => setWeights({ ...weights, time: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Terrain Difficulty Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.terrain * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.terrain}
                onChange={e => setWeights({ ...weights, terrain: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Road Condition Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.road * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.road}
                onChange={e => setWeights({ ...weights, road: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Weather Impact Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.weather * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.weather}
                onChange={e => setWeights({ ...weights, weather: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Transport Capacity Weight:</span>
                <span className="font-mono" style={{ color: '#eab308' }}>{(weights.capacity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={weights.capacity}
                onChange={e => setWeights({ ...weights, capacity: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '6px', accentColor: '#eab308' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Control Panel — Form Inputs */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="#eab308" /> GIS LOGISTICS ROUTE PLANNER
        </h3>

        <div className="grid-4" style={{ alignItems: 'flex-end', gap: '16px' }}>
          {/* Source Location */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              SOURCE LOCATION (DEPOT)
            </label>
            <select
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              className="input-field"
            >
              {locations.map(loc => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Location */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              DESTINATION LOCATION (FORWARD BASE)
            </label>
            <select
              value={destinationId}
              onChange={e => setDestinationId(e.target.value)}
              className="input-field"
            >
              {locations.map(loc => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Supply Type */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              SUPPLY TYPE
            </label>
            <select
              value={supplyType}
              onChange={e => setSupplyType(e.target.value)}
              className="input-field"
            >
              <option value="Fuel">Fuel (POL / Winter Diesel)</option>
              <option value="Extreme Cold Climate Rations (ECC)">ECC Rations</option>
              <option value="Ammunition 155mm Artillery">Ammunition 155mm Artillery</option>
              <option value="Medical Plasma & Oxygen Cylinders">Medical Supplies & Plasma</option>
              <option value="Equipment & Spares">Equipment & Spare Parts</option>
            </select>
          </div>

          {/* Quantity & Plan Route Button */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              SHIPMENT QUANTITY
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="1"
                max="50000"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button
                onClick={handlePlanRoute}
                disabled={isPlanning}
                className="btn-primary"
                style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
              >
                {isPlanning ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> EVALUATING...
                  </>
                ) : (
                  <>
                    <Navigation size={16} /> PLAN ROUTE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Infeasible Banner Callouts */}
      {planResult && planResult.status !== 'SUCCESS' && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={24} color="#ef4444" />
          <div>
            <strong style={{ fontSize: '0.95rem' }} className="font-heading">
              FEASIBILITY ALERT: {planResult.status.replace(/_/g, ' ')}
            </strong>
            <p style={{ fontSize: '0.82rem', marginTop: '2px' }}>{planResult.error_message}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Leaflet Map & Recommended Route Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* Leaflet GIS Map */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>
              GEOGRAPHIC ROUTE & NETWORK MAP DISPLAY
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">
              Source: {selectedSourceLoc?.name || 'Selected Depot'} ➔ Dest: {selectedDestLoc?.name || 'Forward Base'}
            </span>
          </div>

          <GisMap
            locations={locations}
            sourceLocationId={sourceId}
            destinationLocationId={destinationId}
            recommendedRouteResult={planResult?.recommended_route}
            alternativeRouteResults={planResult?.alternatives}
            infeasibleRouteResults={planResult?.infeasible_routes}
            allRoutes={routes}
            onSelectLocation={loc => console.log('Location selected:', loc.name)}
            onSelectRoute={rt => setSelectedRouteDetail(rt)}
          />
        </div>

        {/* Recommended Route Card & Explainability Side Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {planResult?.recommended_route ? (
            <>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> RECOMMENDED FEASIBLE ROUTE
                  </span>
                  <span className="font-mono" style={{ color: '#eab308', fontWeight: 700, fontSize: '0.9rem' }}>
                    SCORE: {planResult.recommended_route.score}
                  </span>
                </div>
                <h3 className="font-heading" style={{ fontSize: '1.3rem', color: '#fff', marginTop: '8px' }}>
                  {planResult.recommended_route.route.terrain}
                </h3>
              </div>

              {/* Metrics Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ background: 'rgba(6, 11, 17, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>DISTANCE</span>
                  <strong className="font-mono" style={{ color: '#fff', fontSize: '1rem' }}>
                    {planResult.recommended_route.route.distance_km} km
                  </strong>
                </div>

                <div style={{ background: 'rgba(6, 11, 17, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>TRAVEL TIME</span>
                  <strong className="font-mono" style={{ color: '#38bdf8', fontSize: '1rem' }}>
                    {planResult.recommended_route.route.travel_time_hr} hours
                  </strong>
                </div>

                <div style={{ background: 'rgba(6, 11, 17, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ROAD CONDITION</span>
                  <strong style={{ color: '#10b981' }}>
                    {planResult.recommended_route.route.road_condition || 'GOOD'}
                  </strong>
                </div>

                <div style={{ background: 'rgba(6, 11, 17, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>WEATHER STATUS</span>
                  <strong style={{ color: '#eab308' }}>
                    {planResult.recommended_route.route.weather_status}
                  </strong>
                </div>
              </div>

              {/* Transport Vehicle Assigned */}
              {planResult.assigned_vehicle && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700 }} className="font-heading">
                    <Truck size={16} /> ASSIGNED TRANSPORT FLEET
                  </div>
                  <div style={{ color: '#fff', fontWeight: 600, marginTop: '4px' }}>
                    {planResult.assigned_vehicle.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Capacity: {planResult.assigned_vehicle.capacity} {planResult.assigned_vehicle.capacity_unit} | Payload Req: {quantity}
                  </div>
                </div>
              )}

              {/* Explainable Recommendation — WHY THIS ROUTE? */}
              <div>
                <h4 className="font-heading" style={{ fontSize: '0.95rem', color: '#eab308', marginBottom: '10px' }}>
                  WHY WAS THIS ROUTE RECOMMENDED?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  {planResult.recommended_route.explanation_points.map((pt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#e2e8f0' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span>{pt.replace(/^✓\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatch Action */}
              {onAutoDispatch && (
                <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                  <button
                    onClick={() =>
                      onAutoDispatch(
                        sourceId,
                        destinationId,
                        supplyType,
                        quantity,
                        planResult.recommended_route?.route.route_id
                      )
                    }
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Truck size={16} /> AUTHORIZE CONVOY ON THIS ROUTE
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <AlertTriangle size={36} color="#f97316" style={{ margin: '0 auto 12px auto' }} />
              <h4 className="font-heading" style={{ color: '#fff', fontSize: '1.1rem' }}>
                NO RECOMMENDED ROUTE
              </h4>
              <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                {planResult?.error_message || 'Select source, destination, and quantity to run route planning.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Route Comparison Table (Section 22 Requirement) */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#eab308" /> COMPREHENSIVE ROUTE COMPARISON & RANKING TABLE
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Feasible & Blocked Routes Evaluated by Scoring Engine
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>RANK / STATUS</th>
                <th style={{ padding: '10px 14px' }}>ROUTE / PASS NAME</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>DISTANCE</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>TIME</th>
                <th style={{ padding: '10px 14px' }}>TERRAIN</th>
                <th style={{ padding: '10px 14px' }}>ROAD COND.</th>
                <th style={{ padding: '10px 14px' }}>WEATHER</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>CAPACITY</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {/* Feasible Routes */}
              {planResult?.recommended_route && (
                <tr
                  key={planResult.recommended_route.route.route_id}
                  style={{
                    background: 'rgba(234, 179, 8, 0.12)',
                    borderBottom: '1px solid rgba(234, 179, 8, 0.3)'
                  }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-success">★ RECOMMENDED (#1)</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 700 }}>
                    {planResult.recommended_route.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }} className="font-mono">
                    {planResult.recommended_route.route.distance_km} km
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }} className="font-mono">
                    {planResult.recommended_route.route.travel_time_hr} h
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {planResult.recommended_route.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600 }}>
                    {planResult.recommended_route.route.road_condition || 'GOOD'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#eab308' }}>
                    {planResult.recommended_route.route.weather_status}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                    ✓ FEASIBLE
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#eab308', fontWeight: 700, fontSize: '1rem' }} className="font-mono">
                    {planResult.recommended_route.score}
                  </td>
                </tr>
              )}

              {planResult?.alternatives.map((alt, idx) => (
                <tr
                  key={alt.route.route_id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'rgba(6, 11, 17, 0.4)'
                  }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-info">FEASIBLE (#{idx + 2})</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#fff' }}>
                    {alt.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }} className="font-mono">
                    {alt.route.distance_km} km
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }} className="font-mono">
                    {alt.route.travel_time_hr} h
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {alt.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>
                    {alt.route.road_condition || 'GOOD'}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {alt.route.weather_status}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10b981' }}>
                    ✓
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }} className="font-mono">
                    {alt.score}
                  </td>
                </tr>
              ))}

              {/* Infeasible Routes */}
              {planResult?.infeasible_routes.map(inf => (
                <tr
                  key={inf.route.route_id}
                  style={{
                    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-danger">INFEASIBLE</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#f87171' }}>
                    {inf.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-dim)' }} className="font-mono">
                    {inf.route.distance_km} km
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-dim)' }} className="font-mono">
                    {inf.route.travel_time_hr} h
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>
                    {inf.route.terrain}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#f87171' }}>
                    {inf.route.road_condition || 'POOR'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#f87171' }}>
                    {inf.route.weather_status}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>
                    ✗
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
