from datetime import timedelta
from .models import AppState
DEFAULT_SETTINGS={'weight_safety_margin':.10,'volume_safety_margin':.15,'due_threshold':.70,'urgent_threshold':.80,'critical_threshold':1.0,'mandatory_wait_days':7,'opportunistic_detour_km':3,'working_minutes_per_day':480,'fuel_l_per_km':.22,'fuel_price_per_l':100,'co2_kg_per_l':2.68}
RESIDENTIAL={'Residential community','Apartment complex','Residential area or colony'}
def state(db):
    x=db.get(AppState,1)
    if not x: x=AppState(id=1,settings=DEFAULT_SETTINGS.copy()); db.add(x); db.commit(); db.refresh(x)
    return x
def pickup_data(p, clock, settings):
    anchor=p.last_completed_at if p.category in RESIDENTIAL else p.request_started_at
    wait=(clock-anchor).total_seconds()/86400 if anchor and p.pending_weight_kg+p.pending_volume_m3>0 else 0
    wu=100*p.pending_weight_kg/p.max_weight_kg; vu=100*p.pending_volume_m3/p.max_volume_m3
    reasons=[]
    if wu>=100 or vu>=100: reasons.append('critical_capacity')
    if wait>=settings['mandatory_wait_days']: reasons.append('mandatory_wait')
    if wu>=settings['urgent_threshold']*100 or vu>=settings['urgent_threshold']*100 or wait>=settings['mandatory_wait_days']*.8: reasons.append('urgent')
    if wu>=settings['due_threshold']*100 or vu>=settings['due_threshold']*100: reasons.append('due')
    status='critical' if any(x in reasons for x in ['critical_capacity','mandatory_wait']) else ('urgent' if 'urgent' in reasons else ('due' if 'due' in reasons else 'normal'))
    return {'id':p.id,'name':p.name,'category':p.category,'latitude':p.latitude,'longitude':p.longitude,'address':p.address,'notes':p.notes,'maximum_safe_weight_kg':p.max_weight_kg,'maximum_safe_volume_m3':p.max_volume_m3,'current_pending_weight_kg':p.pending_weight_kg,'current_pending_volume_m3':p.pending_volume_m3,'service_minutes':p.service_minutes,'active':p.active,'weight_utilisation_percent':round(wu,2),'volume_utilisation_percent':round(vu,2),'waiting_days':round(wait,3),'status':status,'reasons':reasons,'created_at':p.created_at,'updated_at':p.updated_at}
