import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { simulationsApi, facilitiesApi, pickupPointsApi } from '../api';
import {
  SimulationRun,
  Facility,
  PickupPoint,
  SimulationRoute,
  RoutePlanMetrics,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { useApp } from '../context/AppContext';
import {
  Route,
  ArrowLeft,
  Truck,
  Building2,
  MapPin,
  CheckCircle2,
  Play,
  Clock,
  AlertTriangle,
  Scale,
  Box,
  BarChart3,
  DollarSign,
  Fuel,
  Info,
  ChevronRight,
  StepForward,
} from 'lucide-react';

export const SimulationDetailPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [simulation, setSimulation] = useState<SimulationRun | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab
  const [viewTab, setViewTab] = useState<'routes' | 'comparison' | 'deferred'>('routes');
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  // Execution modal state
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!runId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [simData, facData, pointData] = await Promise.all([
        simulationsApi.get(runId),
        facilitiesApi.list().catch(() => []),
        pickupPointsApi.list().catch(() => []),
      ]);
      setSimulation(simData);
      setFacilities(facData);
      setPickupPoints(pointData);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [runId]);

  const handleExecute = async () => {
    if (!runId || !simulation) return;
    setIsExecuting(true);
    try {
      const res = await simulationsApi.execute(runId);
      addToast('success', res.message || 'Simulation executed: collections applied to inventory');
      setExecutionMessage(res.message);
      setSimulation((prev) => (prev ? { ...prev, status: 'executed' } : null));
      setIsExecuteModalOpen(false);
    } catch (err: any) {
      addToast('error', err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStepwiseAdvance = async () => {
    if (!runId) return;
    try {
      await simulationsApi.advance(runId);
    } catch (err: any) {
      addToast(
        'info',
        err.message ||
          'Backend note: Stepwise execution is reserved. Use "Execute Simulation" for atomic collection updates.'
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading simulation plan & route geometry..." size="lg" className="min-h-[60vh]" />;
  }

  if (error || !simulation) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/simulations')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Simulations
        </Button>
        <Alert variant="error" title="Simulation Not Found">
          {error || 'Unable to retrieve the requested simulation plan.'}
        </Alert>
      </div>
    );
  }

  const facilityMap = new Map<string, Facility>();
  facilities.forEach((f) => facilityMap.set(f.id, f));

  const pointMap = new Map<string, PickupPoint>();
  pickupPoints.forEach((p) => pointMap.set(p.id, p));

  const optMetrics = simulation.metrics?.optimised;
  const baseMetrics = simulation.metrics?.baseline;
  const reductions = simulation.metrics?.percentage_reduction;

  const currentRoute: SimulationRoute | undefined = simulation.routes?.[selectedRouteIdx];
  const homeFacility = currentRoute ? facilityMap.get(currentRoute.facility_id) : undefined;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/simulations')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            All Runs
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                <span>Simulation Run</span>
                <span className="font-mono text-emerald-400">
                  {simulation.run_id.slice(0, 8)}
                </span>
              </h1>
              <Badge status={simulation.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Planned at: {new Date(simulation.simulation_time).toLocaleString()} | Provider:{' '}
              <span className="text-slate-300 font-medium">{simulation.routing_provider}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStepwiseAdvance}
            icon={<StepForward className="w-4 h-4" />}
            title="Attempt stepwise advance (Backend 501 reserved info)"
          >
            Step Advance
          </Button>

          {simulation.status === 'planned' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExecuteModalOpen(true)}
              icon={<Play className="w-4 h-4" />}
            >
              Execute Collections
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Executed & Applied</span>
            </div>
          )}
        </div>
      </div>

      {/* Backend Execution Confirmation */}
      {executionMessage && (
        <Alert variant="success" title="Execution Completed">
          {executionMessage}
        </Alert>
      )}

      {/* Warnings & Notices */}
      {simulation.warnings && simulation.warnings.length > 0 && (
        <Alert variant="info" title="Routing System Notice">
          {simulation.warnings.map((w, idx) => (
            <p key={idx}>{w}</p>
          ))}
        </Alert>
      )}

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setViewTab('routes')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            viewTab === 'routes'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Vehicle Trips ({simulation.routes.length})</span>
        </button>

        <button
          onClick={() => setViewTab('comparison')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            viewTab === 'comparison'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Basic vs Optimised Comparison</span>
        </button>

        <button
          onClick={() => setViewTab('deferred')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            viewTab === 'deferred'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Deferred Pickups ({simulation.deferred_pickups.length})</span>
        </button>
      </div>

      {/* TAB 1: ROUTES & MAP VIEW */}
      {viewTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <InteractiveMap
              facilities={facilities}
              pickupPoints={pickupPoints}
              routes={simulation.routes}
              selectedRouteIndex={selectedRouteIdx}
              onSelectRoute={(idx) => setSelectedRouteIdx(idx)}
              height="580px"
            />

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Every lorry begins and ends its trip at its registered home facility depot.
                </span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Depot returns: {optMetrics?.depot_returns || simulation.routes.length}
              </span>
            </div>
          </div>

          {/* Route Breakdown Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Trip Selector Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {simulation.routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRouteIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    selectedRouteIdx === i
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700'
                  }`}
                >
                  Trip #{r.trip_number} ({r.distance_km} km)
                </button>
              ))}
            </div>

            {/* Current Route Detail Card */}
            {currentRoute && (
              <Card>
                <CardHeader>
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-sky-400" />
                        <span>Trip #{currentRoute.trip_number}</span>
                      </CardTitle>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Vehicle: {currentRoute.vehicle_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Home Hub: </span>
                      <strong className="text-slate-200">
                        {homeFacility?.name || currentRoute.facility_id}
                      </strong>
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 sm:p-5">
                  {/* Trip KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500">Distance</span>
                      <p className="font-bold text-emerald-400 mt-0.5">
                        {currentRoute.distance_km} km
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Drive Time</span>
                      <p className="font-bold text-slate-200 mt-0.5">
                        {currentRoute.drive_minutes}m
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Service</span>
                      <p className="font-bold text-slate-200 mt-0.5">
                        {currentRoute.service_minutes}m
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Total Shift</span>
                      <p className="font-bold text-sky-400 mt-0.5">
                        {currentRoute.total_minutes}m
                      </p>
                    </div>
                  </div>

                  {/* Stop Sequence List */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Ordered Collection Sequence
                    </h5>

                    {/* Depot Departure */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/60 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        0
                      </span>
                      <div className="flex-1">
                        <span className="font-bold text-emerald-300">
                          Depot Departure: {homeFacility?.name || 'Home Facility'}
                        </span>
                        <p className="text-[11px] text-slate-400">Empty lorry starts trip</p>
                      </div>
                    </div>

                    {/* Ordered Collection Stops */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {currentRoute.stops.map((stop) => {
                        const pt = pointMap.get(stop.pickup_point_id);

                        return (
                          <div
                            key={stop.sequence}
                            className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {stop.sequence}
                            </span>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">
                                  {pt?.name || stop.pickup_point_id}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  +{stop.planned_weight_kg} kg
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400">
                                {pt?.category || 'Collection Node'}
                              </p>

                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                                <span>Cargo: {stop.weight_after_kg} kg collected</span>
                                <span>Remaining: {stop.remaining_weight_capacity_kg} kg</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Depot Return */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/60 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        ✓
                      </span>
                      <div className="flex-1">
                        <span className="font-bold text-emerald-300">
                          Depot Return: {homeFacility?.name || 'Home Facility'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Lorry returns to home hub for unloading & processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BASIC VS OPTIMISED COMPARISON (PAGE I) */}
      {viewTab === 'comparison' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                Baseline vs. 2-Opt Savings Comparison Audit
              </p>
              <p className="text-slate-400 leading-relaxed">
                The backend computes road distance, driving duration, loading minutes, vehicle fleet utilization, fuel and emissions.
                Note: In this implementation, the backend baseline mirrors the 2-opt route plan snapshot, yielding 0.0% reduction pending nearest-neighbour benchmark integration.
              </p>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Distance */}
            <Card>
              <CardContent className="p-5 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-medium">Total Road Distance</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-emerald-400">
                    {optMetrics?.total_road_distance_km} km
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    {reductions?.distance ?? 0}% savings
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Baseline: {baseMetrics?.total_road_distance_km ?? optMetrics?.total_road_distance_km} km
                </p>
              </CardContent>
            </Card>

            {/* Time */}
            <Card>
              <CardContent className="p-5 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-medium">Total Operating Time</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-100">
                    {(optMetrics?.driving_time_minutes || 0) + (optMetrics?.loading_service_minutes || 0)} min
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {reductions?.time ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Drive: {optMetrics?.driving_time_minutes}m | Service: {optMetrics?.loading_service_minutes}m
                </p>
              </CardContent>
            </Card>

            {/* Emissions */}
            <Card>
              <CardContent className="p-5 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-medium">Estimated Emissions</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-amber-400">
                    {optMetrics?.estimated_emissions_kg_co2} kg
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    {reductions?.emissions ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Fuel: {optMetrics?.estimated_fuel_l} L diesel
                </p>
              </CardContent>
            </Card>

            {/* Operating Cost */}
            <Card>
              <CardContent className="p-5 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-medium">Operating Cost</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-100">
                    ₹{optMetrics?.estimated_operating_cost?.toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {reductions?.cost ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Trips: {optMetrics?.number_of_trips} | Returns: {optMetrics?.depot_returns}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-Side Detailed Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>Side-by-Side Metric Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-5">Metric</th>
                    <th className="py-3 px-5">Baseline Plan</th>
                    <th className="py-3 px-5">Optimised (2-Opt)</th>
                    <th className="py-3 px-5 text-right">Calculated Reduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Road Distance</td>
                    <td className="py-3 px-5 text-slate-400">
                      {baseMetrics?.total_road_distance_km ?? optMetrics?.total_road_distance_km} km
                    </td>
                    <td className="py-3 px-5 font-bold text-emerald-400">
                      {optMetrics?.total_road_distance_km} km
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.distance ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Driving Time</td>
                    <td className="py-3 px-5 text-slate-400">
                      {baseMetrics?.driving_time_minutes ?? optMetrics?.driving_time_minutes} min
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      {optMetrics?.driving_time_minutes} min
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.time ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Loading / Service Time</td>
                    <td className="py-3 px-5 text-slate-400">
                      {baseMetrics?.loading_service_minutes ?? optMetrics?.loading_service_minutes} min
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      {optMetrics?.loading_service_minutes} min
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      0.0%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Total Vehicle Operating Time</td>
                    <td className="py-3 px-5 text-slate-400">
                      {((baseMetrics?.driving_time_minutes ?? optMetrics?.driving_time_minutes ?? 0) +
                        (baseMetrics?.loading_service_minutes ?? optMetrics?.loading_service_minutes ?? 0))} min
                    </td>
                    <td className="py-3 px-5 font-bold text-sky-400">
                      {((optMetrics?.driving_time_minutes || 0) + (optMetrics?.loading_service_minutes || 0))} min
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.time ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Estimated Fuel Consumption</td>
                    <td className="py-3 px-5 text-slate-400">
                      {baseMetrics?.estimated_fuel_l ?? optMetrics?.estimated_fuel_l} L
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      {optMetrics?.estimated_fuel_l} L
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.emissions ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Estimated CO₂ Emissions</td>
                    <td className="py-3 px-5 text-slate-400">
                      {baseMetrics?.estimated_emissions_kg_co2 ?? optMetrics?.estimated_emissions_kg_co2} kg
                    </td>
                    <td className="py-3 px-5 font-bold text-amber-400">
                      {optMetrics?.estimated_emissions_kg_co2} kg
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.emissions ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Operating Cost</td>
                    <td className="py-3 px-5 text-slate-400">
                      ₹{(baseMetrics?.estimated_operating_cost ?? optMetrics?.estimated_operating_cost)?.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-100">
                      ₹{optMetrics?.estimated_operating_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-300">
                      {reductions?.cost ?? 0}%
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-5 font-medium text-slate-200">Collected Weight & Volume</td>
                    <td className="py-3 px-5 text-slate-400">
                      {optMetrics?.weight_collected_kg} kg | {optMetrics?.volume_collected_m3} m³
                    </td>
                    <td className="py-3 px-5 font-bold text-emerald-400">
                      {optMetrics?.weight_collected_kg} kg | {optMetrics?.volume_collected_m3} m³
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-slate-400">
                      100% Demand Served
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: DEFERRED PICKUPS */}
      {viewTab === 'deferred' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Deferred Pickups & Reasons</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {simulation.deferred_pickups.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-200">No Deferred Pickups</h4>
                <p className="text-slate-400 mt-1">
                  All eligible collection points were successfully accommodated within usable lorry capacities and working-time limits.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-3">
                  The following collection nodes could not be serviced in this simulation run. Review the authoritative reason returned by the backend:
                </p>

                {simulation.deferred_pickups.map((def, idx) => {
                  const pt = pointMap.get(def.pickup_point_id);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200 text-sm">
                          {pt?.name || def.pickup_point_id}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {pt?.category || 'Collection Node'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-medium">
                          {def.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Confirmation Modal */}
      <ConfirmationModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        onConfirm={handleExecute}
        title="Execute Simulation Collections"
        message="This action will permanently apply the planned collections: pending weights and volumes at the serviced pickup points will be reduced, and waiting clocks will reset. This operation cannot be undone."
        confirmText="Confirm & Execute Collections"
        variant="warning"
        isLoading={isExecuting}
      />
    </div>
  );
};
