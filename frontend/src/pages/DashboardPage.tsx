import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  dashboardApi,
  facilitiesApi,
  pickupPointsApi,
  simulationsApi,
  vehiclesApi,
} from '../api';
import {
  DashboardSummary,
  Facility,
  PickupPoint,
  SimulationListItem,
  SimulationRun,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { InteractiveMap } from '../components/map/InteractiveMap';
import {
  Building2,
  Truck,
  MapPin,
  AlertTriangle,
  Scale,
  Box,
  Route,
  Zap,
  DollarSign,
  PlusCircle,
  PlaySquare,
  ArrowRight,
  Clock,
  History,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [latestSimDetail, setLatestSimDetail] = useState<SimulationRun | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, facData, pickData, simData] = await Promise.all([
        dashboardApi.getSummary().catch(() => null),
        facilitiesApi.list().catch(() => []),
        pickupPointsApi.list().catch(() => []),
        simulationsApi.list().catch(() => []),
      ]);

      setSummary(sumData);
      setFacilities(facData);
      setPickupPoints(pickData);
      setSimulations(simData);

      if (simData && simData.length > 0) {
        // Fetch latest simulation metrics
        const latestId = simData[simData.length - 1].run_id;
        const detail = await simulationsApi.get(latestId).catch(() => null);
        setLatestSimDetail(detail);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Loading operational dashboard..." size="lg" className="min-h-[50vh]" />;
  }

  const latestMetrics = latestSimDetail?.metrics?.optimised;

  return (
    <div className="space-y-6">
      {/* Top Header / Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Operations Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time e-waste logistics, collection demands and fleet routing state.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/facilities')}
            icon={<Building2 className="w-4 h-4" />}
          >
            + Facility
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pickup-points')}
            icon={<MapPin className="w-4 h-4" />}
          >
            + Pickup Point
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/vehicles')}
            icon={<Truck className="w-4 h-4" />}
          >
            + Lorry
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/simulations/new')}
            icon={<PlaySquare className="w-4 h-4" />}
          >
            Plan Simulation
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Backend Communication Error">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facilities */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Recycling Facilities
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {summary ? summary.facilities : facilities.length}
              </h3>
              <p className="text-xs text-emerald-400 mt-1">
                {facilities.filter((f) => f.active).length} Active hubs
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Lorries */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Available Lorries
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {summary ? summary.vehicles : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Fleet ready for assignment
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-400">
              <Truck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Points */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Pickup Points
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {summary ? summary.pickup_points : pickupPoints.length}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-rose-400 font-semibold">
                  {summary ? summary.by_status.critical : 0} Critical
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-semibold">
                  {summary ? summary.by_status.urgent : 0} Urgent
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-yellow-400 font-semibold">
                  {summary ? summary.by_status.due : 0} Due
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending E-Waste Load */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pending E-Waste Load
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {summary ? `${summary.pending_weight_kg.toLocaleString()} kg` : '—'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {summary ? `${summary.pending_volume_m3.toLocaleString()} m³ cargo volume` : '—'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-400">
              <Scale className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Route Metrics Banner */}
      {latestMetrics ? (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-900/90 border-emerald-900/40">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h4 className="font-semibold text-slate-100">
                    Latest Route Simulation Plan
                  </h4>
                  <Badge status={latestSimDetail?.status || 'planned'} size="sm" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Run ID: <code className="font-mono text-slate-300">{latestSimDetail?.run_id}</code>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/simulations/${latestSimDetail?.run_id}`)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                View Full Run & Execution
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div>
                <p className="text-xs text-slate-400">Total Road Distance</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {latestMetrics.total_road_distance_km} km
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Route Time</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5">
                  {latestMetrics.driving_time_minutes + latestMetrics.loading_service_minutes} min
                </p>
                <p className="text-[11px] text-slate-500">
                  ({latestMetrics.driving_time_minutes}m drive + {latestMetrics.loading_service_minutes}m service)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Estimated CO₂ Emissions</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {latestMetrics.estimated_emissions_kg_co2} kg CO₂
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Operating Cost</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5">
                  ₹{latestMetrics.estimated_operating_cost.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/60 border-dashed border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-400">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">
                  No simulations planned yet
                </h4>
                <p className="text-xs text-slate-400">
                  Run a route optimisation simulation to see estimated distance, time, emissions and cost.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/simulations/new')}
              icon={<PlaySquare className="w-4 h-4" />}
            >
              Generate Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Interactive Map Preview & Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 text-base flex items-center gap-2">
              <span>Geographic Overview</span>
            </h3>
            <Link
              to="/map"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
            >
              <span>Full Interactive Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <InteractiveMap
            facilities={facilities}
            pickupPoints={pickupPoints}
            routes={latestSimDetail?.routes || []}
            height="460px"
          />
        </div>

        {/* Recent Simulations Sidebar (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 text-base flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Simulation Runs</span>
            </h3>
            <Link
              to="/simulations"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          <Card className="h-[460px] flex flex-col">
            <CardContent className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2">
              {simulations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                  <PlaySquare className="w-8 h-8 text-slate-600 mb-2" />
                  <p>No previous simulation runs.</p>
                  <p className="text-slate-400 mt-1">
                    Click "Plan Simulation" to generate your first route plan.
                  </p>
                </div>
              ) : (
                simulations.slice(-6).reverse().map((sim) => (
                  <div
                    key={sim.run_id}
                    onClick={() => navigate(`/simulations/${sim.run_id}`)}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-300 truncate max-w-[150px]">
                        {sim.run_id.slice(0, 8)}...
                      </span>
                      <Badge status={sim.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(sim.created_at).toLocaleString()}</span>
                      <span className="text-emerald-400 font-medium">Details &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
