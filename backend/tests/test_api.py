import os
os.environ['DATABASE_URL']='sqlite:///./test_ewaste.db'
from app.database import SessionLocal, Base, engine
from app.main import app, create_facility, create_vehicle, create_pickup, load_update, advance, plan, execute
from app.models import PickupPoint
from app.schemas import FacilityIn, VehicleIn, PickupIn, LoadIn, AdvanceIn, PlanIn
from app.services import state, pickup_data

def fresh_db():
    Base.metadata.drop_all(engine); Base.metadata.create_all(engine)
    return SessionLocal()
def test_health_and_docs():
    paths=app.openapi()['paths']
    assert '/health' in paths and '/api/v1/simulations/plan' in paths
def test_facility_vehicle_pickup_and_clock():
    db=fresh_db()
    f=create_facility(FacilityIn(name='Hub',latitude=13,longitude=80),db)
    v=create_vehicle(f['id'],VehicleIn(name='V1',weight_capacity_kg=1000,volume_capacity_m3=5),db)
    assert v['usable_weight_capacity_kg']==900
    p=create_pickup(PickupIn(name='Apartments',category='Apartment complex',latitude=13.01,longitude=80.01,max_weight_kg=100,max_volume_m3=1,pending_weight_kg=70,pending_volume_m3=.2),db)
    assert p['status']=='due'
    u=load_update(p['id'],LoadIn(added_weight_kg=31,added_volume_m3=0),db)
    assert u['status']=='critical' and u['current_pending_weight_kg']==101
    assert advance(AdvanceIn(days=1),db)['advanced_days']==1
    db.close()
def test_plan_and_single_execution():
    db=fresh_db(); f=create_facility(FacilityIn(name='Hub',latitude=13,longitude=80),db)
    create_vehicle(f['id'],VehicleIn(name='V1',weight_capacity_kg=1000,volume_capacity_m3=5),db)
    p=create_pickup(PickupIn(name='College',category='College',latitude=13.01,longitude=80.01,max_weight_kg=1000,max_volume_m3=5,pending_weight_kg=800,pending_volume_m3=2),db)
    run=plan(PlanIn(),db); assert run['routes'] and run['metrics']['optimised']['depot_returns']==len(run['routes'])
    assert execute(run['run_id'],db)['status']=='executed'
    assert db.get(PickupPoint,p['id']).pending_weight_kg==0
    db.close()
