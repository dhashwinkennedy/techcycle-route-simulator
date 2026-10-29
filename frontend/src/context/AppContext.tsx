import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi, dashboardApi } from '../api';
import { SimulationSettings } from '../types';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  backendOnline: boolean | null;
  simulationTime: string | null;
  settings: SimulationSettings | null;
  isLoading: boolean;
  toasts: Toast[];
  refreshClock: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  advanceClockDays: (days: number) => Promise<boolean>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
  checkHealth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [simulationTime, setSimulationTime] = useState<string | null>(null);
  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      await dashboardApi.getHealth();
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
    }
  }, []);

  const refreshClock = useCallback(async () => {
    try {
      const data = await settingsApi.getClock();
      setSimulationTime(data.simulation_time);
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const advanceClockDays = useCallback(async (days: number): Promise<boolean> => {
    try {
      const res = await settingsApi.advanceClock(days);
      setSimulationTime(res.simulation_time);
      addToast('success', `Simulation clock advanced by ${days} day${days > 1 ? 's' : ''}`);
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to advance clock');
      return false;
    }
  }, [addToast]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkHealth();
      await refreshClock();
      await refreshSettings();
      setIsLoading(false);
    };

    init();

    // Periodic health / clock polling every 30s
    const timer = setInterval(() => {
      checkHealth();
      refreshClock();
    }, 30000);

    return () => clearInterval(timer);
  }, [checkHealth, refreshClock, refreshSettings]);

  return (
    <AppContext.Provider
      value={{
        backendOnline,
        simulationTime,
        settings,
        isLoading,
        toasts,
        refreshClock,
        refreshSettings,
        advanceClockDays,
        addToast,
        removeToast,
        checkHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
