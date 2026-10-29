import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pickupPointsApi } from '../api';
import {
  PickupPoint,
  LoadUpdateInput,
  LoadHistoryItem,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  ArrowLeft,
  Scale,
  Box,
  Clock,
  AlertTriangle,
  PlusCircle,
  History,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const PickupPointDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [point, setPoint] = useState<PickupPoint | null>(null);
  const [history, setHistory] = useState<LoadHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add load form state
  const [addedWeight, setAddedWeight] = useState<number>(0);
  const [addedVolume, setAddedVolume] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isSubmittingLoad, setIsSubmittingLoad] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pointData, historyData] = await Promise.all([
        pickupPointsApi.get(id),
        pickupPointsApi.getLoadHistory(id).catch(() => []),
      ]);
      setPoint(pointData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load pickup point details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoadError(null);
    setLoadWarnings([]);

    if (addedWeight <= 0 && addedVolume <= 0) {
      setLoadError('Please enter at least one positive weight or volume quantity');
      return;
    }

    setIsSubmittingLoad(true);
    try {
      const res = await pickupPointsApi.addLoadUpdate(id, {
        added_weight_kg: addedWeight,
        added_volume_m3: addedVolume,
        description: description.trim() || undefined,
      });

      addToast('success', `Added ${addedWeight} kg / ${addedVolume} m³ of e-waste demand`);
      setPoint(res);
      if (res.warnings && res.warnings.length > 0) {
        setLoadWarnings(res.warnings);
      }
      setAddedWeight(0);
      setAddedVolume(0);
      setDescription('');

      // Refresh history
      const hist = await pickupPointsApi.getLoadHistory(id).catch(() => []);
      setHistory(hist);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to add e-waste load');
    } finally {
      setIsSubmittingLoad(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading pickup point demand details..." size="lg" className="min-h-[50vh]" />;
  }

  if (error || !point) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/pickup-points')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Pickup Points
        </Button>
        <Alert variant="error" title="Not Found or Communication Failure">
          {error || 'Requested pickup point could not be found.'}
        </Alert>
      </div>
    );
  }

  const isExceeded = point.weight_utilisation_percent >= 100 || point.volume_utilisation_percent >= 100;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/pickup-points')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{point.name}</h1>
              <Badge status={point.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Category: <span className="text-slate-200">{point.category}</span> | ID:{' '}
              <code className="text-slate-300 font-mono">{point.id}</code>
            </p>
          </div>
        </div>

        <Link to="/map">
          <Button variant="outline" size="sm" icon={<MapPin className="w-4 h-4 text-emerald-400" />}>
            View on Live Map
          </Button>
        </Link>
      </div>

      {/* Critical Over-capacity Warning Banner */}
      {isExceeded && (
        <Alert variant="warning" title="Safe Capacity Exceeded!">
          This pickup point has reached or exceeded 100% of its safe storage capacity. It has been escalated to{' '}
          <strong className="text-rose-300 font-bold">CRITICAL</strong> priority and must be included in the next vehicle dispatch route.
        </Alert>
      )}

      {loadWarnings.length > 0 && (
        <Alert variant="warning" title="Capacity Alert">
          {loadWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </Alert>
      )}

      {/* Main Grid: Storage Status / Progress Bars & Add Load Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Storage Capacities & Status Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Capacity Progress Bars Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Scale className="w-5 h-5 text-emerald-400" />
                <span>Authoritative Storage Capacity & Demand</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-5 sm:p-6">
              {/* Weight Capacity Bar */}
              <ProgressBar
                label="Safe Storage Weight"
                value={point.current_pending_weight_kg}
                max={point.maximum_safe_weight_kg}
                unit="kg"
              />

              {/* Volume Capacity Bar */}
              <ProgressBar
                label="Safe Cargo Volume"
                value={point.current_pending_volume_m3}
                max={point.maximum_safe_volume_m3}
                unit="m³"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Waiting Time</span>
                  </span>
                  <p className="text-base font-bold text-slate-100 mt-1">
                    {point.waiting_days.toFixed(1)} days
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {point.waiting_days >= 7 ? 'Mandatory trigger met' : '7.0d mandatory limit'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Loading Duration</span>
                  <p className="text-base font-bold text-slate-100 mt-1">
                    {point.service_minutes} minutes
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Added to lorry work shift
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-400">Active Reasons</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {point.reasons && point.reasons.length > 0 ? (
                      point.reasons.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None (normal)</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Location & Access Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-slate-500 w-28 shrink-0">Street Address:</span>
                <span className="font-medium text-slate-200">
                  {point.address || 'No specific street address provided'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-500 w-28 shrink-0">Coordinates:</span>
                <span className="font-mono text-emerald-300">
                  Latitude: {point.latitude}, Longitude: {point.longitude}
                </span>
              </div>
              {point.notes && (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-500 w-28 shrink-0">Special Notes:</span>
                  <span className="text-slate-300">{point.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: "Add E-Waste" Form & Load History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Load Form */}
          <Card className="border-emerald-900/60 shadow-lg">
            <CardHeader>
              <CardTitle>
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Add E-Waste Load</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleAddLoad} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the newly deposited electronics. This will <strong className="text-slate-200">add to the current pending demand</strong> in the backend and update utilisation and severity.
                </p>

                {loadError && (
                  <Alert variant="error" title="Input Error">
                    {loadError}
                  </Alert>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Added Weight (kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={addedWeight || ''}
                    onChange={(e) => setAddedWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Added Cargo Volume (m³) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 0.5"
                    value={addedVolume || ''}
                    onChange={(e) => setAddedVolume(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description / Item Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 old desktop monitors and cables"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmittingLoad}
                  icon={<PlusCircle className="w-4 h-4" />}
                >
                  Record E-Waste Deposit
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Load History Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <History className="w-5 h-5 text-sky-400" />
                <span>Deposit History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-72 overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No individual deposit transactions recorded yet.
                </div>
              ) : (
                history.slice().reverse().map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>
                        +{item.added_weight_kg} kg | +{item.added_volume_m3} m³
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 italic">
                        {item.description}
                      </p>
                    )}
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
