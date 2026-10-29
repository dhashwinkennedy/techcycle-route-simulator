import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  facilitiesApi,
  pickupPointsApi,
  simulationsApi,
} from '../api';
import {
  Facility,
  PickupPoint,
  SimulationListItem,
  SimulationRun,
} from '../types';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Building2,
  MapPin,
  Truck,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [selectedSimId, setSelectedSimId] = useState<string>('');
  const [activeSimulation, setActiveSimulation] = useState<SimulationRun | null>(null);

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'pickups' | 'facilities' | 'routes'>('pickups');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [facs, points, sims] = await Promise.all([
          facilitiesApi.list().catch(() => []),
          pickupPointsApi.list().catch(() => []),
          simulationsApi.list().catch(() => []),
        ]);

        setFacilities(facs);
        setPickupPoints(points);
        setSimulations(sims);

        if (sims.length > 0) {
          const latestId = sims[sims.length - 1].run_id;
          setSelectedSimId(latestId);
          const simDetail = await simulationsApi.get(latestId).catch(() => null);
          setActiveSimulation(simDetail);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSimChange = async (runId: string) => {
    setSelectedSimId(runId);
    if (!runId) {
      setActiveSimulation(null);
      setSelectedRouteIndex(null);
      return;
    }
    try {
      const sim = await simulationsApi.get(runId);
      setActiveSimulation(sim);
      setSelectedRouteIndex(null);
    } catch (err) {
      console.error('Failed to load selected simulation:', err);
    }
  };

  const filteredPoints = pickupPoints.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const selectedPoint = pickupPoints.find((p) => p.id === selectedPointId);
  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  if (isLoading) {
    return <LoadingSpinner label="Loading operational map & facilities..." size="lg" className="min-h-[60vh]" />;
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Operations & Live Map</span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive GIS visualisation for depots, collection nodes and route assignments.
          </p>
        </div>

        {/* Simulation Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">
            Project Routes:
          </label>
          <select
            value={selectedSimId}
            onChange={(e) => handleSimChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">No Route Overlay</option>
            {simulations.map((s) => (
              <option key={s.run_id} value={s.run_id}>
                Run {s.run_id.slice(0, 8)} ({s.status}) - {new Date(s.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Map (left/center) + Operations Sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <InteractiveMap
            facilities={facilities}
            pickupPoints={pickupPoints}
            routes={activeSimulation?.routes || []}
            selectedPointId={selectedPointId}
            selectedFacilityId={selectedFacilityId}
            selectedRouteIndex={selectedRouteIndex}
            onSelectPoint={(id) => {
              setSelectedPointId(id);
              setSelectedFacilityId(null);
              setActiveTab('pickups');
            }}
            onSelectFacility={(id) => {
              setSelectedFacilityId(id);
              setSelectedPointId(null);
              setActiveTab('facilities');
            }}
            onSelectRoute={(idx) => {
              setSelectedRouteIndex(idx);
              setActiveTab('routes');
            }}
            height="calc(100vh - 240px)"
          />
        </div>

        {/* Operations Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-240px)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-medium text-center bg-slate-950/40">
            <button
              onClick={() => setActiveTab('pickups')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'pickups'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Pickups ({pickupPoints.length})
            </button>
            <button
              onClick={() => setActiveTab('facilities')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'facilities'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Facilities ({facilities.length})
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'routes'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Routes ({activeSimulation?.routes?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* PICKUPS TAB */}
            {activeTab === 'pickups' && (
              <>
                {/* Search & Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search points..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                    {['all', 'critical', 'urgent', 'due', 'normal'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2 py-0.5 rounded-md capitalize font-medium transition-colors ${
                          statusFilter === st
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Point List */}
                <div className="space-y-2">
                  {filteredPoints.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No matching pickup points found.
                    </div>
                  ) : (
                    filteredPoints.map((point) => {
                      const isSelected = selectedPointId === point.id;
                      return (
                        <div
                          key={point.id}
                          onClick={() => {
                            setSelectedPointId(point.id);
                            setSelectedFacilityId(null);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-slate-200 text-sm">
                                {point.name}
                              </h4>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                {point.category}
                              </p>
                            </div>
                            <Badge status={point.status} size="sm" />
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <div>
                              <span>Pending Load:</span>
                              <p className="font-semibold text-slate-200">
                                {point.current_pending_weight_kg} kg / {point.current_pending_volume_m3} m³
                              </p>
                            </div>
                            <div>
                              <span>Utilisation:</span>
                              <p className="font-semibold text-slate-200">
                                W: {point.weight_utilisation_percent}% | V: {point.volume_utilisation_percent}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-500">
                              Wait: {point.waiting_days.toFixed(1)} days
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pickup-points/${point.id}`);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline text-[11px]"
                            >
                              <span>Details & Load</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* FACILITIES TAB */}
            {activeTab === 'facilities' && (
              <div className="space-y-2">
                {facilities.map((facility) => {
                  const isSelected = selectedFacilityId === facility.id;
                  return (
                    <div
                      key={facility.id}
                      onClick={() => {
                        setSelectedFacilityId(facility.id);
                        setSelectedPointId(null);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-200 text-sm">
                          {facility.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {facility.active ? 'Active Hub' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-slate-400 mt-1 text-[11px]">
                        {facility.address || 'No street address specified'}
                      </p>

                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        Coordinates: {facility.latitude.toFixed(5)}, {facility.longitude.toFixed(5)}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/facilities');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline text-[11px]"
                        >
                          <span>Manage Facility</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROUTES TAB */}
            {activeTab === 'routes' && (
              <div className="space-y-3">
                {!activeSimulation || !activeSimulation.routes || activeSimulation.routes.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>No active route simulation overlay.</p>
                    <p className="text-slate-400 mt-1">
                      Select a simulation run from the dropdown above or create a new plan.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate('/simulations/new')}
                    >
                      Plan Simulation
                    </Button>
                  </div>
                ) : (
                  activeSimulation.routes.map((route, idx) => {
                    const isSelected = selectedRouteIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedRouteIndex(idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-950/40 border-sky-500 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">
                            Trip #{route.trip_number}
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {route.distance_km} km
                          </span>
                        </div>

                        <div className="mt-1 text-slate-400 text-[11px]">
                          Vehicle ID:{' '}
                          <code className="text-slate-200 font-mono">
                            {route.vehicle_id}
                          </code>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500">Stops:</span>
                            <p className="font-medium text-slate-200">
                              {route.stops.length} collections
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Duration:</span>
                            <p className="font-medium text-slate-200">
                              {route.total_minutes} min
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/simulations/${activeSimulation.run_id}`);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline text-[11px]"
                          >
                            <span>Open Route Plan</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
