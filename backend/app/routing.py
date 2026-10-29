import math
def _xy(point):
    return (point.latitude, point.longitude) if hasattr(point, 'latitude') else point
def haversine(a, b):
    a,b=_xy(a),_xy(b)
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b)); dlat=lat2-lat1; dlon=lon2-lon1
    return 6371*2*math.asin(math.sqrt(math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2))
def distance(a,b): return haversine(a,b)*1.3
def two_opt(stops, depot):
    def score(x): return sum(distance(([depot]+x)[i], (x+[depot])[i]) for i in range(len(x)+1))
    best=stops[:]; improved=True
    while improved:
        improved=False
        for i in range(len(best)-1):
            for j in range(i+2,len(best)+1):
                trial=best[:i]+best[i:j][::-1]+best[j:]
                if score(trial)+1e-8 < score(best): best, improved=trial,True
    return best
