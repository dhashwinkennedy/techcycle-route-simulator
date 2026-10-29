"""Deterministic, fictional Chennai demonstration data. Safe to run repeatedly."""
from datetime import datetime, timedelta, timezone
from app.database import Base, SessionLocal, engine
from app.models import AppState, Facility, Vehicle, PickupPoint, LoadUpdate
from app.services import DEFAULT_SETTINGS

FACILITIES=[('Simulated North Chennai Recovery Hub',13.1105,80.2542),('Simulated Guindy Circular Hub',13.0108,80.2206),('Simulated Sholinganallur Recovery Hub',12.9012,80.2279)]
# name, category, coordinate, max kg/m3, pending kg/m3, wait days, loading minutes
POINTS=[
('Simulated Anna Nagar Community','Residential community',13.086,80.210,900,4.5,630,1.7,2,18),('Simulated Mogappair Apartments','Apartment complex',13.079,80.175,700,3.5,570,1.9,6.1,16),('Simulated Kilpauk Residents','Residential area or colony',13.083,80.241,800,4,390,3.25,1,17),('Simulated Perambur Over-capacity','Residential community',13.113,80.233,1000,5,1060,3.8,3,20),('Simulated Velachery Apartments','Apartment complex',12.981,80.219,900,4.5,400,3.7,5.9,18),('Simulated Adyar Residents','Residential area or colony',13.006,80.258,750,3.8,260,1,0.5,15),('Simulated Tambaram Community','Residential community',12.924,80.127,1000,5,720,2.6,7.2,22),('Simulated Thoraipakkam Apartments','Apartment complex',12.944,80.238,850,4.2,330,3.45,6,17),('Simulated Ambattur Residents','Residential area or colony',13.114,80.154,950,4.8,285,1.2,2,19),('Simulated Nungambakkam College','College',13.061,80.241,700,3.5,480,1.3,4,25),('Simulated Guindy Technical College','College',13.007,80.218,800,4,650,2,6.5,28),('Simulated OMR Engineering Institute','College',12.934,80.229,900,4.5,350,3.8,1,27),('Simulated Egmore School','School',13.073,80.261,400,2,90,.35,2,14),('Simulated Madipakkam School','School',12.964,80.198,450,2.2,320,.8,6.2,16),('Simulated Teynampet Hospital','Hospital',13.042,80.250,750,3.8,610,2.9,7.1,25),('Simulated Porur Hospital','Hospital',13.036,80.159,800,4,290,1.1,3,22),('Simulated T Nagar IT Shop','Business or IT shop',13.041,80.234,1000,5,840,1.4,5,20),('Simulated Ambattur Electronics Shop','Business or IT shop',13.098,80.165,1100,5.5,980,2.1,6.8,23),('Simulated OMR Device Outlet','Business or IT shop',12.922,80.234,950,4.8,240,3.9,2,18),('Simulated Nandanam Office Park','Office',13.031,80.244,850,4.2,520,1.7,6.1,24),('Simulated Guindy Office Cluster','Office',13.014,80.208,1000,5,790,2.4,3,26),('Simulated Siruseri Office Campus','Office',12.823,80.225,1200,6,900,3.1,5.5,30),('Simulated Mylapore Institution','Other institution',13.034,80.267,600,3,420,1.2,4,19),('Simulated Chromepet Training Centre','Other institution',12.950,80.143,650,3.2,150,2.5,.5,17)]
def seed(reset=False):
 Base.metadata.create_all(engine);db=SessionLocal()
 try:
  if db.query(Facility).first() and not reset:return {'created':False,'reason':'database already contains data'}
  if reset: Base.metadata.drop_all(engine);Base.metadata.create_all(engine)
  now=datetime.now(timezone.utc);db.add(AppState(id=1,simulation_time=now,settings=DEFAULT_SETTINGS.copy()));fs=[]
  for n,lat,lon in FACILITIES: f=Facility(name=n,latitude=lat,longitude=lon,address='Fictional simulated depot',active=True);db.add(f);fs.append(f)
  db.flush()
  for i in range(3):db.add(Vehicle(facility_id=fs[0].id,name=f'SIM-NORTH-DIESEL-{i+1}',weight_capacity_kg=1000,volume_capacity_m3=5,fuel_type='diesel',status='available'))
  for f,name,w,v in [(fs[1],'SIM-GUINDY-DIESEL-1',1200,6),(fs[1],'SIM-GUINDY-ELECTRIC-1',900,4.5),(fs[2],'SIM-OMR-DIESEL-1',1100,5.5),(fs[2],'SIM-OMR-ELECTRIC-1',800,4)]:db.add(Vehicle(facility_id=f.id,name=name,weight_capacity_kg=w,volume_capacity_m3=v,fuel_type='electric' if 'ELECTRIC' in name else 'diesel',status='available'))
  for n,c,lat,lon,mw,mv,pw,pv,wait,service in POINTS:
   start=now-timedelta(days=wait);p=PickupPoint(name=n,category=c,latitude=lat,longitude=lon,max_weight_kg=mw,max_volume_m3=mv,pending_weight_kg=pw,pending_volume_m3=pv,service_minutes=service,active=True,request_started_at=start,last_completed_at=start);db.add(p);db.flush();db.add(LoadUpdate(pickup_point_id=p.id,weight_kg=round(pw*.8,2),volume_m3=round(pv*.8,3),description='Synthetic initial accumulation'));db.add(LoadUpdate(pickup_point_id=p.id,weight_kg=round(pw*.2,2),volume_m3=round(pv*.2,3),description='Synthetic later top-up'))
  db.commit();return {'created':True,'facilities':3,'vehicles':7,'pickup_points':len(POINTS)}
 finally:db.close()
if __name__=='__main__':print(seed())
