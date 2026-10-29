# TechCycle Frontend — Operations Console

Modern React and TypeScript operations console for the **E-Waste Collection and Transportation Route Optimisation Simulator (TechCycle)**, developed by team **AXIOMX** for Problem Statement **P04 (Track 1: Collection and Logistics)**.

The frontend communicates with the FastAPI backend (`http://localhost:8000`) to manage recycling hubs, track pickup points and waste accumulation, configure vehicle fleets with rated versus usable capacities, trigger 2-opt route optimizations, and visualize route plans on an interactive Leaflet map.

---

## Features

- **Live System Overview (`/`):** Real-time KPI summaries for active recycling facilities, registered lorries, collection points, due/urgent/critical backlogs, pending waste weight (kg) and volume ($\text{m}^3$), last plan distance, operating costs, and estimated $\text{CO}_2$ emissions.
- **Interactive Operations Map (`/map`):** Interactive GIS map powered by Leaflet and Geoapify raster tiles (with automatic OpenStreetMap fallback) displaying facility depots, pickup pins with urgency badges, and route geometry.
- **Recycling Facility Management (`/facilities`):** Register, inspect, edit, and delete recycling facilities with geographical coordinates and assigned fleets.
- **Pickup Point Management (`/pickup-points`):** Table of collection points across residential, commercial, educational, and medical facilities with capacity limits, real-time demand, and urgency levels.
- **Node Inspection & Load Deposit (`/pickup-points/:id`):** Deep inspection of individual collection nodes, historical load audit logs, and an interactive "Add E-Waste" deposit form.
- **Fleet & Lorry Capacity Administration (`/vehicles`):** Register and configure lorries under their home facilities, tracking rated capacities versus usable capacities with configurable safety margins (10% weight, 15% volume).
- **Route Optimization Planner (`/simulations/new`):** Multi-facility selection, objective picker (minimize cost / minimize distance), and constraint controls to generate capacity-safe 2-opt route plans.
- **Simulation History & Results (`/simulations` and `/simulations/:id`):** Review previous plans, inspect trip-by-trip stop sequences and depot returns, execute simulations atomically to update inventory, and compare basic sequential routes against 2-opt optimized plans.
- **Settings & Virtual Timeline (`/settings`):** Read and update operational threshold rules and advance the virtual simulation clock by $N$ days to evaluate wait times and backlog accumulation.

---

## Technology Stack

- **Framework:** React 18 & TypeScript (v5.6+)
- **Build Tool:** Vite (v5.4+)
- **Routing:** React Router DOM (v6.28+)
- **Mapping & GIS:** Leaflet (v1.9+) & React-Leaflet (v4.2+)
- **Map Tiles:** Geoapify Raster Tiles API (with automatic OpenStreetMap fallback)
- **Icons:** Lucide React (v0.468+)

---

## Configuration & Environment Variables

Copy the provided `.env.example` template to `.env`:

```powershell
Copy-Item .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the running FastAPI backend server. | `http://localhost:8000` |
| `VITE_GEOAPIFY_MAP_KEY` | Browser-safe Geoapify client key for Leaflet map tiles. *Optional; if omitted, map automatically renders OpenStreetMap tiles.* | *(Leave blank or enter browser key)* |

> [!WARNING]
> **Client-Side Security:** Environment variables starting with `VITE_` are bundled into client-side JavaScript by Vite and are visible in browser DevTools. **Never store server-only credentials, private tokens, or database passwords in this file.**

---

## Installation & Running

### 1. Install Dependencies
```powershell
cd frontend
npm install
```

### 2. Start the Development Server
```powershell
npm run dev
```

The application will launch on [`http://localhost:5173`](http://localhost:5173).

### 3. Build for Production
```powershell
npm run build
```

This executes TypeScript compilation (`tsc -b`) followed by Vite production bundling into `dist/`.

---

## Connecting with the Backend

Ensure the FastAPI backend is running simultaneously in another terminal:

```powershell
cd ..\backend
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend interactive API documentation will be available at [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs).
