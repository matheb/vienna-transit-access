"""GTFS -> stops.geojson with departures/hour per day type and time band.

Usage: python compute_stops.py <gtfs_dir> <out.geojson> [YYYY-MM-DD]
"""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

BANDS = {"am": (7, 9), "midday": (11, 14), "pm": (16, 19), "evening": (19, 23)}


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


def pick_days(start: date) -> dict:
    def nxt(weekday):
        return start + timedelta(days=(weekday - start.weekday()) % 7)
    return {"weekday": nxt(1), "saturday": nxt(5), "sunday": nxt(6)}


def compute(gtfs_dir, days: dict) -> dict:
    d = Path(gtfs_dir)

    def read(name):
        f = d / f"{name}.txt"
        return pd.read_csv(f, dtype=str) if f.exists() else None

    stops, st, trips, routes = read("stops"), read("stop_times"), read("trips"), read("routes")
    cal, cd = read("calendar"), read("calendar_dates")

    if "parent_station" not in stops:
        stops["parent_station"] = None
    has_parent = stops.parent_station.notna() & (stops.parent_station != "")
    stops["group"] = stops.parent_station.where(has_parent, stops.stop_id)
    stops["lat"], stops["lon"] = stops.stop_lat.astype(float), stops.stop_lon.astype(float)

    st = st.merge(trips[["trip_id", "route_id", "service_id"]], on="trip_id")
    st = st.merge(routes[["route_id", "route_type"]], on="route_id")
    st = st.merge(stops[["stop_id", "group", "stop_name", "lat", "lon"]], on="stop_id")
    st["seq"] = st.stop_sequence.astype(int)
    st["sec"] = st.departure_time.map(to_seconds)
    all_st = st
    st = st[st.seq < st.groupby("trip_id").seq.transform("max")]  # last stop has no departure

    dph = {}
    for label, day in days.items():
        s = st[st.service_id.isin(active_services(cal, cd, day))]
        for band, (a, b) in BANDS.items():
            counts = s[(s.sec >= a * 3600) & (s.sec < b * 3600)].groupby("group").size() / (b - a)
            for gid, v in counts.items():
                dph.setdefault(gid, {}).setdefault(label, {})[band] = round(float(v), 1)

    g = all_st.groupby("group").agg(
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


if __name__ == "__main__":
    gtfs_dir, out = sys.argv[1], sys.argv[2]
    start = date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else date.today()
    Path(out).write_text(json.dumps(compute(gtfs_dir, pick_days(start)), separators=(",", ":")))
