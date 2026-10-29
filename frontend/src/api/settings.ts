import { apiClient } from './client';
import {
  SimulationSettings,
  SettingsPatchInput,
  SimulationClockResponse,
  AdvanceClockResponse,
} from '../types';

export const settingsApi = {
  get: () => {
    return apiClient<SimulationSettings>('/api/v1/settings');
  },

  update: (data: SettingsPatchInput) => {
    return apiClient<SimulationSettings>('/api/v1/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getClock: () => {
    return apiClient<SimulationClockResponse>('/api/v1/simulation/clock');
  },

  advanceClock: (days: number) => {
    return apiClient<AdvanceClockResponse>('/api/v1/simulation/clock/advance', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },
};
