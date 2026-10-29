import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { Facility, PickupPoint, SimulationRoute } from '../../types';
import {
  createFacilityIcon,
  createPickupIcon,
  ROUTE_COLORS,
} from './mapIcons';
import { Badge } from '../common/Badge';
import { GeoapifyNotice } from './GeoapifyNotice';
import { MapLegend } from './MapLegend';
import {
  Maximize2,
  Layers,
  Building2,
  MapPin,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InteractiveMapProps {
  facilities?: Facility[];
  pickupPoints?: PickupPoint[];
  routes?: SimulationRoute[];
  selectedPointId?: string | null;
  selectedFacilityId?: string | null;
  selectedRouteIndex?: number | null;
  onSelectPoint?: (id: string) => void;
  onSelectFacility?: (id: string) => void;
  onSelectRoute?: (index: number) => void;
  height?: string;
  showControls?: boolean;
}

// Map bounds auto-fitter helper
const FitBoundsHelper: React.FC<{
  bounds: LatLngBoundsExpression | null;
  trigger: number;
}> = ({ bounds, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [bounds, map, trigger]);
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities = [],
  pickupPoints = [],
  routes = [],
  selectedPointId,
  selectedFacilityId,
  selectedRouteIndex,
  onSelectPoint,
  onSelectFacility,
  onSelectRoute,
  height = '600px',
  showControls = true,
}) => {
  const [showFacilities, setShowFacilities] = useState(true);
  const [showPickups, setShowPickups] = useState(true);
  const [showRouteLines, setShowRouteLines] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);

  const geoapifyKey = import.meta.env.VITE_GEOAPIFY_MAP_KEY;
  const isGeoapifyConfigured = Boolean(
    geoapifyKey &&
      geoapifyKey !== 'your_geoapify_map_key' &&
      geoapifyKey.trim().length > 5
  );

  const tileUrl = isGeoapifyConfigured
    ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isGeoapifyConfigured
    ? 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Compute map bounds from all active items
  const allCoords: [number, number][] = [];
  facilities.forEach((f) => {
    if (f.latitude && f.longitude) allCoords.push([f.latitude, f.longitude]);
  });
  pickupPoints.forEach((p) => {
    if (p.latitude && p.longitude) allCoords.push([p.latitude, p.longitude]);
  });
  routes.forEach((r) => {
    if (r.geometry?.coordinates) {
      r.geometry.coordinates.forEach(([lon, lat]) => allCoords.push([lat, lon]));
    }
  });

  const mapBounds: LatLngBoundsExpression | null =
    allCoords.length > 0 ? L.latLngBounds(allCoords) : null;

  // Default center if no items exist (e.g. Chennai coordinates from seed demo)
  const defaultCenter: [number, number] = [13.0827, 80.2707];

  // Helper map for pickup points by ID for fast stop lookup
  const pickupMap = new Map<string, PickupPoint>();
  pickupPoints.forEach((p) => pickupMap.set(p.id, p));

  // Map to find stop sequence numbers if routes are active
  const stopSequenceMap = new Map<string, number>();
  routes.forEach((r) => {
    r.stops.forEach((s) => {
      stopSequenceMap.set(s.pickup_point_id, s.sequence);
    });
  });

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 flex flex-col"
      style={{ height }}
    >
      {/* Top Banner Notice */}
      <div className="absolute top-3 left-3 z-[1000] max-w-sm pointer-events-auto">
        <GeoapifyNotice hasKey={isGeoapifyConfigured} />
      </div>

      {/* Map Control Buttons */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
          {/* Fit Bounds */}
          <button
            onClick={() => setFitTrigger((prev) => prev + 1)}
            className="p-2.5 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 shadow-lg backdrop-blur-md transition-colors"
            title="Fit All on Map"
            aria-label="Fit all entities"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-colors ${
              showLegend
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
            title="Toggle Map Legend"
            aria-label="Toggle map legend"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Legend Popover */}
      {showLegend && (
        <div className="absolute top-16 right-3 z-[1000] max-w-xs pointer-events-auto">
          <MapLegend showRoutes={routes.length > 0} />
        </div>
      )}

      {/* Layer Visibility Filters Bar */}
      {showControls && (
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-slate-900/95 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md pointer-events-auto text-xs">
          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              showFacilities
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Facilities ({facilities.length})</span>
          </button>

          <button
            onClick={() => setShowPickups(!showPickups)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              showPickups
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pickups ({pickupPoints.length})</span>
          </button>

          {routes.length > 0 && (
            <button
              onClick={() => setShowRouteLines(!showRouteLines)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                showRouteLines
                  ? 'bg-sky-950 text-sky-300 border-sky-800'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Routes ({routes.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full z-0"
      >
        <TileLayer url={tileUrl} attribution={attribution} />

        <FitBoundsHelper bounds={mapBounds} trigger={fitTrigger} />

        {/* Facilities Markers */}
        {showFacilities &&
          facilities.map((facility) => {
            if (!facility.latitude || !facility.longitude) return null;
            const isSelected = selectedFacilityId === facility.id;

            return (
              <Marker
                key={`facility-${facility.id}`}
                position={[facility.latitude, facility.longitude]}
                icon={createFacilityIcon()}
                eventHandlers={{
                  click: () => onSelectFacility?.(facility.id),
                }}
              >
                <Popup>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
                      <span className="font-bold text-sm text-emerald-400">
                        {facility.name}
                      </span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                        Recycling Depot
                      </span>
                    </div>

                    <p className="text-slate-300">
                      {facility.address || 'No street address specified'}
                    </p>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {facility.latitude.toFixed(5)}, {facility.longitude.toFixed(5)}
                    </div>

                    <div className="pt-1.5 border-t border-slate-700 flex justify-between items-center">
                      <Link
                        to="/facilities"
                        className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                      >
                        <span>Manage Facility</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Pickup Points Markers */}
        {showPickups &&
          pickupPoints.map((point) => {
            if (!point.latitude || !point.longitude) return null;
            const stopSeq = stopSequenceMap.get(point.id);

            return (
              <Marker
                key={`pickup-${point.id}`}
                position={[point.latitude, point.longitude]}
                icon={createPickupIcon(point, stopSeq)}
                eventHandlers={{
                  click: () => onSelectPoint?.(point.id),
                }}
              >
                <Popup>
                  <div className="space-y-2 text-xs min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
                      <span className="font-bold text-sm text-slate-100">
                        {point.name}
                      </span>
                      <Badge status={point.status} size="sm" />
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-400">Category: </span>
                      <span className="font-medium text-slate-200">
                        {point.category}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pending Load:</span>
                        <span className="font-medium text-slate-200">
                          {point.current_pending_weight_kg} kg |{' '}
                          {point.current_pending_volume_m3} m³
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Utilisation:</span>
                        <span className="font-medium text-slate-200">
                          W: {point.weight_utilisation_percent}% | V:{' '}
                          {point.volume_utilisation_percent}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Waiting Time:</span>
                        <span className="font-medium text-amber-300">
                          {point.waiting_days.toFixed(1)} days
                        </span>
                      </div>
                    </div>

                    {stopSeq !== undefined && (
                      <div className="p-1.5 bg-sky-950/60 border border-sky-800 rounded text-sky-200 font-medium text-center">
                        Planned Stop #{stopSeq} in Route
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-700 flex justify-between items-center">
                      <Link
                        to={`/pickup-points/${point.id}`}
                        className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                      >
                        <span>View & Add Load</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Route Polylines */}
        {showRouteLines &&
          routes.map((route, idx) => {
            const isSelected = selectedRouteIndex === idx;
            const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];

            // Extract lat/lng coordinates from backend GeoJSON LineString [lon, lat]
            const positions: [number, number][] =
              route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [];

            if (positions.length < 2) return null;

            return (
              <Polyline
                key={`route-${route.vehicle_id}-${route.trip_number}-${idx}`}
                positions={positions}
                pathOptions={{
                  color: routeColor,
                  weight: isSelected ? 6 : 4,
                  opacity: isSelected ? 1.0 : 0.85,
                  dashArray: isSelected ? undefined : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectRoute?.(idx),
                }}
              >
                <Popup>
                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: routeColor }}
                      />
                      <span>Trip #{route.trip_number}</span>
                    </div>
                    <div className="text-slate-300">
                      Vehicle ID:{' '}
                      <span className="font-mono text-slate-100">
                        {route.vehicle_id}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Total Distance:{' '}
                      <span className="font-semibold text-emerald-400">
                        {route.distance_km} km
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Driving Time: {route.drive_minutes} min | Service:{' '}
                      {route.service_minutes} min
                    </div>
                    <div className="text-slate-300">
                      Total Stops: {route.stops.length}
                    </div>
                    <div className="text-[11px] text-slate-400 italic">
                      Routing geometry: {route.routing_source}
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
      </MapContainer>
    </div>
  );
};
