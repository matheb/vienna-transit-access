import { describe, expect, it } from "vitest";
import type { Stop } from "./coverage";
import { getCoverageGrid, getCoveredAreaKm2 } from "./coverageGrid";

const SQUARE_METERS_PER_KM2 = 1e6;
const TEST_CELL_SIZE_METERS = 10;
const MAX_RELATIVE_AREA_ERROR = 0.01;

const makeStop = (id: string, lon: number, lat = 48.2): Stop => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, lat] },
  properties: {
    id, name: id, modes: ["bus"],
    dph: {
      weekday: { am: 10, midday: 10, pm: 10, evening: 10 },
      saturday: { am: 0, midday: 0, pm: 0, evening: 0 },
      sunday: { am: 0, midday: 0, pm: 0, evening: 0 },
    },
  },
});
const getCircleAreaKm2 = (radiusMeters: number) => (Math.PI * radiusMeters * radiusMeters) / SQUARE_METERS_PER_KM2;

describe("getCoverageGrid", () => {
  it("returns no grid and zero area without stops", () => {
    const grid = getCoverageGrid([], 400, TEST_CELL_SIZE_METERS);
    expect(grid).toBeNull();
    expect(getCoveredAreaKm2(grid)).toBe(0);
  });

  it.each([100, 400, 800])("covers about pi r² around a single stop at %i m", (radiusMeters) => {
    const areaKm2 = getCoveredAreaKm2(getCoverageGrid([makeStop("a", 16.3)], radiusMeters, TEST_CELL_SIZE_METERS));
    const circleAreaKm2 = getCircleAreaKm2(radiusMeters);
    expect(Math.abs(areaKm2 - circleAreaKm2) / circleAreaKm2).toBeLessThan(MAX_RELATIVE_AREA_ERROR);
  });

  it("does not double count identical stops", () => {
    const singleStopAreaKm2 = getCoveredAreaKm2(getCoverageGrid([makeStop("a", 16.3)], 400, TEST_CELL_SIZE_METERS));
    const duplicateStopsAreaKm2 = getCoveredAreaKm2(getCoverageGrid([makeStop("a", 16.3), makeStop("b", 16.3)], 400, TEST_CELL_SIZE_METERS));
    expect(duplicateStopsAreaKm2).toBe(singleStopAreaKm2);
  });

  it("adds up the areas of far-apart stops", () => {
    const circleAreaKm2 = getCircleAreaKm2(400);
    const farApartAreaKm2 = getCoveredAreaKm2(getCoverageGrid([makeStop("a", 16.3), makeStop("b", 16.4)], 400, TEST_CELL_SIZE_METERS));
    expect(Math.abs(farApartAreaKm2 - 2 * circleAreaKm2) / (2 * circleAreaKm2)).toBeLessThan(MAX_RELATIVE_AREA_ERROR);
  });

  it("stores radius minus distance, positive inside and negative just outside", () => {
    const grid = getCoverageGrid([makeStop("a", 16.3)], 400, TEST_CELL_SIZE_METERS)!;
    const maxValue = Math.max(...grid.values);
    expect(maxValue).toBeGreaterThan(400 - TEST_CELL_SIZE_METERS);
    expect(maxValue).toBeLessThanOrEqual(400);
    expect(Math.min(...grid.values)).toBeLessThan(0);
  });
});
