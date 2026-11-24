# Vienna transit accessibility

Live demo: https://vienna-transit-access.vercel.app/en

[![CI](https://github.com/matheb/vienna-transit-access/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/matheb/vienna-transit-access/actions/workflows/ci.yml)

Which parts of Vienna are within walking distance of frequent public transport?
The app shows the Wiener Linien stops that reach a chosen number of departures per hour, and the area within a chosen
straight-line distance of them, for a chosen day type and time of day.

The app is available in English (`/en`) and German (`/de`); a link next to the title switches between them, and `/`
redirects to the English page.

Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, MapLibre, Python (pandas), Vitest and Playwright.

## Features and controls

| Control | Options or range | Default |
|---|---|---|
| Day type | weekday, saturday, sunday | weekday |
| Time of day | am (07–09), midday (11–14), pm (16–19), evening (19–23) | am |
| Transport modes | tram, metro, rail, bus (several can be selected) | all with stops |
| Min. departures/hour | 0–20, step 1 | 4 |
| Walking radius | 100–800 m, step 50 m | 400 m |

A stop qualifies when its departures per hour for the selected day type and time of day reach the minimum and it serves
at least one selected mode. The results card shows how many stops qualify and the covered area in km² with its
approximate share of Vienna. The map shows the qualifying stops and the covered area.

A transport mode with no stops in the data is shown disabled, with a short note under the toggles. In the Wiener Linien
feed this is rail; it would turn on by itself if the data contained rail stops.

On screens narrower than 768 px the map is on top at 55 % of the screen height and the controls scroll below it; from
768 px the controls and the map are side by side.

## How it works

1. **Pipeline** (`pipeline/compute_stops.py`, Python and pandas) reads the Wiener Linien GTFS feed and writes
   `web/public/data/stops.geojson`.
   - One representative date per day type: weekday 2026-09-08, Saturday 2026-09-12, Sunday 2026-09-13.
   - Departures per hour = departures in the time band ÷ band length in hours. A trip's last stop and stops without
     boarding (`pickup_type=1`) are not counted.
   - Platforms are grouped into stations by `parent_station`, or by the `at:X:Y` prefix of the stop id when the feed
     has none. A station's departures are summed over all its platforms and both directions.
   - Modes come from the GTFS route type (tram, metro, rail, bus, other; "other" is not offered in the app).
   - Only stops inside a rectangle around Vienna (16.18–16.58 °E, 48.11–48.33 °N) are kept.
2. **Web app** (`web/`, Next.js and MapLibre) loads the stops, filters them in the browser and computes the covered
   area on a 25 m grid in local metres. The area is the number of covered cells; the outline on the map is traced from
   the same grid. The share of Vienna is the covered area divided by 414.9 km², capped at 100 %.

## Limitations

- Wiener Linien only: no ÖBB S-Bahn or regional rail, so the rail toggle is disabled.
- Distance is a straight line from the station, not a walking route.
- Stops are filtered by a rectangle, not the city boundary, so some neighbouring towns are included; the share is
  still computed against Vienna's 414.9 km².
- Departures come from one date per day type. The published data uses these dates.
- A station's departures are summed over all its platforms and both directions.
- The covered area is approximate (25 m grid; within about 1 % of an exact union of circles on the current data).

## Data and attribution

- Timetable data: Wiener Linien GTFS, published by Stadt Wien on data.gv.at as "Wiener Linien – Fahrplandaten GTFS
  Wien", licence CC BY.
- Credit shown in the app: "Timetable data: Wiener Linien (GTFS). Datenquelle: Stadt Wien – data.wien.gv.at, CC BY"
- Basemap: © CARTO, © OpenStreetMap contributors, credited on the map itself.

## Run locally

Requirements: Python 3.14 and Node.js 24 (the versions CI uses).

### Pipeline (PowerShell, in `pipeline/`)

Download the GTFS zip from the data.gv.at dataset "Wiener Linien – Fahrplandaten GTFS Wien" and save it as
`pipeline/gtfs.zip`. Then:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m pytest
Expand-Archive gtfs.zip -DestinationPath gtfs
.venv\Scripts\python compute_stops.py gtfs ../web/public/data/stops.geojson --weekday 2026-09-08 --saturday 2026-09-12 --sunday 2026-09-13
```

Each date must lie inside the feed's validity period. Optional: `--bbox MINLON,MINLAT,MAXLON,MAXLAT` or `--bbox none`
(default: the Vienna rectangle), and `--chunksize N` (default 500000).

### Web app (in `web/`)

```powershell
npm ci
npm run dev
```

Then open http://localhost:3000. `npm run build` followed by `npm run start` runs the production build.

## Tests and CI

Pipeline: `.venv\Scripts\python -m pytest` in `pipeline/`.

Web, in `web/`:

| Command | What it does |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | End-to-end and accessibility tests (Playwright, Chromium) against a production build on port 3100 |

`web/e2e/mobile.spec.ts` runs at a 390x844 viewport and checks that the map gets at least half of the screen height,
that the page does not scroll sideways, and that axe finds no WCAG 2.0 or 2.1 level A or AA violations.

Before the first e2e run, install the browser: `npx playwright install chromium`.

CI (`.github/workflows/ci.yml`) runs on pull requests and pushes to `main`, in three jobs:

- `pipeline`: installs the requirements and runs pytest.
- `web`: `npm ci --ignore-scripts`, then test, typecheck, lint and build.
- `e2e`: installs Chromium, then runs `npm run test:e2e`.

## Accessibility

Automated checks (`web/e2e/accessibility.spec.ts`, run in CI):

- axe finds no WCAG 2.0 or 2.1 level A or AA violations on the loaded page.
- Tab reaches the language switch, the toggle groups, both sliders and the data link in order. In each toggle group, the Left and Right
  arrow keys, Home and End move focus without pressing a toggle. Space presses a day toggle and Enter presses a
  time-of-day toggle. The Left and Right arrow keys change both sliders.
- The toggle groups have accessible names. Slider names do not include the value, and the radius is spoken with its
  unit (for example "400 m").
- Every Tab stop shows a focus indicator with at least 3:1 contrast against its background, in the light and the dark
  theme. The dark theme is tested by adding the `dark` class; the app has no theme switch yet.

Result changes are announced to screen readers through the page's one status element. After a change of day type,
time of day, modes, minimum departures or walking radius, one sentence with the qualifying stops, the covered area and
the share of Vienna is announced once the result has stopped changing for 750 ms, so a dragged slider or a held arrow
key gives one announcement. The first results after loading are not announced; a loading error is announced separately
as an alert. `web/e2e/resultsAnnouncement.spec.ts` checks this in English and German.

On phones the map is shown first but comes last in the Tab order, after the data link. The map canvas is a region
named by our own label ("Map of qualifying stops and covered area" / "Karte der qualifizierenden Haltestellen und der
abgedeckten Fläche"), not by MapLibre's default; it has no text description of what the map shows yet.

Still open (manual checks):

- A screen-reader pass.
- Focus order including the map controls.
- Contrast of the map attribution box in the dark theme.
- A text description of what the map shows (the canvas is named, but its content is not described).

Automated tools find only part of all accessibility problems, so this is not a claim of full WCAG conformance.

## Roadmap

Planned work and priorities: [docs/ROADMAP.md](docs/ROADMAP.md).
