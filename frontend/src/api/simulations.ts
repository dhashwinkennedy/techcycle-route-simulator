import { apiClient } from './client';
import {
  PlanInput,
  SimulationRun,
  SimulationListItem,
  SimulationRoute,
  SimulationMetricsBundle,
} from '../types';

export const simulationsApi = {
  plan: (data: PlanInput) => {
    return apiClient<SimulationRun>('/api/v1/simulations/plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: () => {
    return apiClient<SimulationListItem[]>('/api/v1/simulations');
  },

  get: (runId: string) => {
    return apiClient<SimulationRun>(`/api/v1/simulations/${runId}`);
  },

  getRoutes: (runId: string) => {
    return apiClient<SimulationRoute[]>(`/api/v1/simulations/${runId}/routes`);
  },

  getMetrics: (runId: string) => {
    return apiClient<SimulationMetricsBundle>(`/api/v1/simulations/${runId}/metrics`);
  },

  execute: (runId: string) => {
    return apiClient<{ run_id: string; status: string; message: string }>(
      `/api/v1/simulations/${runId}/execute`,
      {
        method: 'POST',
      }
    );
  },

  advance: (runId: string) => {
    return apiClient<{ run_id: string; status: string; message: string }>(
      `/api/v1/simulations/${runId}/advance`,
      {
        method: 'POST',
      }
    );
  },
};
