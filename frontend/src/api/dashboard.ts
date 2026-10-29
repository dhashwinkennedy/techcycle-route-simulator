import { apiClient } from './client';
import { DashboardSummary, GeoapifyStatus } from '../types';

export const dashboardApi = {
  getSummary: () => {
    return apiClient<DashboardSummary>('/api/v1/dashboard/summary');
  },

  getHealth: () => {
    return apiClient<{ status: string; service: string }>('/health');
  },

  getGeoapifyStatus: () => {
    return apiClient<GeoapifyStatus>('/api/v1/integrations/geoapify/status');
  },
};
