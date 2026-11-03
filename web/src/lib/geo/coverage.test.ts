import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getUnionCoverage } from "../../../scripts/reference/getUnionCoverage.mjs";
import { SELECTABLE_MODES, filterStops, getCoverage, type FilterParams, type Stop } from "./coverage";

const REAL_STOPS_PATH = path.resolve(__dirname, "../../../public/data/stops.geojson");
// Largest difference measured with scripts/benchmark-coverage.mjs at 25 m cells was 0.73 %.
const MAX_RELATIVE_AREA_DIFFERENCE = 0.02;
const UNION_REFERENCE_TIMEOUT_MS = 30_000; // the old exact union takes about 0.5–3.5 s for these cases

const makeStop = (id: string, lon: number, dph: number, modes: Stop["properties"]["modes"] = ["bus"]): Stop => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, 48.2] },
  properties: {
    id, name: id, modes,
    dph: { weekday: { am: dph, midday: dph, pm: dph, evening: dph }, saturday: { am: 0, midday: 0, pm: 0, evening: 0 }, sunday: { am: 0, midday: 0, pm: 0, evening: 0 } },
  },
});
const filterParams: FilterParams = { day: "weekday", band: "am", minDeparturesPerHour: 4, radiusMeters: 400, modes: ["bus", "tram"] };

describe("filterStops", () => {
  it("keeps only stops meeting frequency and mode filters", () => {
    const stops = [makeStop("a", 16.3, 6), makeStop("b", 16.31, 2), makeStop("c", 16.32, 8, ["rail"])];
    expect(filterStops(stops, filterParams).map((stop) => stop.properties.id)).toEqual(["a"]);
  });
});

describe("getCoverage", () => {
  it("is empty without stops", () => expect(getCoverage([], 400).areaKm2).toBe(0));
  it("does not double count overlapping buffers", () => {
    const singleStopArea = getCoverage([makeStop("a", 16.3, 6)], 400).areaKm2;
    const overlappingStopsArea = getCoverage([makeStop("a", 16.3, 6), makeStop("b", 16.3001, 6)], 400).areaKm2;
    expect(overlappingStopsArea).toBeLessThan(singleStopArea * 1.1);
  });
});

describe("getCoverage on the real stops", () => {
  const allStops: Stop[] = JSON.parse(readFileSync(REAL_STOPS_PATH, "utf8")).features;
  // Two representative cases keep npm test fast; scripts/benchmark-coverage.mjs compares the full table.
  const cases = [
    { minDeparturesPerHour: 4, radiusMeters: 400 },
    { minDeparturesPerHour: 20, radiusMeters: 100 },
  ];

  it.each(cases)(
    "stays within 2 % of the exact union area at $minDeparturesPerHour departures/h and $radiusMeters m",
    ({ minDeparturesPerHour, radiusMeters }) => {
      const stops = filterStops(allStops, { day: "weekday", band: "am", modes: [...SELECTABLE_MODES], minDeparturesPerHour, radiusMeters });
      const gridAreaKm2 = getCoverage(stops, radiusMeters).areaKm2;
      const unionAreaKm2 = getUnionCoverage(stops, radiusMeters).areaKm2;
      expect(Math.abs(gridAreaKm2 - unionAreaKm2) / unionAreaKm2).toBeLessThan(MAX_RELATIVE_AREA_DIFFERENCE);
    },
    UNION_REFERENCE_TIMEOUT_MS,
  );
});
