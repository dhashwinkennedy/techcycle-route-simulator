# E-Waste Collection and Transportation Route Optimisation Simulator

**Team Name:** AXIOMX  
**Problem Statement:** P04 — E-Waste Transportation, Track 1: Collection and Logistics  
**Project Name:** E-Waste Collection and Transportation Route Optimisation Simulator (TechCycle)  

---

## Problem Statement & Challenge Context

- **Track:** Track 1: Collection and Logistics
- **Problem Code:** P04
- **Problem Title:** E-Waste Transportation

### Background
E-waste is collected from households, institutions, and businesses and moved to collection and recycling facilities. Poorly planned routes increase distance, cost, energy use, and environmental impact.

### Challenge
> *How might we design a simulation-based system that determines efficient collection and transportation routes for e-waste while considering vehicle capacity, distance, time, and environmental impact?*

### Demo Requirements & Platform Alignment
The hackathon brief specifies three demonstration requirements and one primary impact measure:

| Requirement / Deliverable | How TechCycle Solves & Demonstrates It |
| :--- | :--- |
| **1. Pickup points, vehicle capacity and a route plan** | Full CRUD for diverse pickup nodes (residential, colleges, hospitals, IT shops) with maximum weight (kg) and volume ($\text{m}^3$) capacities; home-fleet vehicle management with rated capacities and configurable safety margins (10% weight, 15% volume); capacity-constrained route construction ensuring all vehicles return to their home facility depot. |
| **2. Comparison of a basic route versus your optimised route** | Comparative simulation analytics dashboard evaluating basic sequential route planning against 2-opt optimized route tours. |
| **3. Distance, time and emission estimate** | Algorithmic calculation of total route distance (km), driving and service duration (min), estimated fuel cost (INR), and carbon emissions ($\text{kg CO}_2$) based on vehicle powertrain and fuel efficiency metrics. |
| **Impact Measure** | **Percentage reduction** in total route distance, operational fuel cost, and $\text{CO}_2$ emissions achieved by the optimized routes compared to the baseline route. |

---

## Overview

The **E-Waste Collection and Transportation Route Optimisation Simulator** is an end-to-end decision support platform designed to simulate, plan, optimize, and execute electronic waste (e-waste) collection logistics across metropolitan areas. The platform models real-world recycling hubs, home-facility vehicle fleets, and diverse pickup nodes (residential communities, IT shops, educational institutions, hospitals, and commercial hubs). 

It features an interactive GIS operations console built in React, TypeScript, and Leaflet, coupled with a high-performance deterministic FastAPI backend backed by SQLite. The system automates node urgency classification, facility-depot assignment, capacity-constrained trip binning, and 2-opt tour refinement, delivering transparent operational metrics for route distance, driving time, fuel costs, and carbon emissions.

---

## Team Members — AXIOMX

1. **R. Dhashwin Kennedy**
2. **Tharun D.**
3. **Mariam Fathima Imran**
4. **Fahima S.**

---

## Features

### Implemented Features
- **Multi-Facility Logistics Management:** Register and inspect multiple recycling facilities with distinct geographical coordinates (tested in Chennai) and manage home-facility fleet ownership where all vehicle trips strictly originate and terminate at their designated home depot.
- **Dynamic Pickup Point Urgency & Demand Tracking:** Full CRUD for collection points with categorical capacities (weight in kg and volume in m³). Categorizes node urgency automatically into:
  - *Normal:* $< 70\%$ capacity utilization
  - *Due:* $\ge 70\%$ capacity utilization
  - *Urgent:* $\ge 80\%$ capacity utilization
  - *Critical:* $\ge 100\%$ capacity utilization
  - *Mandatory Wait Rule:* Points waiting $\ge 7$ days are prioritized for collection; $\ge 80\%$ of wait duration triggers urgent classification.
- **Demand Deposit & Historical Auditing:** Endpoint and UI form to record incoming e-waste loads incrementally (`POST /api/v1/pickup-points/{id}/load-updates`) with immutable load event histories.
- **Vehicle Fleet & Usable Capacity Safety Margins:** Fleet management supporting rated capacity versus usable capacity with configurable safety margins (default: $10\%$ weight safety margin and $15\%$ volume safety margin).
- **Deterministic Facility Assignment:** Algorithmic assignment of eligible collection nodes to facilities based on minimum road travel cost and facility fleet availability.
- **Capacity-Constrained Route Generation:** Bins eligible pickups into valid vehicle tours respecting gross vehicle weight/volume boundaries, shift duration limits (default 480 minutes), and depot returns.
- **2-Opt Route Improvement:** Local search heuristic (2-opt) applied to stop sequences within each vehicle trip to eliminate route crossings and minimize distance.
- **Atomic Simulation Execution:** Execution engine that validates inventory state freshness, executes collections atomically, decrements collected demand, and prevents duplicate executions.
- **Comprehensive Operational Metrics:** Quantitative calculations of trip distance, driving time, service duration, estimated diesel/EV fuel consumption, operating cost, and $\text{CO}_2$ emissions.
- **Interactive Leaflet & Geoapify GIS Mapping:** Interactive map interface displaying depot pins, categorized pickup markers, ordered route polylines, and Geoapify map tiles with automatic OpenStreetMap fallback.
- **Virtual Simulation Clock:** Controllable simulation timeline supporting virtual day advancement (`POST /api/v1/simulation/clock/advance`) to audit wait times and backlog accumulation.
- **Persistent SQLite Architecture:** Clean relational data modeling using SQLAlchemy 2.0 with transactional safety.

### Incomplete or Planned Features
- **Clarke–Wright Savings Matrix Pass:** *Planned.* The current route builder performs nearest-facility cost assignment, greedy capacity binning, and 2-opt tour refinement; a full multi-route Clarke–Wright merge pass is planned for a future release.
- **Baseline Comparison Metrics:** *Partial.* The simulation structure supports baseline-versus-optimized comparisons; the current baseline mirrors the 2-opt plan ($0.0\%$ reduction reported) until the dedicated nearest-neighbor baseline adapter is activated.
- **Stepwise Simulation Execution:** *Planned.* The stepwise execution endpoint (`POST /api/v1/simulations/{id}/advance`) is currently reserved (returns HTTP `501 Not Implemented`); executions are completed atomically.
- **Turn-by-Turn Road Routing API:** *Planned.* Production road matrix navigation via Geoapify road routing is planned; currently, routes utilize straight-line GeoJSON `LineString` segments scaled by an offline-safe Haversine detour coefficient ($\times 1.3$).

---

## Technology Stack

### Backend
- **Language & Runtime:** Python 3.10+ (tested with Python 3.14 / 3.11)
- **Web Framework:** FastAPI (v0.110+)
- **Server:** Uvicorn (v0.27+)
- **ORM & Data Layer:** SQLAlchemy (v2.0+)
- **Data Validation:** Pydantic (v2.0+)
- **Database Engine:** SQLite 3
- **HTTP Client:** HTTPX (v0.27+) for live Geoapify API checks
- **Configuration:** python-dotenv (v1.0+)
- **Test Suite:** pytest (v8.0+)

### Frontend
- **Framework & Language:** React 18 & TypeScript (v5.6+)
- **Build Tool:** Vite (v6.0+)
- **Routing:** React Router DOM (v6.28+)
- **Styling:** Tailwind CSS (v3.4+) & PostCSS
- **Mapping & GIS:** Leaflet (v1.9+) & React-Leaflet (v4.2+)
- **Map Tile Provider:** Geoapify Raster Tiles API (with automatic OpenStreetMap fallback)
- **UI Icons:** Lucide React (v0.468+)

---

## Project Structure

```
TECHCYCLE/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Application package marker
│   │   ├── database.py           # SQLAlchemy engine, session maker, Base declarative
│   │   ├── main.py               # FastAPI entry point, routers, CORS, integration status
│   │   ├── models.py             # SQLAlchemy ORM models (Facility, Vehicle, PickupPoint, etc.)
│   │   ├── routing.py            # Haversine distance, 2-opt algorithm, cost/emission calculations
│   │   ├── schemas.py            # Pydantic v2 validation schemas
│   │   └── services.py           # Urgency classification, facility assignment, route planning
│   ├── tests/
│   │   └── test_api.py           # Automated test suite (health, CRUD, planning, execution)
│   ├── reports/
│   │   ├── pickup_points.csv     # Exported collection point dataset
│   │   └── prototype_metrics.json# Baseline and simulation benchmark report
│   ├── backups/                  # Database snapshots created during reset (ignored by Git)
│   ├── analysis_export.py        # Prototype report and CSV generation script
│   ├── endpoint_coverage.json    # Test strategy and endpoint status documentation
│   ├── requirements.txt          # Python dependency manifest
│   ├── reset_database.py         # Schema reset utility with --confirm-reset safety flag
│   ├── seed_demo.py              # Idempotent Chennai synthetic demonstration dataset
│   ├── README.md                 # Dedicated backend documentation
│   ├── .env.example              # Sanitized environment template
│   └── .gitignore                # Backend-specific ignore rules
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios/fetch typed API service clients
│   │   │   ├── client.ts         # Base HTTP client with error handling
│   │   │   ├── dashboard.ts      # Dashboard KPI endpoints
│   │   │   ├── facilities.ts     # Facility CRUD endpoints
│   │   │   ├── pickupPoints.ts   # Pickup point CRUD and load updates
│   │   │   ├── settings.ts       # Settings and simulation clock endpoints
│   │   │   ├── simulations.ts    # Simulation planning, details, and execution
│   │   │   └── vehicles.ts       # Vehicle CRUD endpoints
│   │   ├── components/           # Reusable UI component library
│   │   │   ├── common/           # Button, Card, Modal, Badge, ProgressBar, Toast, etc.
│   │   │   ├── layout/           # AppLayout, Header, Sidebar
│   │   │   └── map/              # InteractiveMap, LocationPickerModal, MapLegend, etc.
│   │   ├── context/              # Global React context (AppContext)
│   │   ├── pages/                # Application pages
│   │   │   ├── DashboardPage.tsx # Live KPI cards, quick actions, demand distribution
│   │   │   ├── FacilitiesPage.tsx# Hub registration, interactive picker, fleet list
│   │   │   ├── MapPage.tsx       # Fullscreen Leaflet map, layer toggles, route review
│   │   │   ├── NotFoundPage.tsx  # Fallback 404 handler
│   │   │   ├── PickupPointsPage.tsx # Table with status filters and capacity gauges
│   │   │   ├── PickupPointDetailPage.tsx # Node inspection, historical log, load deposit
│   │   │   ├── SettingsPage.tsx  # Simulation rules, virtual clock advance, API status
│   │   │   ├── SimulationDetailPage.tsx # Route cards, stop tables, atomic execution
│   │   │   ├── SimulationPlannerPage.tsx# Objective picker, constraint toggles, plan generator
│   │   │   ├── SimulationsListPage.tsx  # Audit log of past simulations
│   │   │   └── VehiclesPage.tsx  # Vehicle administration, rated vs usable capacities
│   │   ├── styles/               # Global CSS and Tailwind directives
│   │   ├── types/                # TypeScript interfaces matching backend models
│   │   ├── App.tsx               # Main routing shell
│   │   └── main.tsx              # Application entry point
│   ├── index.html                # Vite HTML template
│   ├── package.json              # Node.js dependency manifest
│   ├── package-lock.json         # Pinned npm dependency tree
│   ├── postcss.config.js         # PostCSS configuration for Tailwind
│   ├── tailwind.config.js        # Tailwind CSS palette and typography config
│   ├── tsconfig.json             # TypeScript project compiler configuration
│   ├── vite.config.ts            # Vite bundler configuration
│   ├── README.md                 # Dedicated frontend documentation
│   └── .env.example              # Sanitized environment template
├── .gitignore                    # Root Git ignore rules (environment, databases, caches)
└── README.md                     # Project overview and execution guide
```

---

## Prerequisites

Before running the application, ensure the following software is installed on your Windows development environment:

1. **Python 3.10+** (tested on Python 3.14 and 3.11)
   - Verify with: `python --version`
2. **Node.js 18+** & **npm 9+**
   - Verify with: `node -v` and `npm -v`
3. **PowerShell 5.1+** or **PowerShell 7+**

---

## Environment Setup

The repository uses separate environment configuration files for the backend and frontend. Templates with safe placeholders (`.env.example`) are provided in their respective directories.

### Backend Environment (`backend/.env`)

Create `backend/.env` by copying `backend/.env.example`:

```powershell
Copy-Item backend\.env.example backend\.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEOAPIFY_KEY` | Server-side Geoapify API key used by `GET /api/v1/integrations/geoapify/status` to test connectivity. *Optional; if omitted, routing operates in offline mode.* | *(Leave blank or enter your key)* |
| `DATABASE_URL` | SQLAlchemy SQLite database connection string. | `sqlite:///./ewaste.db` |
| `CORS_ORIGINS` | Comma-separated allowlist of origins permitted to access the API. | `http://localhost:3000,http://localhost:5173` |

### Frontend Environment (`frontend/.env`)

Create `frontend/.env` by copying `frontend/.env.example`:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the running FastAPI backend server. | `http://localhost:8000` |
| `VITE_GEOAPIFY_MAP_KEY` | Browser-safe Geoapify key for fetching Leaflet map tiles. *Optional; if omitted or blank, the frontend automatically falls back to OpenStreetMap tiles.* | *(Leave blank or enter browser key)* |

> [!WARNING]
> **Client-Side Security Notice:** Environment variables prefixed with `VITE_` are inlined directly into compiled JavaScript bundles by Vite and are visible to end users via browser DevTools. **Never place server-side secrets, database passwords, or private API keys (such as `GEOAPIFY_KEY`) into frontend environment files.**

---

## Installation & Startup Instructions

Run the backend and frontend in two separate Windows PowerShell terminal windows.

### Terminal 1: Backend Setup & Startup

```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. Configure the environment
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 4. (Optional) Seed the idempotent demonstration dataset
# Seeds 3 facilities, 7 lorries, and 24 collection points in Chennai
python seed_demo.py

# 5. Start the FastAPI development server with live reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Documentation (Swagger UI):** [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- **OpenAPI Schema (JSON):** [`http://127.0.0.1:8000/openapi.json`](http://127.0.0.1:8000/openapi.json)
- **Health Check Endpoint:** [`http://127.0.0.1:8000/health`](http://127.0.0.1:8000/health)

### Terminal 2: Frontend Setup & Startup

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Configure the frontend environment
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 3. Install npm dependencies
npm install

# 4. Start the Vite development server
npm run dev
```

- **Operations Console UI:** [`http://localhost:5173`](http://localhost:5173)

---

## API Documentation

All application endpoints are versioned under `/api/v1` and return standard JSON payloads. The live OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

### System & Diagnostics
- `GET /health` — Service health and identity verification.
- `GET /api/v1/integrations/geoapify/status` — Live Geoapify API diagnostic (distinguishes unconfigured, invalid key, rate limit, timeout, or network error).
- `GET /api/v1/dashboard/summary` — Aggregated operational statistics (facility counts, vehicles, node statuses, pending weights).

### Configuration & Virtual Clock
- `GET /api/v1/settings` — Fetch current operational rules (safety margins, thresholds, cost per km).
- `PATCH /api/v1/settings` — Update operational parameters.
- `GET /api/v1/simulation/clock` — Read the current virtual simulation timestamp.
- `POST /api/v1/simulation/clock/advance` — Advance virtual simulation time by $N$ days to test wait-time escalation.

### Recycling Facilities
- `GET /api/v1/facilities` — List all registered recycling hubs.
- `POST /api/v1/facilities` — Register a new recycling hub with coordinate geometry.
- `GET /api/v1/facilities/{id}` — Retrieve facility details.
- `PATCH /api/v1/facilities/{id}` — Modify facility metadata or coordinates.
- `DELETE /api/v1/facilities/{id}` — Remove a recycling facility.
- `GET /api/v1/facilities/{facility_id}/vehicles` — List vehicles assigned to a facility.
- `POST /api/v1/facilities/{facility_id}/vehicles` — Register a vehicle assigned to this facility.

### Fleet Management
- `GET /api/v1/vehicles` — List all vehicles across all hubs.
- `GET /api/v1/vehicles/{id}` — Retrieve vehicle profile and rated/usable capacity.
- `PATCH /api/v1/vehicles/{id}` — Update vehicle availability or capacity.
- `DELETE /api/v1/vehicles/{id}` — Remove vehicle registration.

### Collection Points & Waste Loads
- `GET /api/v1/pickup-points` — List all collection nodes with calculated utilization and status.
- `POST /api/v1/pickup-points` — Register a new collection point.
- `GET /api/v1/pickup-points/{id}` — Retrieve detailed collection point metrics and history.
- `PATCH /api/v1/pickup-points/{id}` — Update collection point attributes.
- `DELETE /api/v1/pickup-points/{id}` — Remove collection point.
- `POST /api/v1/pickup-points/{id}/load-updates` — Deposit e-waste (weight kg, volume m³).
- `GET /api/v1/pickup-points/{id}/load-history` — Retrieve chronological audit log of deposits and collections.

### Simulation & Route Planning
- `POST /api/v1/simulations/plan` — Generate capacity-constrained, 2-opt optimized route plans.
- `GET /api/v1/simulations` — List previous simulation runs.
- `GET /api/v1/simulations/{id}` — Retrieve simulation details and assigned trips.
- `GET /api/v1/simulations/{id}/routes` — Retrieve route stop sequences and GeoJSON LineStrings.
- `GET /api/v1/simulations/{id}/metrics` — Retrieve cost, distance, time, and emission totals.
- `POST /api/v1/simulations/{id}/execute` — Atomically commit the route plan and clear collected inventory.
- `POST /api/v1/simulations/{id}/advance` — *Reserved (HTTP 501)* for stepwise execution.

---

## Simulation Methodology

The simulator implements a deterministic 8-stage operational pipeline:

```
[1. Registration]      Register Facilities, Vehicles, and Pickup Nodes with coordinates & capacity limits.
       │
       ▼
[2. Demand Logging]    Deposit e-waste quantities (kg / m³) incrementally via load-update events.
       │
       ▼
[3. Urgency Audit]     Evaluate eligibility: Normal (<70%), Due (≥70%), Urgent (≥80%), Critical (≥100%),
                       or Mandatory Wait (≥7 days uncollected).
       │
       ▼
[4. Hub Assignment]    Assign eligible nodes to the facility with the lowest estimated road travel cost.
       │
       ▼
[5. Capacity Binning]  Group pickups into vehicle trips obeying usable weight (90%) and volume (85%) limits.
       │
       ▼
[6. 2-Opt Optimization]Refine stop sequencing for each trip using 2-opt swap heuristic to eliminate crosses.
       │
       ▼
[7. Depot Returns]     Enforce closed tours: each lorry departs from its home depot and returns to unload.
       │
       ▼
[8. Metric Synthesis]  Calculate total distance, driving/service time, fuel consumed, cost, and CO₂ emissions.
```

---

## Routing Assumptions & Limitations

1. **Distance Calculation:** Road distances are calculated using the Haversine spherical formula with a standard metropolitan detour winding coefficient of $1.3$ ($\text{distance} = \text{haversine}(p_1, p_2) \times 1.3$). This provides consistent, deterministic, offline-capable approximations.
2. **Road Geometry:** Route lines rendered on the Leaflet map represent ordered sequence connections (`LineString` geometry between stops), not turn-by-turn road tracing.
3. **Geoapify Integration:** The backend uses the Geoapify Routing API strictly for live credential and network validation via `GET /api/v1/integrations/geoapify/status`. The optimization planner does not make remote matrix calls, ensuring offline reproducibility.
4. **Emissions & Fuel Modeling:** Fuel consumption and emissions are transparent rule-based estimations computed using configured vehicle fuel efficiencies (default: diesel lorries at $3.5\text{ km/L}$, $2.68\text{ kg CO}_2/\text{L}$) rather than physical telematics sensors.
5. **Baseline Comparison:** The baseline comparison in the current release mirrors the optimized route metrics. A planned nearest-neighbor sequential baseline will be activated in a subsequent update.

---

## Testing

### Automated Backend Tests
Run the pytest test suite from the backend directory:

```powershell
cd backend
$env:PYTHONPATH="."
python -m pytest -q
```

The test suite validates:
- API health and OpenAPI specification availability.
- Facility, vehicle, and collection point CRUD operations.
- Simulation clock advancement and urgency state recalculations.
- Simulation route generation, capacity safety, and atomic single-execution enforcement.

### Frontend Validation & Build Check
Run TypeScript type-checking and the production Vite bundler from the frontend directory:

```powershell
cd frontend
npm run build
```

This compiles all TypeScript modules (`tsc`), validates interface adherence, and verifies zero compilation errors.

---

## Data Privacy & GitHub Contribution Guidance

- **No Secrets in Version Control:** Never commit `.env` files or hard-coded API credentials. All `.env` files are excluded by `.gitignore`. Always use `.env.example` templates for shared configuration.
- **SQLite Database Exclusion:** SQLite database files (`*.db`, `*.sqlite`, `*.sqlite3`) and write-ahead logs (`*-wal`, `*-shm`) are excluded from Git to prevent tracking local state.
- **Idempotent Data Generation:** The local database can be recreated and populated deterministically at any time using:
  ```powershell
  python reset_database.py --confirm-reset
  ```
- **Deliverable Reports:** Prototype analysis reports stored in `backend/reports/` (`pickup_points.csv`, `prototype_metrics.json`) are preserved as deliverables and remain tracked by Git.

---

## Current Limitations & Future Work

- **Turn-by-Turn Matrix Navigation:** Integration of the Geoapify Routing Matrix API directly into the distance cache for live road routing.
- **Clarke–Wright Merge Algorithm:** Implementation of a full savings-based merge pass for multi-vehicle load consolidation.
- **Dynamic Baseline Comparison:** Implementation of a naive nearest-neighbor dispatch algorithm to demonstrate quantitative percentage savings in distance, cost, and emissions.
- **Stepwise Interactive Execution:** Enabling step-by-step lorry progression and real-time animation on the operations map.
