import React, { useEffect, useState } from 'react';
import { settingsApi, dashboardApi } from '../api';
import {
  SimulationSettings,
  SettingsPatchInput,
  GeoapifyStatus,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Clock,
  ShieldCheck,
  Fuel,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  PlusCircle,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { simulationTime, refreshClock, addToast, advanceClockDays } = useApp();

  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoapifyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form edit state
  const [formData, setFormData] = useState<SettingsPatchInput>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Advance clock modal state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(1);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const loadSettingsAndDiagnostics = async () => {
    setIsLoading(true);
    try {
      const [settData, geoData] = await Promise.all([
        settingsApi.get(),
        dashboardApi.getGeoapifyStatus().catch(() => null),
      ]);
      setSettings(settData);
      setFormData(settData);
      setGeoStatus(geoData);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load simulation settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndDiagnostics();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Frontend validation ensuring due <= urgent <= critical
    const due = formData.due_threshold ?? settings?.due_threshold ?? 0.7;
    const urgent = formData.urgent_threshold ?? settings?.urgent_threshold ?? 0.8;
    const critical = formData.critical_threshold ?? settings?.critical_threshold ?? 1.0;

    if (!(due <= urgent && urgent <= critical)) {
      setSaveError('Threshold ordering violated: must satisfy Due ≤ Urgent ≤ Critical');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await settingsApi.update(formData);
      setSettings(updated);
      setFormData(updated);
      addToast('success', 'Simulation parameters updated successfully');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings to backend');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvanceConfirm = async () => {
    setIsAdvancing(true);
    const ok = await advanceClockDays(advanceDays);
    setIsAdvancing(false);
    if (ok) {
      setIsAdvanceModalOpen(false);
      refreshClock();
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading simulation parameters & diagnostics..." size="lg" className="min-h-[50vh]" />;
  }

  const clientMapKey = import.meta.env.VITE_GEOAPIFY_MAP_KEY;
  const isClientKeyConfigured = Boolean(
    clientMapKey && clientMapKey !== 'your_geoapify_map_key' && clientMapKey.trim().length > 5
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            <span>Simulation Settings & Clock</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative operational rules, capacity thresholds, working limits and virtual timeline controls.
          </p>
        </div>
      </div>

      {saveError && (
        <Alert variant="error" title="Settings Update Error">
          {saveError}
        </Alert>
      )}

      {/* Simulation Clock Card */}
      <Card className="border-emerald-900/60 shadow-lg">
        <CardHeader>
          <CardTitle>
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Virtual Simulation Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Current Virtual Clock Time
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5 font-mono">
                {simulationTime ? new Date(simulationTime).toLocaleString() : 'Loading...'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Waiting times for all residential and institutional collection points are calculated against this clock.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAdvanceModalOpen(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Advance Timeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Operational Thresholds Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Sliders className="w-5 h-5 text-sky-400" />
              <span>1. Utilisation Thresholds & Urgency Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <p className="text-slate-400">
              When a pickup point reaches these ratios of its safe storage capacity (weight OR volume), the backend automatically escalates its operational priority.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Due Threshold (ratio, e.g. 0.70 = 70%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={formData.due_threshold ?? 0.7}
                  onChange={(e) =>
                    setFormData({ ...formData, due_threshold: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-yellow-400 mt-1 block">Standard Due: 70%</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Urgent Threshold (ratio, e.g. 0.80 = 80%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={formData.urgent_threshold ?? 0.8}
                  onChange={(e) =>
                    setFormData({ ...formData, urgent_threshold: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-amber-400 mt-1 block">Standard Urgent: 80%</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Critical Threshold (ratio, e.g. 1.00 = 100%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="2.0"
                  value={formData.critical_threshold ?? 1.0}
                  onChange={(e) =>
                    setFormData({ ...formData, critical_threshold: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-rose-400 mt-1 block">Standard Critical: 100%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mandatory Waiting Days Trigger
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={formData.mandatory_wait_days ?? 7}
                  onChange={(e) =>
                    setFormData({ ...formData, mandatory_wait_days: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Reaching 7 waiting days escalates point to mandatory collection.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Opportunistic Detour Threshold (km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.opportunistic_detour_km ?? 3}
                  onChange={(e) =>
                    setFormData({ ...formData, opportunistic_detour_km: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Permitted extra road distance for opportunistic pickups.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Safety Margins & Working Limits */}
        <Card>
          <CardHeader>
            <CardTitle>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>2. Lorry Safety Margins & Shift Constraints</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Weight Safety Margin (e.g. 0.10 = 10%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={formData.weight_safety_margin ?? 0.1}
                  onChange={(e) =>
                    setFormData({ ...formData, weight_safety_margin: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  1,000 kg rated &rarr; 900 kg usable
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Volume Safety Margin (e.g. 0.15 = 15%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={formData.volume_safety_margin ?? 0.15}
                  onChange={(e) =>
                    setFormData({ ...formData, volume_safety_margin: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  5.0 m³ rated &rarr; 4.25 m³ usable
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Max Working Minutes / Day
                </label>
                <input
                  type="number"
                  min="60"
                  step="30"
                  value={formData.working_minutes_per_day ?? 480}
                  onChange={(e) =>
                    setFormData({ ...formData, working_minutes_per_day: parseInt(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Standard shift: 480 min (8 hours)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Cost & Emissions Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Fuel className="w-5 h-5 text-amber-400" />
              <span>3. Emissions & Fuel Assumptions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fuel Consumption (L / km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fuel_l_per_km ?? 0.22}
                  onChange={(e) =>
                    setFormData({ ...formData, fuel_l_per_km: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fuel Price per Litre (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.fuel_price_per_l ?? 100}
                  onChange={(e) =>
                    setFormData({ ...formData, fuel_price_per_l: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  CO₂ Factor (kg CO₂ / L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.co2_kg_per_l ?? 2.68}
                  onChange={(e) =>
                    setFormData({ ...formData, co2_kg_per_l: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            Save Parameter Updates
          </Button>
        </div>
      </form>

      {/* Integration Diagnostics Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Globe className="w-5 h-5 text-sky-400" />
            <span>Geoapify Integration Diagnostics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend Routing Status */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block">
                Backend Routing Status (GEOAPIFY_KEY)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    geoStatus?.configured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-slate-300">
                  {geoStatus?.routing_api || 'offline_safe_mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {geoStatus?.message ||
                  'The simulation routing engine operates offline using deterministic Haversine × 1.3 estimates and 2-opt.'}
              </p>
            </div>

            {/* Frontend Map Tiles Status */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block">
                Frontend Browser Map Tiles (VITE_GEOAPIFY_MAP_KEY)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isClientKeyConfigured ? 'bg-emerald-400' : 'bg-yellow-400'
                  }`}
                />
                <span className="font-medium text-slate-300">
                  {isClientKeyConfigured ? 'Geoapify Map Tiles Active' : 'OSM Fallback Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                To configure custom Geoapify tiles, set <code className="text-slate-200 font-mono">VITE_GEOAPIFY_MAP_KEY</code> in <code className="font-mono">frontend/.env</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advance Timeline Confirmation Modal */}
      <ConfirmationModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onConfirm={handleAdvanceConfirm}
        title="Advance Virtual Simulation Clock"
        message={`Advancing the virtual clock by ${advanceDays} day(s) will increment waiting times for all open e-waste collection requests. Pickups reaching 7 days will automatically become mandatory.`}
        confirmText={`Advance Clock by ${advanceDays}d`}
        variant="warning"
        isLoading={isAdvancing}
      />
    </div>
  );
};
