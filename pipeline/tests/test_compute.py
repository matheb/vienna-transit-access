from datetime import date

from compute_stops import VIENNA_BBOX, compute, to_seconds

TUE = date(2026, 11, 3)  # a Tuesday
DAYS = {"weekday": TUE}
ST_HEADER = "trip_id,departure_time,stop_sequence,stop_id"


def write(path, name, header, rows):
    (path / f"{name}.txt").write_text("\n".join([header, *rows]) + "\n")


def make_feed(path, times, removed_on=None):
    write(path, "stops", "stop_id,stop_name,stop_lat,stop_lon", ["S1,Alpha,48.2,16.3", "S2,Beta,48.21,16.31"])
    write(path, "routes", "route_id,route_type", ["R1,0"])
    write(path, "trips", "trip_id,route_id,service_id", [f"T{i},R1,WK" for i in range(len(times))])
    write(path, "calendar", "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
          ["WK,1,1,1,1,1,0,0,20260101,20261231"])
    rows = []
    for i, t in enumerate(times):
        rows += [f"T{i},{t},1,S1", f"T{i},{t},2,S2"]
    write(path, "stop_times", "trip_id,departure_time,stop_sequence,stop_id", rows)
    if removed_on:
        write(path, "calendar_dates", "service_id,date,exception_type", [f"WK,{removed_on},2"])


def props(fc):
    return {f["properties"]["id"]: f["properties"] for f in fc["features"]}


def test_departures_per_hour(tmp_path):
    make_feed(tmp_path, ["07:10:00", "07:40:00", "08:20:00"])
    p = props(compute(tmp_path, DAYS))
    assert p["S1"]["dph"]["weekday"]["am"] == 1.5  # 3 departures / 2 h
    assert p["S1"]["modes"] == ["tram"]


def test_last_stop_has_no_departures(tmp_path):
    make_feed(tmp_path, ["07:10:00"])
    assert props(compute(tmp_path, DAYS))["S2"]["dph"]["weekday"]["am"] == 0


def test_times_past_midnight_do_not_crash_or_count(tmp_path):
    make_feed(tmp_path, ["25:10:00"])
    assert to_seconds("25:10:00") == 90600
    assert sum(props(compute(tmp_path, DAYS))["S1"]["dph"]["weekday"].values()) == 0


def test_calendar_dates_removal(tmp_path):
    make_feed(tmp_path, ["07:10:00"], removed_on="20261103")
    assert props(compute(tmp_path, DAYS))["S1"]["dph"]["weekday"]["am"] == 0


def test_platforms_grouped_into_station(tmp_path):
    make_feed(tmp_path, ["07:10:00", "07:40:00"])
    write(tmp_path, "stops", "stop_id,stop_name,stop_lat,stop_lon",
          ["at:43:3121:0:1,Alpha,48.2,16.3", "at:43:3121:0:2,Alpha,48.2002,16.3002", "S2,Beta,48.21,16.31"])
    write(tmp_path, "stop_times", ST_HEADER, ["T0,07:10:00,1,at:43:3121:0:1", "T0,07:20:00,2,S2",
                                               "T1,07:40:00,1,at:43:3121:0:2", "T1,07:50:00,2,S2"])
    p = props(compute(tmp_path, DAYS))
    assert sorted(p) == ["S2", "at:43:3121"]
    assert p["at:43:3121"]["dph"]["weekday"]["am"] == 1.0


def test_parent_station_takes_precedence(tmp_path):
    make_feed(tmp_path, ["07:10:00"])
    write(tmp_path, "stops", "stop_id,stop_name,stop_lat,stop_lon,parent_station",
          ["S1,Alpha,48.2,16.3,P1", "S2,Beta,48.21,16.31,"])
    assert sorted(props(compute(tmp_path, DAYS))) == ["P1", "S2"]


def test_no_pickup_departures_skipped(tmp_path):
    make_feed(tmp_path, ["07:10:00", "07:40:00"])
    write(tmp_path, "stop_times", ST_HEADER + ",pickup_type",
          ["T0,07:10:00,1,S1,0", "T0,07:20:00,2,S2,1", "T1,07:40:00,1,S1,1", "T1,07:50:00,2,S2,"])
    assert props(compute(tmp_path, DAYS))["S1"]["dph"]["weekday"]["am"] == 0.5


def test_chunked_equals_unchunked(tmp_path):
    make_feed(tmp_path, ["07:10:00", "07:40:00", "12:00:00", "25:10:00"])
    days = {"weekday": TUE, "saturday": date(2026, 11, 7)}
    assert compute(tmp_path, days, chunksize=1) == compute(tmp_path, days)


def test_bbox_drops_outside_stops_without_shifting_terminal(tmp_path):
    make_feed(tmp_path, ["07:10:00"])
    write(tmp_path, "stops", "stop_id,stop_name,stop_lat,stop_lon",
          ["S1,Alpha,48.2,16.3", "S2,Beta,48.21,16.31", "B1,Baden,48.0,16.23"])
    write(tmp_path, "stop_times", ST_HEADER, ["T0,07:10:00,1,S1", "T0,07:20:00,2,S2", "T0,07:50:00,3,B1"])
    p = props(compute(tmp_path, DAYS, bbox=VIENNA_BBOX))
    assert sorted(p) == ["S1", "S2"]
    assert p["S2"]["dph"]["weekday"]["am"] == 0.5  # still a departure, not a terminal
