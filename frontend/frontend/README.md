# TechCycle frontend

React + TypeScript operations console for the E-Waste Collection and Transportation Route Optimisation Simulator.

## Configure and run

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` to the FastAPI server (default `http://localhost:8000`). Set a browser-safe `VITE_GEOAPIFY_MAP_KEY` for map tiles. Never place the server `GEOAPIFY_KEY` in this file.

Start the FastAPI backend separately using its own documented command, typically from its backend directory:

```powershell
uvicorn app.main:app --reload --port 8000
```

This repository did not contain backend source at implementation time, so the UI uses the endpoint paths specified in the task and displays an explicit unavailable state when a particular endpoint is absent. The client does not fabricate operational statistics, road geometry, or planning results.

Validate the frontend with:

```powershell
npm run build
```
