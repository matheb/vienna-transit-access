"""GTFS -> stops.geojson with departures/hour per day type and time band.

Usage: python compute_stops.py <gtfs_dir> <out.geojson> --weekday YYYY-MM-DD
       --saturday YYYY-MM-DD --sunday YYYY-MM-DD [--bbox MINLON,MINLAT,MAXLON,MAXLAT|none] [--chunksize N]
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

import pandas as pd

BANDS = {"am": (7, 9), "midday": (11, 14), "pm": (16, 19), "evening": (19, 23)}
VIENNA_BBOX = (16.18, 48.11, 16.58, 48.33)  # rectangle; also covers some adjacent suburbs
ST_COLS = {"trip_id", "departure_time", "stop_id", "stop_sequence", "pickup_type"}
STATION_RE = re.compile(r"^(at:[^:]+:[^:]+)(?::|$)")  # "at:43:3121:0:1" -> "at:43:3121"


def station_of(stop_id: str) -> str:
    m = STATION_RE.match(stop_id)
    return m.group(1) if m else stop_id


def to_seconds(t: str) -> int:
    """GTFS times can exceed 24:00:00 (e.g. 25:10:00 = 01:10 next day)."""
    h, m, s = (int(x) for x in t.strip().split(":"))
    return h * 3600 + m * 60 + s


def mode_of(route_type) -> str:
    rt = int(route_type)
    if rt == 0 or 900 <= rt < 1000:
        return "tram"
    if rt == 1 or 400 <= rt < 500:
        return "metro"
    if rt == 2 or 100 <= rt < 200:
        return "rail"
    if rt == 3 or 700 <= rt < 800:
        return "bus"
    return "other"


def active_services(calendar, calendar_dates, day: date) -> set:
    ymd = day.strftime("%Y%m%d")
    active = set()
    if calendar is not None:
        wd = day.strftime("%A").lower()
        c = calendar[(calendar.start_date <= ymd) & (calendar.end_date >= ymd) & (calendar[wd] == "1")]
        active = set(c.service_id)
    if calendar_dates is not None:
        cd = calendar_dates[calendar_dates.date == ymd]
        active |= set(cd[cd.exception_type == "1"].service_id)
        active -= set(cd[cd.exception_type == "2"].service_id)
    return active


def read_stop_times(path, trips, stops, chunksize=None):
    """Departures of active trips as compact int columns, plus distinct (stop, route_type) of all trips.

    trip/stop are row positions in `trips`/`stops`. chunksize=None reads the file in one go."""
    trip_idx = pd.Series(trips.index, index=trips.trip_id)
    stop_idx = pd.Series(stops.index, index=stops.stop_id)
    reader = pd.read_csv(path, dtype=str, usecols=lambda c: c in ST_COLS, chunksize=chunksize)
    rows, served = [], []
    for c in [reader] if chunksize is None else reader:
        c = c.assign(trip=c.trip_id.map(trip_idx), stop=c.stop_id.map(stop_idx)).dropna(subset=["trip", "stop"])
        c = c.astype({"trip": "int32", "stop": "int32"})
        served.append(pd.DataFrame({"stop": c.stop.values,
                                    "route_type": trips.route_type.values[c.trip.values]}).drop_duplicates())
        c = c[trips.active.values[c.trip.values]]
        rows.append(pd.DataFrame({
            "trip": c.trip, "stop": c.stop,
            "seq": c.stop_sequence.astype("int32"),
            "sec": c.departure_time.map(to_seconds).astype("int32"),
            "pickup": c.pickup_type.fillna("0").astype("int8") if "pickup_type" in c else 0,
        }))
    return pd.concat(rows, ignore_index=True), pd.concat(served).drop_duplicates()


def compute(gtfs_dir, days: dict, bbox=None, chunksize=None) -> dict:
    d = Path(gtfs_dir)

    def read(name, cols=None):
        f = d / f"{name}.txt"
        return pd.read_csv(f, dtype=str, usecols=cols and (lambda c: c in cols)) if f.exists() else None

    stops, routes = read("stops"), read("routes", {"route_id", "route_type"})
    cal, cd = read("calendar"), read("calendar_dates")
    active = {label: active_services(cal, cd, day) for label, day in days.items()}
    for label, s in active.items():
        if not s:
            print(f"warning: no active services on {label} {days[label]}", file=sys.stderr)
    trips = read("trips", {"trip_id", "route_id", "service_id"}).merge(routes, on="route_id")
    trips["active"] = trips.service_id.isin(set().union(*active.values()))

    if "parent_station" not in stops:
        stops["parent_station"] = None
    has_parent = stops.parent_station.notna() & (stops.parent_station != "")
    stops["group"] = stops.parent_station.where(has_parent, stops.stop_id.map(station_of))
    stops["lat"], stops["lon"] = stops.stop_lat.astype(float), stops.stop_lon.astype(float)

    st, served = read_stop_times(d / "stop_times.txt", trips, stops, chunksize)
    st = st.join(trips.service_id, on="trip").join(stops.group, on="stop")
    last = st.seq == st.groupby("trip").seq.transform("max")  # last stop has no departure
    st = st[~last & (st.pickup != 1)]  # before bbox, so trips leaving the box keep their last inside stop
    if bbox is not None:
        minlon, minlat, maxlon, maxlat = bbox
        stops = stops[stops.lon.between(minlon, maxlon) & stops.lat.between(minlat, maxlat)]
        st, served = st[st.stop.isin(stops.index)], served[served.stop.isin(stops.index)]

    dph = {}
    for label, day in days.items():
        s = st[st.service_id.isin(active[label])]
        for band, (a, b) in BANDS.items():
            counts = s[(s.sec >= a * 3600) & (s.sec < b * 3600)].groupby("group").size() / (b - a)
            for gid, v in counts.items():
                dph.setdefault(gid, {}).setdefault(label, {})[band] = round(float(v), 1)

    g = served.join(stops[["group", "stop_name", "lat", "lon"]], on="stop").groupby("group").agg(
        name=("stop_name", "first"), lat=("lat", "mean"), lon=("lon", "mean"),
        modes=("route_type", lambda x: sorted({mode_of(r) for r in x})),
    )
    features = []
    for gid, row in g.iterrows():
        props_dph = {lbl: {b: dph.get(gid, {}).get(lbl, {}).get(b, 0.0) for b in BANDS} for lbl in days}
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(row.lon, 6), round(row.lat, 6)]},
            "properties": {"id": gid, "name": row["name"], "modes": row["modes"], "dph": props_dph},
        })
    return {"type": "FeatureCollection", "features": features}


def parse_bbox(s: str):
    return None if s.lower() == "none" else tuple(float(x) for x in s.split(","))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("gtfs_dir")
    ap.add_argument("out")
    for label in ("weekday", "saturday", "sunday"):
        ap.add_argument(f"--{label}", type=date.fromisoformat, required=True)
    ap.add_argument("--bbox", type=parse_bbox, default=VIENNA_BBOX, help="minlon,minlat,maxlon,maxlat or 'none'")
    ap.add_argument("--chunksize", type=int, default=500_000)
    a = ap.parse_args()
    days = {"weekday": a.weekday, "saturday": a.saturday, "sunday": a.sunday}
    fc = compute(a.gtfs_dir, days, a.bbox, a.chunksize)
    Path(a.out).write_text(json.dumps(fc, separators=(",", ":")))
    frequent = sum(f["properties"]["dph"]["weekday"]["am"] >= 4 for f in fc["features"])
    print(f"{len(fc['features'])} stations written; {frequent} with weekday am >= 4 departures/hour")
