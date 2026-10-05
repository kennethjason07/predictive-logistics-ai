import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Location, LogisticsRoute } from '../types/schema';
import { RankedRouteResult, InfeasibleRouteResult } from '../types/gis';

interface GisMapProps {
  locations: Location[];
  sourceLocationId?: string;
  destinationLocationId?: string;
  recommendedRouteResult?: RankedRouteResult | null;
  alternativeRouteResults?: RankedRouteResult[];
  infeasibleRouteResults?: InfeasibleRouteResult[];
  allRoutes?: LogisticsRoute[];
  onSelectLocation?: (location: Location) => void;
  onSelectRoute?: (route: LogisticsRoute) => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  locations,
  sourceLocationId,
  destinationLocationId,
  recommendedRouteResult,
  alternativeRouteResults = [],
  infeasibleRouteResults = [],
  allRoutes = [],
  onSelectLocation,
  onSelectRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default view over Jammu & Kashmir / Ladakh / Northern Command region
      const map = L.map(mapContainerRef.current, {
        center: [34.1526, 76.5771],
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      // Standard OpenStreetMap Tile Layer with Dark Tactical Filter (No API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        className: 'dark-tactical-tiles'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update Map Layers whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // 1. Draw Location Markers
    locations.forEach(loc => {
      const isSource = loc.location_id === sourceLocationId;
      const isDest = loc.location_id === destinationLocationId;

      let markerColor = '#38bdf8'; // Default Cyan
      let ringColor = 'rgba(56, 189, 248, 0.4)';
      let labelRole = '';

      if (isSource) {
        markerColor = '#eab308'; // Gold
        ringColor = 'rgba(234, 179, 8, 0.6)';
        labelRole = ' [SOURCE DEPOT]';
      } else if (isDest) {
        markerColor = '#10b981'; // Emerald
        ringColor = 'rgba(16, 185, 129, 0.6)';
        labelRole = ' [DESTINATION]';
      }

      const customIcon = L.divIcon({
        className: 'custom-gis-marker',
        html: `
          <div style="
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${ringColor};
              animation: pulse-glow 2s infinite;
            "></div>
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2px solid #000;
              box-shadow: 0 0 10px ${markerColor};
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const latLng: [number, number] = [loc.latitude, loc.longitude];
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroup);

      const popupHtml = `
        <div style="font-family: sans-serif; color: #000; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #000; font-size: 14px; font-weight: bold;">
            ${loc.name}${labelRole}
          </h4>
          <div style="font-size: 11px; color: #444;">
            <strong>Type:</strong> ${loc.type}<br/>
            <strong>Terrain:</strong> ${loc.terrain}<br/>
            <strong>GPS:</strong> ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectLocation) onSelectLocation(loc);
      });
    });

    // 2. Draw Routes (Recommended, Alternatives, Infeasible, or default)
    const processedRouteIds = new Set<string>();

    // Helper to draw route line
    const drawRouteLine = (
      route: LogisticsRoute,
      color: string,
      weight: number,
      dashArray: string,
      statusLabel: string,
      scoreText?: string
    ) => {
      const srcLoc = locations.find(l => l.location_id === route.source_id);
      const dstLoc = locations.find(l => l.location_id === route.destination_id);
      if (!srcLoc || !dstLoc) return;

      const p1: [number, number] = [srcLoc.latitude, srcLoc.longitude];
      const p2: [number, number] = [dstLoc.latitude, dstLoc.longitude];

      // Glow Underlayer if recommended
      if (color === '#eab308' || color === '#10b981') {
        L.polyline([p1, p2], {
          color,
          weight: weight + 6,
          opacity: 0.3
        }).addTo(layerGroup);
      }

      const polyline = L.polyline([p1, p2], {
        color,
        weight,
        dashArray,
        opacity: 0.85
      }).addTo(layerGroup);

      const roadCond = route.road_condition || 'GOOD';

      const popupContent = `
        <div style="font-family: sans-serif; color: #000; padding: 4px;">
          <strong style="font-size: 13px;">${route.terrain}</strong><br/>
          <span style="font-size: 11px;">
            Distance: <strong>${route.distance_km} km</strong> | Time: <strong>${route.travel_time_hr} h</strong><br/>
            Road: <strong>${roadCond}</strong> | Weather: <strong>${route.weather_status}</strong><br/>
            Status: <span style="font-weight: bold; color: ${color};">${statusLabel}</span> ${scoreText ? `(Score: ${scoreText})` : ''}
          </span>
        </div>
      `;

      polyline.bindPopup(popupContent);

      polyline.on('click', () => {
        if (onSelectRoute) onSelectRoute(route);
      });

      processedRouteIds.add(route.route_id);
    };

    // Recommended Route
    if (recommendedRouteResult) {
      drawRouteLine(
        recommendedRouteResult.route,
        '#eab308',
        5,
        'none',
        'RECOMMENDED',
        recommendedRouteResult.score.toString()
      );
    }

    // Alternative Feasible Routes
    alternativeRouteResults.forEach(res => {
      if (!processedRouteIds.has(res.route.route_id)) {
        drawRouteLine(
          res.route,
          '#38bdf8',
          3,
          '6, 6',
          'FEASIBLE ALTERNATIVE',
          res.score.toString()
        );
      }
    });

    // Infeasible Routes
    infeasibleRouteResults.forEach(res => {
      if (!processedRouteIds.has(res.route.route_id)) {
        drawRouteLine(
          res.route,
          '#ef4444',
          3,
          '4, 6',
          `INFEASIBLE (${res.reason})`
        );
      }
    });

    // Any other routes in allRoutes not yet drawn
    allRoutes.forEach(r => {
      if (!processedRouteIds.has(r.route_id)) {
        let color = '#10b981';
        let dash = 'none';
        if (r.status === 'Restricted') {
          color = '#f97316';
          dash = '6, 6';
        } else if (r.status === 'Blocked') {
          color = '#ef4444';
          dash = '4, 4';
        }
        drawRouteLine(r, color, 2, dash, r.status.toUpperCase());
      }
    });

    // Fit map bounds to encompass all active locations
    if (bounds.isValid() && locations.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [
    locations,
    sourceLocationId,
    destinationLocationId,
    recommendedRouteResult,
    alternativeRouteResults,
    infeasibleRouteResults,
    allRoutes,
    onSelectLocation,
    onSelectRoute
  ]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '520px',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Overlay legend */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          padding: '8px 14px',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'rgba(6, 11, 17, 0.88)'
        }}
      >
        <div style={{ fontWeight: 700, color: '#eab308', marginBottom: '2px' }} className="font-heading">
          TACTICAL MAP LEGEND
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '3px', background: '#eab308' }} /> Recommended Route
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '2px', background: '#38bdf8', borderBottom: '1px dashed #38bdf8' }} /> Feasible Alternative
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '2px', background: '#ef4444', borderBottom: '1px dotted #ef4444' }} /> Blocked / Infeasible
        </div>
      </div>
    </div>
  );
};
