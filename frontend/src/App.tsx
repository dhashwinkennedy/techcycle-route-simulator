import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { PickupPointsPage } from './pages/PickupPointsPage';
import { PickupPointDetailPage } from './pages/PickupPointDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { SimulationPlannerPage } from './pages/SimulationPlannerPage';
import { SimulationDetailPage } from './pages/SimulationDetailPage';
import { SimulationsListPage } from './pages/SimulationsListPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="facilities" element={<FacilitiesPage />} />
            <Route path="pickup-points" element={<PickupPointsPage />} />
            <Route path="pickup-points/:id" element={<PickupPointDetailPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="simulations" element={<SimulationsListPage />} />
            <Route path="simulations/new" element={<SimulationPlannerPage />} />
            <Route path="simulations/:runId" element={<SimulationDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
