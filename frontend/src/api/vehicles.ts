import { apiClient } from './client';
import { Vehicle, VehicleCreateInput, VehiclePatchInput } from '../types';
import { facilitiesApi } from './facilities';

export const vehiclesApi = {
  listByFacility: (facilityId: string) => {
    return apiClient<Vehicle[]>(`/api/v1/facilities/${facilityId}/vehicles`);
  },

  listAll: async () => {
    const facilities = await facilitiesApi.list();
    const vehiclePromises = facilities.map(async (fac) => {
      try {
        const vehicles = await vehiclesApi.listByFacility(fac.id);
        return vehicles.map((v) => ({ ...v, facilityName: fac.name }));
      } catch (e) {
        return [];
      }
    });
    const results = await Promise.all(vehiclePromises);
    return results.flat();
  },

  get: (id: string) => {
    return apiClient<Vehicle>(`/api/v1/vehicles/${id}`);
  },

  create: (facilityId: string, data: VehicleCreateInput) => {
    return apiClient<Vehicle>(`/api/v1/facilities/${facilityId}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: VehiclePatchInput) => {
    return apiClient<Vehicle>(`/api/v1/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: string) => {
    return apiClient<void>(`/api/v1/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};
