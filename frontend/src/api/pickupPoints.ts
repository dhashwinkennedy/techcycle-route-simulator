import { apiClient } from './client';
import {
  PickupPoint,
  PickupCreateInput,
  PickupPatchInput,
  LoadUpdateInput,
  LoadUpdateResponse,
  LoadHistoryItem,
} from '../types';

export interface PickupFilterParams {
  category?: string;
  status?: string;
  active?: boolean;
}

export const pickupPointsApi = {
  list: (params?: PickupFilterParams) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.active !== undefined) searchParams.append('active', String(params.active));
    
    const query = searchParams.toString();
    return apiClient<PickupPoint[]>(`/api/v1/pickup-points${query ? `?${query}` : ''}`);
  },

  get: (id: string) => {
    return apiClient<PickupPoint>(`/api/v1/pickup-points/${id}`);
  },

  create: (data: PickupCreateInput) => {
    return apiClient<PickupPoint>('/api/v1/pickup-points', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: PickupPatchInput) => {
    return apiClient<PickupPoint>(`/api/v1/pickup-points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: string) => {
    return apiClient<void>(`/api/v1/pickup-points/${id}`, {
      method: 'DELETE',
    });
  },

  addLoadUpdate: (id: string, data: LoadUpdateInput) => {
    return apiClient<LoadUpdateResponse>(`/api/v1/pickup-points/${id}/load-updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLoadHistory: (id: string) => {
    return apiClient<LoadHistoryItem[]>(`/api/v1/pickup-points/${id}/load-history`);
  },
};
