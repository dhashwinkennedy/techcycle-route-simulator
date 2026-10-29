"""Read-only reproducible analysis of the latest planned prototype simulation.

Does not call plan(), execute(), or write to SQLite.  It exports a nearest-next
baseline because the stored prototype baseline is currently a copied placeholder.
"""
import csv, json
from collections import defaultdict
from pathlib import Path
from app.database import SessionLocal
from app.models import AppState, Facility, PickupPoint, Simulation, Vehicle
from app.routing import distance
from app.services import pickup_data

OUT=Path('reports')

def metrics(routes, settings):
    km=sum(r['distance_km'] for r in routes); drive=sum(r['drive_minutes'] for r in routes)
    service=sum(r['service_minutes'] for r in routes); fuel=km*settings['fuel_l_per_km']
    stops=[s for r in routes for s in r['stops']]
    return {'total_road_distance_km':round(km,3),'driving_time_minutes':round(drive,2),'loading_service_minutes':service,'unloading_minutes':None,'total_operating_minutes':round(drive+service,2),'weight_collected_kg':round(sum(s['planned_weight_kg'] for s in stops),3),'volume_collected_m3':round(sum(s['planned_volume_m3'] for s in stops),4),'number_of_trips':len(routes),'depot_returns':len(routes),'lorries_used':len(set(r['vehicle_id'] for r in routes)),'estimated_fuel_l':round(fuel,3),'estimated_fuel_cost_inr':round(fuel*settings['fuel_price_per_l'],2),'estimated_emissions_kg_co2':round(fuel*settings['co2_kg_per_l'],3)}

def nearest_next_baseline(facilities, vehicles, points, assignments, snapshot, settings):
    """Same assignment/snapshot/capacity/time rules; order stops by nearest next leg."""
    fmap={f.id:f for f in facilities}; pmap={p.id:p for p in points}
    grouped=defaultdict(list)
    for a in assignments: grouped[a['facility_id']].append(a['pickup_point_id'])
    rem={pid:list(snapshot[pid]) for pid in snapshot}; routes=[]
    for fid,pids in grouped.items():
        depot=fmap[fid]; fleet=[v for v in vehicles if v.facility_id==fid and v.status=='available']; trip=1; vi=0
        active=set(pids)
        while active and fleet:
            v=fleet[vi % len(fleet)]; vi+=1; capw=v.weight_capacity_kg*(1-settings['weight_safety_margin']); capv=v.volume_capacity_m3*(1-settings['volume_safety_margin'])
            remw,remv=capw,capv; current=(depot.latitude,depot.longitude); stops=[]
            while active:
                candidates=[]
                for pid in active:
                    w,vol=rem[pid]
                    if w<=1e-8 and vol<=1e-8: continue
                    ratio=min(1, remw/w if w else 1, remv/vol if vol else 1)
                    if ratio>1e-10: candidates.append((distance(current,pmap[pid]),pid,ratio))
                if not candidates: break
                _,pid,ratio=min(candidates,key=lambda x:(x[0],x[1])); p=pmap[pid]; w,vol=rem[pid]; cw=w*ratio; cv=vol*ratio
                # Same planner model: reject an added stop when its complete route time breaches vehicle day.
                projected=distance(current,(p.latitude,p.longitude))+distance((p.latitude,p.longitude),(depot.latitude,depot.longitude))
                current_drive=sum(distance((depot.latitude,depot.longitude) if i==0 else (pmap[st['pickup_point_id']].latitude,pmap[st['pickup_point_id']].longitude), (pmap[stops[i]['pickup_point_id']].latitude,pmap[stops[i]['pickup_point_id']].longitude) if i < len(stops) else (p.latitude,p.longitude)) for i,st in enumerate(stops)) if stops else 0
                if (current_drive+projected)/30*60 + sum(x['service_minutes'] for x in stops)+p.service_minutes > (v.max_working_minutes or settings['working_minutes_per_day']): break
                remw-=cw;remv-=cv;stops.append({'pickup_point_id':pid,'planned_weight_kg':round(cw,3),'planned_volume_m3':round(cv,4),'service_minutes':p.service_minutes});rem[pid]=[max(0,w-cw),max(0,vol-cv)];current=(p.latitude,p.longitude)
                if rem[pid][0]<1e-7 and rem[pid][1]<1e-7: active.remove(pid)
            if not stops: break
            coords=[(depot.latitude,depot.longitude)]+[(pmap[x['pickup_point_id']].latitude,pmap[x['pickup_point_id']].longitude) for x in stops]+[(depot.latitude,depot.longitude)]
            km=sum(distance(coords[i],coords[i+1]) for i in range(len(coords)-1)); drive=km/30*60
            routes.append({'facility_id':fid,'vehicle_id':v.id,'trip_number':trip,'stops':stops,'distance_km':round(km,3),'drive_minutes':round(drive,2),'service_minutes':sum(x['service_minutes'] for x in stops),'total_minutes':round(drive+sum(x['service_minutes'] for x in stops),2),'routing_source':'haversine_fallback_estimate'});trip+=1
    deferred=[pid for pid,(w,v) in rem.items() if w>1e-6 or v>1e-6]
    return routes,deferred

def reduction(base,opt,key): return None if not base[key] else round((base[key]-opt[key])/base[key]*100,2)
def main():
    db=SessionLocal()
    try:
        st=db.get(AppState,1); run=db.query(Simulation).filter_by(status='planned').order_by(Simulation.created_at.desc()).first()
        if not run: raise SystemExit('No planned simulation exists.')
        fs=db.query(Facility).all();vs=db.query(Vehicle).all();ps=db.query(PickupPoint).all()
        baseline_routes,deferred=nearest_next_baseline(fs,vs,ps,run.result['assignments'],run.snapshot,st.settings)
        baseline=metrics(baseline_routes,st.settings); optimized=metrics(run.result['routes'],st.settings)
        reductions={k:reduction(baseline,optimized,k) for k in ['total_road_distance_km','driving_time_minutes','total_operating_minutes','estimated_fuel_cost_inr','estimated_emissions_kg_co2']}
        accounted={x['pickup_point_id'] for r in baseline_routes for x in r['stops']}|set(deferred)
        rows=[]
        for p in ps:
            d=pickup_data(p,st.simulation_time,st.settings); d['facility_assignment']=next((a['facility_id'] for a in run.result['assignments'] if a['pickup_point_id']==p.id),None);rows.append(d)
        OUT.mkdir(exist_ok=True)
        with (OUT/'pickup_points.csv').open('w',newline='',encoding='utf-8') as f:
            cols=['id','name','category','facility_assignment','latitude','longitude','current_pending_weight_kg','current_pending_volume_m3','maximum_safe_weight_kg','maximum_safe_volume_m3','weight_utilisation_percent','volume_utilisation_percent','waiting_days','status'];w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows([{k:x.get(k) for k in cols} for x in rows])
        payload={'source':{'database_records':'synthetic simulated demo data from seed_demo.py','saved_run_id':run.id,'saved_run_created_at':run.created_at.isoformat(),'routing_source':run.result['routing_provider'],'geoapify_matrix_cache':'not implemented / no cached records','warning':'Distances are estimated Haversine × 1.3, not actual road distances.'},'settings':st.settings,'facilities':[{'id':f.id,'name':f.name,'latitude':f.latitude,'longitude':f.longitude,'lorry_count':sum(v.facility_id==f.id for v in vs)} for f in fs],'vehicles':[{'id':v.id,'name':v.name,'home_facility_id':v.facility_id,'fuel_type':v.fuel_type,'rated_weight_capacity_kg':v.weight_capacity_kg,'rated_volume_capacity_m3':v.volume_capacity_m3,'usable_weight_capacity_kg':v.weight_capacity_kg*(1-st.settings['weight_safety_margin']),'usable_volume_capacity_m3':v.volume_capacity_m3*(1-st.settings['volume_safety_margin'])} for v in vs],'pickup_points':rows,'optimized':{'metrics':optimized,'assignments':run.result['assignments'],'routes':run.result['routes'],'deferred_pickups':run.result['deferred_pickups']},'baseline_nearest_next':{'metrics':baseline,'routes':baseline_routes,'deferred_pickup_ids':deferred},'comparison':{'percentage_reductions':reductions,'same_snapshot':True,'same_assignments':True,'same_fleet':True,'baseline_accounted_pickups':len(accounted),'eligible_pickups':len(run.result['assignments'])}}
        (OUT/'prototype_metrics.json').write_text(json.dumps(payload,indent=2,default=str),encoding='utf-8')
        print(json.dumps({'run_id':run.id,'baseline':baseline,'optimized':optimized,'reductions':reductions,'baseline_deferred':deferred},indent=2))
    finally: db.close()
if __name__=='__main__': main()
