import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  facilitiesApi,
  pickupPointsApi,
  simulationsApi,
  settingsApi,
} from '../api';
import {
  Facility,
  PickupPoint,
  PlanInput,
  SimulationSettings,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { useApp } from '../context/AppContext';
import {
  PlaySquare,
  Building2,
  MapPin,
  Route,
  CheckSquare,
  Square,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export const SimulationPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { simulationTime, addToast } = useApp();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form selections
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [selectAllFacilities, setSelectAllFacilities] = useState(true);

  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [autoSelectPoints, setAutoSelectPoints] = useState(true);

  const [includeOpportunistic, setIncludeOpportunistic] = useState(true);
  const [allowMultiTrip, setAllowMultiTrip] = useState(true);
  const [includeBaseline, setIncludeBaseline] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [facs, points, setts] = await Promise.all([
          facilitiesApi.list().catch(() => []),
          pickupPointsApi.list().catch(() => []),
          settingsApi.get().catch(() => null),
        ]);

        setFacilities(facs);
        setPickupPoints(points);
        setSettings(setts);

        // Default all active facilities
        const activeFacs = facs.filter((f) => f.active).map((f) => f.id);
        setSelectedFacilityIds(activeFacs);
      } catch (err: any) {
        addToast('error', err.message || 'Failed to initialize simulation planner');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [addToast]);

  // Compute eligible points count and demand
  const eligiblePoints = pickupPoints.filter((p) => {
    if (!p.active) return false;
    if (includeOpportunistic) return true;
    return p.status !== 'normal';
  });

  const criticalCount = pickupPoints.filter((p) => p.status === 'critical').length;
  const urgentCount = pickupPoints.filter((p) => p.status === 'urgent').length;
  const dueCount = pickupPoints.filter((p) => p.status === 'due').length;
  const normalCount = pickupPoints.filter((p) => p.status === 'normal').length;

  const totalEligibleWeight = eligiblePoints.reduce((acc, p) => acc + p.current_pending_weight_kg, 0);
  const totalEligibleVolume = eligiblePoints.reduce((acc, p) => acc + p.current_pending_volume_m3, 0);

  const handleFacilityToggle = (id: string) => {
    setSelectAllFacilities(false);
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePointToggle = (id: string) => {
    setAutoSelectPoints(false);
    setSelectedPointIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = async () => {
    setPlanError(null);

    const facIds = selectAllFacilities ? null : selectedFacilityIds;
    const ptIds = autoSelectPoints ? null : selectedPointIds;

    if (!selectAllFacilities && selectedFacilityIds.length === 0) {
      setPlanError('Please select at least one recycling facility for the simulation');
      return;
    }

    if (!autoSelectPoints && selectedPointIds.length === 0) {
      setPlanError('Please select at least one pickup point or enable auto-selection');
      return;
    }

    const payload: PlanInput = {
      facility_ids: facIds,
      pickup_point_ids: ptIds,
      include_baseline: includeBaseline,
      objective: 'distance',
      allow_multi_trip: allowMultiTrip,
      include_opportunistic_pickups: includeOpportunistic,
    };

    setIsSubmitting(true);
    try {
      const planResult = await simulationsApi.plan(payload);
      addToast('success', 'Optimised route plan generated successfully!');
      navigate(`/simulations/${planResult.run_id}`);
    } catch (err: any) {
      setPlanError(
        err.message ||
          'Failed to generate route plan. Check that facilities have available vehicles and registered pickup points exist.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading planner configuration..." size="lg" className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Route className="w-6 h-6 text-emerald-400" />
            <span>Route Optimisation Planner</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate capacity-constrained, 2-opt optimised vehicle collection trips and depot return schedules.
          </p>
        </div>

        {simulationTime && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Clock: {new Date(simulationTime).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {planError && (
        <Alert variant="error" title="Planning Failed">
          {planError}
        </Alert>
      )}

      {/* Eligible Demands Summary Banner */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-900/90 border-emerald-900/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Collection Demand Ready for Dispatch
            </h3>
            <span className="text-xs text-emerald-400 font-medium">
              {eligiblePoints.length} Eligible Points
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-rose-400 font-semibold uppercase">
                Critical (100%+)
              </span>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {criticalCount}
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold uppercase">
                Urgent (80%+)
              </span>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {urgentCount}
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-yellow-400 font-semibold uppercase">
                Due (70%+)
              </span>
              <p className="text-xl font-bold text-slate-100 mt-0.5">
                {dueCount}
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                Total Pending E-Waste
              </span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {totalEligibleWeight.toLocaleString()} kg
              </p>
              <p className="text-[10px] text-slate-500">
                {totalEligibleVolume.toFixed(2)} m³ cargo volume
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Participating Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>1. Recycling Facilities & Depots</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <label className="text-xs text-slate-300 font-medium">
                Include all active facilities
              </label>
              <input
                type="checkbox"
                checked={selectAllFacilities}
                onChange={(e) => {
                  setSelectAllFacilities(e.target.checked);
                  if (e.target.checked) {
                    setSelectedFacilityIds(facilities.filter((f) => f.active).map((f) => f.id));
                  }
                }}
                className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {facilities.map((fac) => {
                const isSelected = selectedFacilityIds.includes(fac.id);
                return (
                  <div
                    key={fac.id}
                    onClick={() => handleFacilityToggle(fac.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{fac.name}</p>
                      <p className="text-[11px] text-slate-500">{fac.address || 'Chennai'}</p>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Optimisation Rules & Objective */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Sliders className="w-5 h-5 text-sky-400" />
              <span>2. Algorithmic Objectives & Constraints</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Optimisation Objective
              </label>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                Minimize Total Road Travel Distance (km)
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Include Baseline Plan</p>
                  <p className="text-[11px] text-slate-400">
                    Provides baseline comparisons for distance, time, and emissions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={includeBaseline}
                  onChange={(e) => setIncludeBaseline(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Opportunistic Pickups</p>
                  <p className="text-[11px] text-slate-400">
                    Include normal (&lt;70%) nodes if lorry has remaining capacity.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={includeOpportunistic}
                  onChange={(e) => setIncludeOpportunistic(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Multi-Trip Execution</p>
                  <p className="text-[11px] text-slate-400">
                    Allow lorries to return to depot, unload, and perform additional trips.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowMultiTrip}
                  onChange={(e) => setAllowMultiTrip(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configured Safety Margins & Working Limits Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-slate-500">Weight Safety Margin:</span>
          <p className="font-bold text-slate-200 mt-0.5">
            {settings ? settings.weight_safety_margin * 100 : 10}%
          </p>
        </div>
        <div>
          <span className="text-slate-500">Volume Safety Margin:</span>
          <p className="font-bold text-slate-200 mt-0.5">
            {settings ? settings.volume_safety_margin * 100 : 15}%
          </p>
        </div>
        <div>
          <span className="text-slate-500">Max Shift Time:</span>
          <p className="font-bold text-slate-200 mt-0.5">
            {settings ? settings.working_minutes_per_day : 480} mins
          </p>
        </div>
        <div>
          <span className="text-slate-500">Fuel Consumption:</span>
          <p className="font-bold text-slate-200 mt-0.5">
            {settings ? settings.fuel_l_per_km : 0.22} L / km
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-emerald-900/60 shadow-xl">
        <div>
          <h4 className="font-bold text-slate-100 text-base">
            Ready to Generate Route Plan?
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            The planner prioritises critical/urgent pickups, assigns points to the nearest active depot, and calculates 2-opt routes.
            <strong className="text-slate-300"> Note: Planning does not modify inventory.</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleGeneratePlan}
          isLoading={isSubmitting}
          icon={<PlaySquare className="w-5 h-5" />}
        >
          Generate Route Plan
        </Button>
      </div>
    </div>
  );
};
