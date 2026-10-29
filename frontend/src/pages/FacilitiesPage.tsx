import React, { useEffect, useState } from 'react';
import { facilitiesApi, vehiclesApi } from '../api';
import { Facility, FacilityCreateInput, FacilityPatchInput, Vehicle } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { LocationPickerModal } from '../components/map/LocationPickerModal';
import { useApp } from '../context/AppContext';
import {
  Building2,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Truck,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacilitiesPage: React.FC = () => {
  const { addToast } = useApp();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [vehiclesByFacility, setVehiclesByFacility] = useState<Record<string, Vehicle[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState<FacilityCreateInput>({
    name: '',
    address: '',
    latitude: 13.0827,
    longitude: 80.2707,
    active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Picker Modal State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Delete Confirmation State
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch facilities & vehicles
  const loadFacilities = async () => {
    setIsLoading(true);
    try {
      const data = await facilitiesApi.list();
      setFacilities(data);

      // Fetch vehicles for each facility to display fleet size
      const vehMap: Record<string, Vehicle[]> = {};
      await Promise.all(
        data.map(async (fac) => {
          try {
            const vList = await vehiclesApi.listByFacility(fac.id);
            vehMap[fac.id] = vList;
          } catch {
            vehMap[fac.id] = [];
          }
        })
      );
      setVehiclesByFacility(vehMap);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load facilities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleOpenCreate = () => {
    setEditingFacility(null);
    setFormData({
      name: '',
      address: '',
      latitude: 13.0827,
      longitude: 80.2707,
      active: true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setFormData({
      name: fac.name,
      address: fac.address || '',
      latitude: fac.latitude,
      longitude: fac.longitude,
      active: fac.active,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Facility name is required');
      return;
    }
    if (formData.latitude < -90 || formData.latitude > 90) {
      setFormError('Latitude must be between -90 and 90');
      return;
    }
    if (formData.longitude < -180 || formData.longitude > 180) {
      setFormError('Longitude must be between -180 and 180');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingFacility) {
        await facilitiesApi.update(editingFacility.id, formData);
        addToast('success', `Facility "${formData.name}" updated successfully`);
      } else {
        await facilitiesApi.create(formData);
        addToast('success', `Facility "${formData.name}" registered successfully`);
      }
      setIsFormModalOpen(false);
      loadFacilities();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!facilityToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await facilitiesApi.delete(facilityToDelete.id);
      addToast('success', `Facility "${facilityToDelete.name}" deleted successfully`);
      setFacilityToDelete(null);
      loadFacilities();
    } catch (err: any) {
      setDeleteError(err.message || 'Cannot delete facility. It may have registered vehicles.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.address && f.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? f.active : !f.active;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>Recycling Facilities</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centres of collection operations. Lorries belong to their home facility and return to it after each trip.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Register Facility
        </Button>
      </div>

      {deleteError && (
        <Alert variant="error" title="Facility Deletion Constraint">
          {deleteError}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search facilities by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Filter:</span>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['all', 'active', 'inactive'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                    statusFilter === filter
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facilities Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading facilities and assigned fleet..." size="lg" />
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No facilities found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm
              ? 'No facilities match your search query.'
              : 'Register your first recycling hub to begin route planning.'}
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            Register Facility
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFacilities.map((fac) => {
            const assignedVehicles = vehiclesByFacility[fac.id] || [];

            return (
              <Card key={fac.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-start justify-between w-full">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-100">
                          {fac.name}
                        </CardTitle>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {fac.id.slice(0, 8)}...
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          fac.active
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {fac.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{fac.address || 'No street address specified'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono pl-6">
                        Coordinates: {fac.latitude.toFixed(5)}, {fac.longitude.toFixed(5)}
                      </div>
                    </div>

                    {/* Fleet Summary */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-sky-400" />
                          <span>Home Fleet</span>
                        </span>
                        <span className="font-bold text-sky-300">
                          {assignedVehicles.length} Lorries
                        </span>
                      </div>

                      {assignedVehicles.length > 0 ? (
                        <div className="space-y-1">
                          {assignedVehicles.slice(0, 3).map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded"
                            >
                              <span className="font-mono text-slate-200">{v.name}</span>
                              <span>
                                {v.usable_weight_capacity_kg} kg | {v.usable_volume_capacity_m3} m³
                              </span>
                            </div>
                          ))}
                          {assignedVehicles.length > 3 && (
                            <p className="text-[10px] text-slate-500 text-right pt-0.5">
                              +{assignedVehicles.length - 3} more vehicles
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          No vehicles registered under this facility.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between">
                  <Link
                    to="/vehicles"
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <span>Manage Fleet</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit facility"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setFacilityToDelete(fac);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete facility"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Facility Create/Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingFacility ? 'Edit Recycling Facility' : 'Register New Recycling Facility'}
        description="Recycling hubs act as depots for collection lorries and process delivered e-waste."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Validation Error">
              {formError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              required
              maxLength={160}
              placeholder="e.g. Chennai Central E-Waste Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Address / Location Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Industrial Estate, Guindy, Chennai"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Coordinates with Map Picker Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Geographic Coordinates *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMapPickerOpen(true)}
                icon={<MapPin className="w-3.5 h-3.5 text-emerald-400" />}
              >
                Pick on Map
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400">Latitude</span>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Longitude</span>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeFacility"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="activeFacility" className="text-xs font-medium text-slate-300">
              Active Facility (eligible for vehicle dispatch and route planning)
            </label>
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
              {editingFacility ? 'Update Facility' : 'Register Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Map Picker Modal */}
      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
        onSelectLocation={(lat, lng) => {
          setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="Select Facility Location"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(facilityToDelete)}
        onClose={() => {
          setFacilityToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Recycling Facility"
        message={`Are you sure you want to delete "${facilityToDelete?.name}"? Note that if any vehicles are registered to this facility, the backend will prevent deletion.`}
        confirmText="Delete Facility"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
