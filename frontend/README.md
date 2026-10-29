# TechCycle — E-Waste Route Optimisation Simulator (Frontend)

Modern, responsive fleet-management and route-optimisation dashboard built with React 18, TypeScript, Vite, Tailwind CSS, Leaflet, and Geoapify.

This frontend interfaces directly with the deterministic FastAPI e-waste collection simulation backend to register recycling facilities, collection nodes, manage lorry fleets, project 2-opt routes, and monitor operating metrics.

---

## Features

- **Operations Dashboard (`/`)**: Real-time KPI summaries for recycling hubs, available lorries, collection point statuses (Normal, Due, Urgent, Critical), total pending demand, and latest simulation metrics.
- **Interactive Operations Map (`/map`)**: Large Leaflet map featuring Geoapify map tiles (with graceful OSM fallback), custom depot/pickup pins, ordered stop numbers, and backend GeoJSON LineString route polylines.
- **Recycling Facility Management (`/facilities`)**: Full CRUD for recycling hubs with interactive map location pickers and assigned fleet summaries.
- **Pickup Point Management (`/pickup-points`)**: Comprehensive table of collection nodes with utilisation progress bars, wait times, and status filters.
- **Demand Deposit & Utilisation (`/pickup-points/:id`)**: Detailed node inspection and "Add E-Waste" load update form that updates authoritative backend demand and triggers critical status warnings.
- **Lorry Fleet Management (`/vehicles`)**: Fleet administration with rated vs. usable safety margin planning capacities (e.g. 10% weight, 15% volume margins) under home facilities.
- **Route Optimisation Planner (`/simulations/new`)**: Interactive simulation configuration screen to generate capacity-safe 2-opt collection trips.
- **Simulation Execution & Comparison (`/simulations/:runId`)**: Stop-by-stop route breakdown, depot return verification, atomic collection execution, deferred pickup auditing, and side-by-side baseline vs. optimised metric comparisons.
- **Simulation Audit History (`/simulations`)**: Historical log of all generated plans and execution states.
- **Settings & Virtual Timeline (`/settings`)**: Parameter configuration (due/urgent/critical thresholds, safety margins, shift limits) and virtual clock advance controls.

---

## Technology Stack

- **Framework**: React 18 & TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Maps & GIS**: Leaflet & React-Leaflet
- **Map Tiles**: Geoapify (with graceful OpenStreetMap fallback)
- **Styling**: Tailwind CSS (Dark Slate & Emerald palette)
- **Icons**: Lucide React

---

## Configuration & Environment Variables

Create a `.env` file inside the `frontend/` directory (see `.env.example`):

```bash
# FastAPI backend URL
VITE_API_BASE_URL=http://localhost:8000

# Browser-safe Geoapify key for Leaflet map tiles
VITE_GEOAPIFY_MAP_KEY=your_geoapify_map_key
```

> **Security Note:** The backend server-side key `GEOAPIFY_KEY` is never exposed or read by client-side code. The browser-safe `VITE_GEOAPIFY_MAP_KEY` is used strictly for map-tile rendering. If omitted or left as a placeholder, the frontend automatically falls back to OpenStreetMap tiles without crashing.

---

## Installation & Running

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Start Development Server

```powershell
npm run dev
```

The application will start on `http://localhost:5173`.

### 3. Build for Production

```powershell
npm run build
```

This runs TypeScript type checking (`tsc`) followed by Vite production bundling.

---

## Backend Startup Instructions

In a separate terminal, start the FastAPI backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python seed_demo.py          # Seeds demonstration Chennai fleet and pickup points
uvicorn app.main:app --reload
```

The FastAPI OpenAPI docs will be accessible at `http://localhost:8000/docs`.
