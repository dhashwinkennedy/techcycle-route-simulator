import os, asyncio
from datetime import timedelta
from contextlib import asynccontextmanager
import httpx
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .models import Facility, Vehicle, PickupPoint, LoadUpdate, Simulation
from .schemas import FacilityIn, FacilityPatch, VehicleIn, VehiclePatch, PickupIn, PickupPatch, LoadIn, AdvanceIn, SettingsPatch, PlanIn
from .services import state, pickup_data, DEFAULT_SETTINGS
from .routing import distance, two_opt

Base.metadata.create_all(engine)
app=FastAPI(title='E-Waste Collection Optimisation API', version='1.0.0', openapi_url='/openapi.json')
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in os.getenv('CORS_ORIGINS','*').split(',')],allow_methods=['*'],allow_headers=['*'],allow_credentials=False)

def fail(status, code, message): raise HTTPException(status, {'error':{'code':code,'message':message,'details':[]}})
@app.exception_handler(HTTPException)
async def errors(_,e): return __import__('fastapi').responses.JSONResponse(e.status_code,e.detail if 'error' in e.detail else {'error':{'code':'HTTP_ERROR','message':str(e.detail),'details':[]}})
def get(model,id,db):
    x=db.get(model,id)
    if not x: fail(404,'NOT_FOUND',f'{model.__name__} not found')
    return x
def settings(db): return state(db).settings
def facility_out(x): return {'id':x.id,'name':x.name,'latitude':x.latitude,'longitude':x.longitude,'address':x.address,'active':x.active,'created_at':x.created_at,'updated_at':x.updated_at}
def vehicle_out(x,s): return {'id':x.id,'facility_id':x.facility_id,'name':x.name,'rated_weight_capacity_kg':x.weight_capacity_kg,'rated_cargo_volume_m3':x.volume_capacity_m3,'usable_weight_capacity_kg':round(x.weight_capacity_kg*(1-s['weight_safety_margin']),2),'usable_volume_capacity_m3':round(x.volume_capacity_m3*(1-s['volume_safety_margin']),2),'fuel_type':x.fuel_type,'status':x.status,'max_working_minutes':x.max_working_minutes,'created_at':x.created_at,'updated_at':x.updated_at}
def update(x,data):
    for k,v in data.items():
        if v is not None and hasattr(x,k): setattr(x,k,v)

@app.get('/health')
def health(db:Session=Depends(get_db)): state(db); return {'status':'ok','service':'ewaste-routing-api'}
@app.get('/api/v1/settings')
def read_settings(db:Session=Depends(get_db)): return settings(db)
@app.patch('/api/v1/settings')
def patch_settings(body:SettingsPatch,db:Session=Depends(get_db)):
    st=state(db); merged={**st.settings,**body.model_dump(exclude_none=True)}
    if not (merged['due_threshold']<=merged['urgent_threshold']<=merged['critical_threshold']): fail(422,'VALIDATION_ERROR','Thresholds must be due <= urgent <= critical')
    st.settings=merged; db.commit(); return merged
@app.get('/api/v1/simulation/clock')
def clock(db:Session=Depends(get_db)): return {'simulation_time':state(db).simulation_time}
@app.post('/api/v1/simulation/clock/advance')
def advance(body:AdvanceIn,db:Session=Depends(get_db)):
    st=state(db); st.simulation_time += timedelta(days=body.days); db.commit(); return {'simulation_time':st.simulation_time,'advanced_days':body.days}

@app.get('/api/v1/integrations/geoapify/status')
async def geo_status():
    key=os.getenv('GEOAPIFY_KEY')
    if not key: return {'provider':'geoapify','configured':False,'routing_api':'not_configured','map_tiles':'not_tested','message':'GEOAPIFY_KEY is not configured'}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0, connect=3.0)) as c:
            r=await c.get('https://api.geoapify.com/v1/routing',params={'waypoints':'13.0827,80.2707|13.0878,80.2785','mode':'drive','apiKey':key})
        if r.status_code in (401,403): status,msg='authentication_error','Geoapify rejected the API key'
        elif r.status_code==429: status,msg='quota_limited','Geoapify quota or rate limit reached'
        elif r.status_code>=400: status,msg='invalid_request',f'Geoapify returned HTTP {r.status_code}'
        else: status,msg='working','Routing request succeeded'
    except httpx.TimeoutException: status,msg='network_timeout','Geoapify request timed out'
    except httpx.RequestError: status,msg='network_error','Could not reach Geoapify'
    return {'provider':'geoapify','configured':True,'routing_api':status,'map_tiles':'not_tested','message':msg}

@app.post('/api/v1/facilities',status_code=201)
def create_facility(body:FacilityIn,db:Session=Depends(get_db)): x=Facility(**body.model_dump()); db.add(x);db.commit();db.refresh(x);return facility_out(x)
@app.get('/api/v1/facilities')
def list_facilities(active:bool|None=None,db:Session=Depends(get_db)):
    q=select(Facility); q=q.where(Facility.active==active) if active is not None else q; return [facility_out(x) for x in db.scalars(q)]
@app.get('/api/v1/facilities/{id}')
def read_facility(id:str,db:Session=Depends(get_db)): return facility_out(get(Facility,id,db))
@app.patch('/api/v1/facilities/{id}')
def edit_facility(id:str,body:FacilityPatch,db:Session=Depends(get_db)): x=get(Facility,id,db);update(x,body.model_dump(exclude_none=True));db.commit();return facility_out(x)
@app.delete('/api/v1/facilities/{id}',status_code=204)
def remove_facility(id:str,db:Session=Depends(get_db)):
    x=get(Facility,id,db)
    if db.scalar(select(Vehicle).where(Vehicle.facility_id==id).limit(1)): fail(409,'CONFLICT','Delete or reassign vehicles before deleting facility')
    db.delete(x);db.commit();return Response(status_code=204)

@app.post('/api/v1/facilities/{facility_id}/vehicles',status_code=201)
def create_vehicle(facility_id:str,body:VehicleIn,db:Session=Depends(get_db)): get(Facility,facility_id,db);x=Vehicle(facility_id=facility_id,**body.model_dump());db.add(x);db.commit();db.refresh(x);return vehicle_out(x,settings(db))
@app.get('/api/v1/facilities/{facility_id}/vehicles')
def list_vehicles(facility_id:str,db:Session=Depends(get_db)): get(Facility,facility_id,db);s=settings(db);return [vehicle_out(x,s) for x in db.scalars(select(Vehicle).where(Vehicle.facility_id==facility_id))]
@app.get('/api/v1/vehicles/{id}')
def read_vehicle(id:str,db:Session=Depends(get_db)): return vehicle_out(get(Vehicle,id,db),settings(db))
@app.patch('/api/v1/vehicles/{id}')
def edit_vehicle(id:str,body:VehiclePatch,db:Session=Depends(get_db)): x=get(Vehicle,id,db);update(x,body.model_dump(exclude_none=True));db.commit();return vehicle_out(x,settings(db))
@app.delete('/api/v1/vehicles/{id}',status_code=204)
def remove_vehicle(id:str,db:Session=Depends(get_db)): db.delete(get(Vehicle,id,db));db.commit();return Response(status_code=204)

@app.post('/api/v1/pickup-points',status_code=201)
def create_pickup(body:PickupIn,db:Session=Depends(get_db)):
    st=state(db);d=body.model_dump(); wait=d.pop('initial_wait_days');p=PickupPoint(**d)
    if p.pending_weight_kg or p.pending_volume_m3: p.request_started_at=st.simulation_time-timedelta(days=wait);p.last_completed_at=st.simulation_time-timedelta(days=wait)
    db.add(p);db.commit();db.refresh(p);return pickup_data(p,st.simulation_time,st.settings)
@app.get('/api/v1/pickup-points')
def list_pickups(category:str|None=None,status:str|None=None,active:bool|None=None,db:Session=Depends(get_db)):
    st=state(db); xs=list(db.scalars(select(PickupPoint)));out=[pickup_data(x,st.simulation_time,st.settings) for x in xs]
    return [x for x in out if (category is None or x['category']==category) and (status is None or x['status']==status) and (active is None or x['active']==active)]
@app.get('/api/v1/pickup-points/{id}')
def read_pickup(id:str,db:Session=Depends(get_db)): st=state(db);return pickup_data(get(PickupPoint,id,db),st.simulation_time,st.settings)
@app.patch('/api/v1/pickup-points/{id}')
def edit_pickup(id:str,body:PickupPatch,db:Session=Depends(get_db)):
    p=get(PickupPoint,id,db);d=body.model_dump(exclude_none=True);d.pop('initial_wait_days',None);update(p,d);db.commit();st=state(db);return pickup_data(p,st.simulation_time,st.settings)
@app.delete('/api/v1/pickup-points/{id}',status_code=204)
def remove_pickup(id:str,db:Session=Depends(get_db)): db.delete(get(PickupPoint,id,db));db.commit();return Response(status_code=204)
@app.post('/api/v1/pickup-points/{id}/load-updates')
def load_update(id:str,body:LoadIn,db:Session=Depends(get_db)):
    p=get(PickupPoint,id,db);st=state(db)
    if body.added_weight_kg==0 and body.added_volume_m3==0: fail(422,'VALIDATION_ERROR','At least one added load must be positive')
    was_empty=not(p.pending_weight_kg or p.pending_volume_m3);p.pending_weight_kg+=body.added_weight_kg;p.pending_volume_m3+=body.added_volume_m3
    if was_empty: p.request_started_at=st.simulation_time
    db.add(LoadUpdate(pickup_point_id=id,weight_kg=body.added_weight_kg,volume_m3=body.added_volume_m3,description=body.description));db.commit();out=pickup_data(p,st.simulation_time,st.settings);out['added_weight_kg']=body.added_weight_kg;out['added_volume_m3']=body.added_volume_m3;out['warnings']=['Safe capacity exceeded; demand retained and prioritised'] if out['status']=='critical' else [];return out
@app.get('/api/v1/pickup-points/{id}/load-history')
def load_history(id:str,db:Session=Depends(get_db)): get(PickupPoint,id,db);return [{'id':x.id,'added_weight_kg':x.weight_kg,'added_volume_m3':x.volume_m3,'description':x.description,'created_at':x.created_at} for x in db.scalars(select(LoadUpdate).where(LoadUpdate.pickup_point_id==id))]

def make_plan(db, body):
    st=state(db);s=st.settings; fs=list(db.scalars(select(Facility).where(Facility.active==True))); ps=list(db.scalars(select(PickupPoint).where(PickupPoint.active==True)))
    if body.facility_ids is not None: fs=[x for x in fs if x.id in body.facility_ids]
    if body.pickup_point_ids is not None: ps=[x for x in ps if x.id in body.pickup_point_ids]
    eligible=[p for p in ps if pickup_data(p,st.simulation_time,s)['status']!='normal' or body.include_opportunistic_pickups]
    assignments=[]; grouped={f.id:[] for f in fs}; deferred=[]
    for p in sorted(eligible,key=lambda x: {'critical':0,'urgent':1,'due':2,'normal':3}[pickup_data(x,st.simulation_time,s)['status']]):
        candidates=[]
        for f in fs:
            vs=list(db.scalars(select(Vehicle).where(Vehicle.facility_id==f.id,Vehicle.status=='available')))
            if vs: candidates.append((distance((f.latitude,f.longitude),(p.latitude,p.longitude)),f,vs))
        if not candidates: deferred.append({'pickup_point_id':p.id,'reason':'No available fleet at any active facility'});continue
        _,f,_=min(candidates,key=lambda x:x[0]);grouped[f.id].append(p);assignments.append({'pickup_point_id':p.id,'facility_id':f.id,'reason':'Lowest feasible estimated incremental road travel cost'})
    # Planning-only remainder: an oversized pickup stays eligible for later trips.
    remaining={p.id:[p.pending_weight_kg,p.pending_volume_m3] for p in eligible}
    routes=[]
    for f in fs:
        stops=grouped[f.id];vs=list(db.scalars(select(Vehicle).where(Vehicle.facility_id==f.id,Vehicle.status=='available')))
        if not stops: continue
        ordered=two_opt(stops[:],(f.latitude,f.longitude))
        vi=0; trip=1
        while ordered and vs:
            v=vs[vi%len(vs)];capw=v.weight_capacity_kg*(1-s['weight_safety_margin']);capv=v.volume_capacity_m3*(1-s['volume_safety_margin']);remw,remv=capw,capv; served=[]
            for p in ordered[:]:
                pending_w,pending_v=remaining[p.id]
                ratio=min(1,remw/pending_w if pending_w else 1,remv/pending_v if pending_v else 1)
                if ratio<=0: continue
                w=pending_w*ratio;vol=pending_v*ratio;remw-=w;remv-=vol;served.append((p,w,vol))
                remaining[p.id]=[max(0,pending_w-w),max(0,pending_v-vol)]
                if remaining[p.id][0]<1e-6 and remaining[p.id][1]<1e-6: ordered.remove(p)
                if remw<1e-6 or remv<1e-6: break
            if not served: break
            coords=[(f.latitude,f.longitude)]+[(p.latitude,p.longitude) for p,_,_ in served]+[(f.latitude,f.longitude)]
            km=sum(distance(coords[i],coords[i+1]) for i in range(len(coords)-1)); drive=km/30*60; service=sum(p.service_minutes for p,_,_ in served); limit=v.max_working_minutes or s['working_minutes_per_day']
            if drive+service>limit: deferred += [{'pickup_point_id':p.id,'reason':'Working-time limit'} for p,_,_ in served]; continue
            sw=sv=0; route_stops=[]
            for seq,(p,w,vol) in enumerate(served,1):
                sw+=w;sv+=vol;route_stops.append({'sequence':seq,'pickup_point_id':p.id,'planned_weight_kg':round(w,3),'planned_volume_m3':round(vol,4),'weight_after_kg':round(sw,3),'volume_after_m3':round(sv,4),'remaining_weight_capacity_kg':round(capw-sw,3),'remaining_volume_capacity_m3':round(capv-sv,4)})
            routes.append({'facility_id':f.id,'vehicle_id':v.id,'trip_number':trip,'stops':route_stops,'distance_km':round(km,3),'drive_minutes':round(drive,2),'service_minutes':service,'total_minutes':round(drive+service,2),'geometry':{'type':'LineString','coordinates':[[lon,lat] for lat,lon in coords]},'routing_source':'haversine_fallback_estimate'});trip+=1;vi+=1
        for p in ordered: deferred.append({'pickup_point_id':p.id,'reason':'Insufficient usable vehicle capacity'})
    total_km=sum(x['distance_km'] for x in routes); total_drive=sum(x['drive_minutes'] for x in routes); fuel=total_km*s['fuel_l_per_km']; metrics={'total_road_distance_km':round(total_km,3),'driving_time_minutes':round(total_drive,2),'loading_service_minutes':sum(x['service_minutes'] for x in routes),'weight_collected_kg':round(sum(z['planned_weight_kg'] for x in routes for z in x['stops']),3),'volume_collected_m3':round(sum(z['planned_volume_m3'] for x in routes for z in x['stops']),4),'number_of_trips':len(routes),'depot_returns':len(routes),'estimated_fuel_l':round(fuel,2),'estimated_emissions_kg_co2':round(fuel*s['co2_kg_per_l'],2),'estimated_operating_cost':round(fuel*s['fuel_price_per_l'],2)}
    return {'status':'planned','routing_provider':'haversine_fallback_estimate','simulation_time':st.simulation_time.isoformat(),'assignments':assignments,'routes':routes,'metrics':{'optimised':metrics,'baseline':metrics if body.include_baseline else {},'percentage_reduction':{'distance':0.0,'time':0.0,'cost':0.0,'emissions':0.0} if body.include_baseline else {}},'deferred_pickups':deferred,'warnings':['Geoapify matrices are not used for plans in this offline-safe implementation; values are labelled estimates.'],'input_snapshot':{p.id:[p.pending_weight_kg,p.pending_volume_m3] for p in ps}}

@app.post('/api/v1/simulations/plan',status_code=201)
def plan(body:PlanIn,db:Session=Depends(get_db)):
    r=make_plan(db,body);run=Simulation(snapshot=r.pop('input_snapshot'),result=r,status='planned');db.add(run);db.commit();r['run_id']=run.id;return r
@app.get('/api/v1/simulations')
def simulations(db:Session=Depends(get_db)): return [{'run_id':x.id,'status':x.status,'created_at':x.created_at} for x in db.scalars(select(Simulation))]
@app.get('/api/v1/simulations/{id}')
def simulation(id:str,db:Session=Depends(get_db)): x=get(Simulation,id,db);return {'run_id':x.id,'status':x.status,**x.result}
@app.get('/api/v1/simulations/{id}/routes')
def routes(id:str,db:Session=Depends(get_db)): return get(Simulation,id,db).result['routes']
@app.get('/api/v1/simulations/{id}/metrics')
def metrics(id:str,db:Session=Depends(get_db)): return get(Simulation,id,db).result['metrics']
@app.post('/api/v1/simulations/{id}/execute')
def execute(id:str,db:Session=Depends(get_db)):
    run=get(Simulation,id,db)
    if run.status!='planned': fail(409,'CONFLICT','Simulation has already been executed or is not executable')
    for pid,loads in run.snapshot.items():
        p=get(PickupPoint,pid,db)
        if [p.pending_weight_kg,p.pending_volume_m3] != loads: fail(409,'CONFLICT','Underlying pickup demand changed; create a fresh plan')
    st=state(db)
    for route in run.result['routes']:
        for stop in route['stops']:
            p=get(PickupPoint,stop['pickup_point_id'],db);p.pending_weight_kg=max(0,p.pending_weight_kg-stop['planned_weight_kg']);p.pending_volume_m3=max(0,p.pending_volume_m3-stop['planned_volume_m3'])
            if p.pending_weight_kg<1e-6 and p.pending_volume_m3<1e-6: p.pending_weight_kg=p.pending_volume_m3=0;p.request_started_at=None;p.last_completed_at=st.simulation_time
    run.status='executed';db.commit();return {'run_id':id,'status':'executed','message':'Planned collections applied once'}
@app.post('/api/v1/simulations/{id}/advance')
def step(id:str,db:Session=Depends(get_db)): fail(501,'NOT_IMPLEMENTED','Stepwise execution is reserved for the frontend animation iteration; use execute for atomic simulation execution')
@app.get('/api/v1/dashboard/summary')
def dashboard(db:Session=Depends(get_db)):
    st=state(db);ps=list(db.scalars(select(PickupPoint).where(PickupPoint.active==True)));states=[pickup_data(x,st.simulation_time,st.settings) for x in ps]
    return {'facilities':len(list(db.scalars(select(Facility).where(Facility.active==True)))),'vehicles':len(list(db.scalars(select(Vehicle).where(Vehicle.status=='available')))),'pickup_points':len(ps),'by_status':{q:sum(x['status']==q for x in states) for q in ['normal','due','urgent','critical']},'pending_weight_kg':sum(x.pending_weight_kg for x in ps),'pending_volume_m3':sum(x.pending_volume_m3 for x in ps)}
