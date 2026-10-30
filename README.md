# Vienna transit accessibility

Which parts of Vienna are within walking distance of frequent public transport?
Data: Wiener Linien GTFS (data.gv.at, check licence/attribution). Map: MapLibre + Carto basemap.

## 1. Data pipeline
```bash
cd pipeline && pip install -r requirements.txt
python -m pytest
unzip wl_gtfs.zip -d gtfs            # download the GTFS zip from data.gv.at first
python compute_stops.py gtfs ../web/public/data/stops.geojson 2026-11-03
```
Day types use one representative date each (next Tue/Sat/Sun on or after the given date, so it must lie inside the feed's validity).
Departures/hour = departures in the band / band length; terminal stops are excluded; stops are grouped by `parent_station`.

## 2. Web app
```bash
npx create-next-app@latest web-new --ts --tailwind --app --src-dir --eslint
cd web-new
npx shadcn@latest init
npx shadcn@latest add card slider toggle-group
npm i maplibre-gl react-map-gl @turf/buffer @turf/union @turf/area @turf/helpers
npm i -D vitest @types/geojson
```
Then copy `web/src/*` and `web/public/data/` over the generated project, and add `"test": "vitest run"` to scripts.

## Known simplifications
- Straight-line buffers, not street-network walking distance.
- Coverage % divides by Vienna's area; buffers extending past the border inflate it slightly.
- Union of thousands of buffers runs on the main thread (fine to start; later: Web Worker or precomputed hex grid).
