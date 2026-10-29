# E-Waste Collection and Transportation Optimisation Simulator

FastAPI backend for a multi-facility e-waste collection simulation. It persists facilities, home-fleet vehicles, collection points, inventory events, simulation settings/clocks, and immutable route-plan snapshots in SQLite.

## Run

```powershell
python -m pip install -r requirements.txt
python seed_demo.py          # optional, idempotent Chennai data
uvicorn app.main:app --reload
```

The interactive OpenAPI contract is at `http://127.0.0.1:8000/docs`; raw OpenAPI is `/openapi.json`. Run tests with:

```powershell
pytest -q
```

Copy `.env.example` to `.env` and set `DATABASE_URL` if desired. `GEOAPIFY_KEY` is read only from the environment and never returned. `CORS_ORIGINS` is a comma-separated allowlist for the future frontend.

## Reset and synthetic demonstration data

The active development database can be replaced only with an explicit confirmation:

```powershell
python reset_database.py --confirm-reset
```

It refuses non-local SQLite URLs, saves a timestamped copy under ignored `backups/`, recreates the schema, and inserts deterministic fictional Chennai simulation data. The final dataset has three simulated facilities, seven home-fleet lorries (the North hub retains three 1,000 kg / 5 m³ diesel lorries), and 24 synthetic pickup points. It deliberately includes normal, due, urgent, critical, mandatory-wait, high-volume, high-weight, and one over-capacity scenario. Run `python seed_demo.py` afterward only to check idempotency; it will not duplicate data.

## API surface

All feature routes are versioned under `/api/v1`:

- `GET /settings`, `PATCH /settings`; `GET /simulation/clock`, `POST /simulation/clock/advance`; `GET /dashboard/summary`
- `GET /integrations/geoapify/status`
- Full CRUD for `/facilities`, plus nested `/{facility_id}/vehicles`, and individual `/vehicles/{id}`
- Full CRUD for `/pickup-points`, `POST /pickup-points/{id}/load-updates`, and `GET /pickup-points/{id}/load-history`
- `POST /simulations/plan`, simulation list/detail, `/routes`, `/metrics`, and atomic `/execute`

Units are kilograms, cubic metres, kilometres and minutes. Every pickup response contains authoritative pending demand, utilisation percentages, waiting days, severity and all threshold reasons. Invalid requests use a stable `{"error":{"code", "message", "details"}}` shape.

## Planning and operational rules

Facilities own their fleet; every trip starts and ends at that same facility. Usable capacity applies the configurable default 10% weight and 15% volume safety margins. Due/urgent/critical capacity rules are 70%/80%/100%; seven waiting days is mandatory and 80% of that is urgent. Residential wait starts at last completed collection; institutional/business wait starts with the oldest open request. A partial collection preserves an open request clock.

Planning prioritises critical, mandatory, urgent and due demand, assigns a pickup to the eligible facility with the lowest deterministic estimated road cost, constructs capacity-safe trips, applies 2-opt ordering, and supports split loads across trips. Plans do not change inventory. Execution rejects stale inventories and cannot run twice.

Metrics include depot-return legs, distance, driving/service time, collected quantity, trips, fuel, cost and CO2 estimates. Fuel assumptions are transparent settings rather than measurements.

## Routing and Geoapify

`GET /integrations/geoapify/status` makes a minimal Chennai routing call and distinguishes absent configuration, authentication, quota, request, timeout and network failures. The normal plan engine intentionally remains usable offline: it currently uses an explicitly labelled Haversine × 1.3 estimate and GeoJSON `LineString` geometry. This is not presented as road routing.

For a production iteration, add Geoapify matrix/route responses to the route-cache adapter before selecting `routing_provider: geoapify`; the API response is already designed to expose source and geometry. Use a separate browser-restricted Geoapify map key for Leaflet tiles; never forward this server key to the browser.

## Limitations

The baseline currently mirrors the optimised plan, so comparison values are zero until the planned nearest-neighbour baseline adapter is enabled. Stepwise execution is reserved (returns 501); execution is atomic. The present routing engine implements 2-opt and capacity-aware trip construction but not a full Clarke–Wright merge pass. These are deliberately documented rather than overstated.
