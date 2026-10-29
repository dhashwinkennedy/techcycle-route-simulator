import React, { useEffect, useState } from 'react';
import { vehiclesApi, facilitiesApi, settingsApi } from '../api';
import {
  Vehicle,
  Facility,
  VehicleCreateInput,
  VehiclePatchInput,
  SimulationSettings,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { useApp } from '../context/AppContext';
import {
  Truck,
  PlusCircle,
  Building2,
  Edit2,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Fuel,
  Clock,
  Info,
} from 'lucide-react';

interface VehicleWithFacility extends Vehicle {
  facilityName?: string;
}

export const VehiclesPage: React.FC = () => {
  const { addToast } = useApp();

  const [vehicles, setVehicles] = useState<VehicleWithFacility[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithFacility | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [formData, setFormData] = useState<VehicleCreateInput>({
    name: '',
    weight_capacity_kg: 1000,
    volume_capacity_m3: 5,
    fuel_type: 'diesel',
    status: 'available',
    max_working_minutes: 480,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleWithFacility | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [facList, setts] = await Promise.all([
        facilitiesApi.list().catch(() => []),
        settingsApi.get().catch(() => null),
      ]);
      setFacilities(facList);
      setSettings(setts);

      if (facList.length > 0) {
        setSelectedFacilityId(facList[0].id);
      }

      // Fetch vehicles for all facilities
      const allVehicles: VehicleWithFacility[] = [];
      await Promise.all(
        facList.map(async (fac) => {
          try {
            const vList = await vehiclesApi.listByFacility(fac.id);
            vList.forEach((v) => {
              allVehicles.push({ ...v, facilityName: fac.name });
            });
          } catch {
            // ignore
          }
        })
      );

      setVehicles(allVehicles);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load vehicle fleet data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    if (facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
    setFormData({
      name: '',
      weight_capacity_kg: 1000,
      volume_capacity_m3: 5,
      fuel_type: 'diesel',
      status: 'available',
      max_working_minutes: 480,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleWithFacility) => {
    setEditingVehicle(v);
    setSelectedFacilityId(v.facility_id);
    setFormData({
      name: v.name,
      weight_capacity_kg: v.rated_weight_capacity_kg,
      volume_capacity_m3: v.rated_cargo_volume_m3,
      fuel_type: v.fuel_type,
      status: v.status,
      max_working_minutes: v.max_working_minutes || 480,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Lorry identifier or license plate is required');
      return;
    }
    if (formData.weight_capacity_kg <= 0 || formData.volume_capacity_m3 <= 0) {
      setFormError('Weight and volume capacities must be positive numbers');
      return;
    }
    if (!editingVehicle && !selectedFacilityId) {
      setFormError('Please select a home recycling facility');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, {
          name: formData.name,
          weight_capacity_kg: formData.weight_capacity_kg,
          volume_capacity_m3: formData.volume_capacity_m3,
          fuel_type: formData.fuel_type,
          status: formData.status,
          max_working_minutes: formData.max_working_minutes,
        });
        addToast('success', `Lorry "${formData.name}" updated successfully`);
      } else {
        await vehiclesApi.create(selectedFacilityId, formData);
        addToast('success', `Lorry "${formData.name}" registered to home facility`);
      }
      setIsFormModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await vehiclesApi.delete(vehicleToDelete.id);
      addToast('success', `Lorry "${vehicleToDelete.name}" removed from fleet`);
      setVehicleToDelete(null);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove lorry');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.facilityName && v.facilityName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFacility = facilityFilter === 'all' || v.facility_id === facilityFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesFacility && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span>Lorry Fleet Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered collection lorries. Every lorry is permanently based at its registered home recycling facility.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          disabled={facilities.length === 0}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Register Lorry
        </Button>
      </div>

      {facilities.length === 0 && !isLoading && (
        <Alert variant="warning" title="No Facilities Available">
          You must register at least one recycling facility before you can register lorries.
        </Alert>
      )}

      {/* Demo Fleet Configuration Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <p className="font-semibold text-slate-200">
            Standard Demo Fleet Benchmark Rules
          </p>
          <p className="text-slate-400 leading-relaxed">
            Seeded demonstration runs feature 3 diesel lorries based at the Chennai E-Waste Hub with 1,000 kg rated capacity and 5 m³ cargo volume.
            Applying standard safety margins ({settings ? settings.weight_safety_margin * 100 : 10}% weight, {settings ? settings.volume_safety_margin * 100 : 15}% volume) provides usable planning capacity of <strong className="text-slate-200">900 kg</strong> and <strong className="text-slate-200">4.25 m³</strong>.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search lorry name / plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
            {/* Facility Filter */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Home Facility:</span>
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Facilities</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Cards Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading lorry fleet & capacities..." size="lg" />
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <Truck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No lorries found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || facilityFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search filters.'
              : 'Register your first lorry to begin dispatch planning.'}
          </p>
          {facilities.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              Register Lorry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>{vehicle.name}</span>
                      </CardTitle>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {vehicle.id.slice(0, 8)}...
                      </span>
                    </div>
                    <Badge status={vehicle.status} size="sm" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Home Facility */}
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Home Hub:</span>
                    </span>
                    <span className="font-semibold text-slate-200">
                      {vehicle.facilityName || 'Assigned Depot'}
                    </span>
                  </div>

                  {/* Capacities */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-500">Rated Capacity</span>
                      <p className="font-semibold text-slate-300 mt-0.5">
                        {vehicle.rated_weight_capacity_kg} kg | {vehicle.rated_cargo_volume_m3} m³
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Usable (Safe)</span>
                      </span>
                      <p className="font-bold text-emerald-300 mt-0.5">
                        {vehicle.usable_weight_capacity_kg} kg | {vehicle.usable_volume_capacity_m3} m³
                      </p>
                    </div>
                  </div>

                  {/* Operational parameters */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-slate-500" />
                      <span className="capitalize">{vehicle.fuel_type}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Max {vehicle.max_working_minutes || 480}m / shift</span>
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(vehicle)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edit lorry"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVehicleToDelete(vehicle)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Remove lorry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lorry Create/Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingVehicle ? 'Edit Lorry Configuration' : 'Register New Collection Lorry'}
        description="Vehicles are registered under a home recycling facility and execute collection trips starting and returning to that facility."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Input Error">
              {formError}
            </Alert>
          )}

          {!editingVehicle && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Home Recycling Facility *
              </label>
              <select
                required
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.address || 'Chennai'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vehicle Identifier / Registration Plate *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TN-01-DEMO-4"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rated Weight (kg) *
              </label>
              <input
                type="number"
                min="1"
                step="10"
                required
                value={formData.weight_capacity_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_capacity_kg: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Usable: ~{Math.round(formData.weight_capacity_kg * 0.9)} kg
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rated Cargo Volume (m³) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={formData.volume_capacity_m3}
                onChange={(e) =>
                  setFormData({ ...formData, volume_capacity_m3: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Usable: ~{(formData.volume_capacity_m3 * 0.85).toFixed(2)} m³
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fuel Type
              </label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="cng">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Availability Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Working Minutes per Shift (Minutes)
            </label>
            <input
              type="number"
              min="60"
              step="30"
              value={formData.max_working_minutes || 480}
              onChange={(e) =>
                setFormData({ ...formData, max_working_minutes: parseInt(e.target.value) || 480 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingVehicle ? 'Update Lorry' : 'Register Lorry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(vehicleToDelete)}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Lorry from Fleet"
        message={`Are you sure you want to remove lorry "${vehicleToDelete?.name}"? It will no longer be available for dispatch planning.`}
        confirmText="Remove Lorry"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
