// Times the coverage calculation on the real stops. Not part of the app.
// Run from web/: node scripts/benchmark-coverage.mjs (Node 24+ strips TypeScript types natively).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { SELECTABLE_MODES, filterStops, getCoverage } from "../src/lib/geo/coverage.ts";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STOPS_PATH = join(WEB_ROOT, "public/data/stops.geojson");
const MIN_DEPARTURES_CASES = [4, 20];
const RADIUS_METERS_CASES = [100, 400, 800];
const WARMUP_RUNS = 1;
const TIMED_RUNS = 3;
// Same as DEFAULT_FILTER_PARAMS in src/app/page.tsx (radius and minimum departures vary per case).
const BASE_FILTER_PARAMS = { day: "weekday", band: "am", modes: [...SELECTABLE_MODES] };

function getMedian(values) {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)];
}

function getTiming(stops, radiusMeters) {
  let coverage;
  for (let i = 0; i < WARMUP_RUNS; i++) coverage = getCoverage(stops, radiusMeters);
  const durationsMs = [];
  for (let i = 0; i < TIMED_RUNS; i++) {
    const startMs = performance.now();
    coverage = getCoverage(stops, radiusMeters);
    durationsMs.push(performance.now() - startMs);
  }
  return { medianMs: getMedian(durationsMs), areaKm2: coverage.areaKm2 };
}

const allStops = JSON.parse(readFileSync(STOPS_PATH, "utf8")).features;
console.log(`stations loaded: ${allStops.length}`);
const results = [];
for (const minDeparturesPerHour of MIN_DEPARTURES_CASES) {
  for (const radiusMeters of RADIUS_METERS_CASES) {
    const stops = filterStops(allStops, { ...BASE_FILTER_PARAMS, minDeparturesPerHour, radiusMeters });
    const { medianMs, areaKm2 } = getTiming(stops, radiusMeters);
    results.push({ minDeparturesPerHour, radiusMeters, stops: stops.length, medianMs: Math.round(medianMs), areaKm2: Number(areaKm2.toFixed(3)) });
  }
}
console.table(results);
