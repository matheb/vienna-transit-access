# Vienna transit accessibility

[![CI](https://github.com/matheb/vienna-transit-access/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/matheb/vienna-transit-access/actions/workflows/ci.yml)

Which parts of Vienna are within walking distance of frequent public transport?
Data: Wiener Linien GTFS (see [Data and attribution](#data-and-attribution)). Map: MapLibre + CARTO basemap.

## 1. Data pipeline
Download the GTFS zip from the data.gv.at dataset "Wiener Linien – Fahrplandaten GTFS Wien" (published by Stadt Wien) and save it as `pipeline/gtfs.zip`, then regenerate the stop data from `pipeline/`:
```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m pytest
unzip gtfs.zip -d gtfs                              # or on Windows: Expand-Archive gtfs.zip -DestinationPath gtfs
.venv\Scripts\python compute_stops.py gtfs ../web/public/data/stops.geojson --weekday 2026-09-08 --saturday 2026-09-12 --sunday 2026-09-13
```
Each day type uses the one date given, which must lie inside the feed's validity. Optional: `--bbox MINLON,MINLAT,MAXLON,MAXLAT|none` (default: the Vienna rectangle) and `--chunksize N`.
Departures/hour = departures in the band / band length; terminal stops are excluded; stops are grouped into stations by the `at:X:Y` prefix of the stop id (or by `parent_station` when the feed has one).

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

## Data and attribution
- Timetable data: Wiener Linien GTFS, published as open data by the City of Vienna.
  Datenquelle: Stadt Wien – data.wien.gv.at
- Licence: CC BY (Wiener Linien publish all their open data under CC BY). The app shows this credit in the side panel.
- Basemap: © CARTO, © OpenStreetMap contributors (credited on the map itself).

## Limitations
- Wiener Linien only: no ÖBB S-Bahn or regional rail.
- Departures come from one representative weekday (2026-09-08), Saturday (2026-09-12) and Sunday (2026-09-13). If the data is regenerated with other dates, update the dates listed here.
- A station's departures are summed over all its platforms and both directions.
- Coverage uses straight-line distance, not walking routes.
- The covered-area share is relative to Vienna's area and approximate (25 m grid).
- The Vienna filter is a rectangle, so it also includes some neighbouring towns.

## Known simplifications
- Union of thousands of buffers runs on the main thread (fine to start; later: Web Worker or precomputed hex grid).
