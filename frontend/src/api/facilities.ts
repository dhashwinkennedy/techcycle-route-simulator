import { apiClient } from './client';
import { Facility, FacilityCreateInput, FacilityPatchInput } from '../types';

export const facilitiesApi = {
  list: (active?: boolean) => {
    const query = active !== undefined ? `?active=${active}` : '';
    return apiClient<Facility[]>(`/api/v1/facilities${query}`);
  },

  get: (id: string) => {
    return apiClient<Facility>(`/api/v1/facilities/${id}`);
  },

  create: (data: FacilityCreateInput) => {
    return apiClient<Facility>('/api/v1/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: FacilityPatchInput) => {
    return apiClient<Facility>(`/api/v1/facilities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: string) => {
    return apiClient<void>(`/api/v1/facilities/${id}`, {
      method: 'DELETE',
    });
  },
};
