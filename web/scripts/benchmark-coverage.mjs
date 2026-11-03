// Times the coverage calculation on the real stops and compares it with the old exact union. Not part of the app.
// Run from web/: node scripts/benchmark-coverage.mjs (Node 24+ strips TypeScript types natively).
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { getUnionCoverage } from "./reference/getUnionCoverage.mjs";

// src/ uses extensionless relative imports (resolved by Next.js and Vitest); let Node try ".ts" for those.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});
const { SELECTABLE_MODES, filterStops } = await import("../src/lib/geo/coverage.ts");
const { getCoverageGrid, getCoveredAreaKm2 } = await import("../src/lib/geo/coverageGrid.ts");
const { getCoveragePolygon } = await import("../src/lib/geo/coveragePolygon.ts");

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STOPS_PATH = join(WEB_ROOT, "public/data/stops.geojson");
const MIN_DEPARTURES_CASES = [4, 20];
const RADIUS_METERS_CASES = [100, 400, 800];
const CELL_SIZE_METERS_CASES = [10, 20, 25, 50];
const WARMUP_RUNS = 1;
const TIMED_RUNS = 3;
// Same as DEFAULT_FILTER_PARAMS in src/app/page.tsx (radius and minimum departures vary per case).
const BASE_FILTER_PARAMS = { day: "weekday", band: "am", modes: [...SELECTABLE_MODES] };

function getMedian(values) {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)];
}

function getTiming(getAreaKm2, warmupRuns = WARMUP_RUNS, timedRuns = TIMED_RUNS) {
  let areaKm2;
  for (let i = 0; i < warmupRuns; i++) areaKm2 = getAreaKm2();
  const durationsMs = [];
  for (let i = 0; i < timedRuns; i++) {
    const startMs = performance.now();
    areaKm2 = getAreaKm2();
    durationsMs.push(performance.now() - startMs);
  }
  return { medianMs: getMedian(durationsMs), areaKm2 };
}

function getGridCoverageAreaKm2(stops, radiusMeters, cellSizeMeters) {
  const grid = getCoverageGrid(stops, radiusMeters, cellSizeMeters);
  getCoveragePolygon(grid); // timed too: the app needs the polygon for the map
  return getCoveredAreaKm2(grid);
}

const allStops = JSON.parse(readFileSync(STOPS_PATH, "utf8")).features;
console.log(`stations loaded: ${allStops.length}`);
const results = [];
for (const minDeparturesPerHour of MIN_DEPARTURES_CASES) {
  for (const radiusMeters of RADIUS_METERS_CASES) {
    const stops = filterStops(allStops, { ...BASE_FILTER_PARAMS, minDeparturesPerHour, radiusMeters });
    // The union is slow and deterministic: one run is enough for its area and a rough time.
    const union = getTiming(() => getUnionCoverage(stops, radiusMeters).areaKm2, 0, 1);
    const row = { minDep: minDeparturesPerHour, radius: radiusMeters, stops: stops.length, unionMs: Math.round(union.medianMs), unionKm2: Number(union.areaKm2.toFixed(2)) };
    for (const cellSizeMeters of CELL_SIZE_METERS_CASES) {
      const grid = getTiming(() => getGridCoverageAreaKm2(stops, radiusMeters, cellSizeMeters));
      const differencePercent = ((grid.areaKm2 - union.areaKm2) / union.areaKm2) * 100;
      row[`${cellSizeMeters}m ms`] = Math.round(grid.medianMs);
      row[`${cellSizeMeters}m diff%`] = Number(differencePercent.toFixed(2));
    }
    results.push(row);
  }
}
console.table(results);
