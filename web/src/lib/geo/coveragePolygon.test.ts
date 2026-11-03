import area from "@turf/area";
import { describe, expect, it } from "vitest";
import type { Stop } from "./coverage";
import { getCoverageGrid } from "./coverageGrid";
import { getCoveragePolygon } from "./coveragePolygon";

const SQUARE_METERS_PER_KM2 = 1e6;
const TEST_CELL_SIZE_METERS = 20;
const MAX_RELATIVE_AREA_ERROR = 0.01;
const STOP_LON = 16.3;
const STOP_LAT = 48.2;
const METERS_PER_DEGREE_LAT = 111_195;

const makeStop = (id: string, lon: number, lat = STOP_LAT): Stop => ({
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

describe("getCoveragePolygon", () => {
  it("returns null without a grid", () => expect(getCoveragePolygon(null)).toBeNull());

  it.each([100, 400, 800])("traces a circle of about pi r² around a single stop at %i m", (radiusMeters) => {
    const polygon = getCoveragePolygon(getCoverageGrid([makeStop("a", STOP_LON)], radiusMeters, TEST_CELL_SIZE_METERS))!;
    const areaKm2 = area(polygon) / SQUARE_METERS_PER_KM2;
    const circleAreaKm2 = getCircleAreaKm2(radiusMeters);
    expect(Math.abs(areaKm2 - circleAreaKm2) / circleAreaKm2).toBeLessThan(MAX_RELATIVE_AREA_ERROR);
  });

  it("produces closed rings centred on the stop", () => {
    const polygon = getCoveragePolygon(getCoverageGrid([makeStop("a", STOP_LON)], 400, TEST_CELL_SIZE_METERS))!;
    expect(polygon.geometry.coordinates).toHaveLength(1);
    const [outerRing] = polygon.geometry.coordinates[0];
    expect(outerRing[0]).toEqual(outerRing[outerRing.length - 1]);
    const northernmostLat = Math.max(...outerRing.map(([, lat]) => lat));
    const southernmostLat = Math.min(...outerRing.map(([, lat]) => lat));
    const centreOffsetMeters = Math.abs((northernmostLat + southernmostLat) / 2 - STOP_LAT) * METERS_PER_DEGREE_LAT;
    expect(centreOffsetMeters).toBeLessThan(TEST_CELL_SIZE_METERS);
  });

  it("returns one polygon per separate covered area", () => {
    const polygon = getCoveragePolygon(getCoverageGrid([makeStop("a", STOP_LON), makeStop("b", STOP_LON + 0.1)], 400, TEST_CELL_SIZE_METERS))!;
    expect(polygon.geometry.coordinates).toHaveLength(2);
  });
});
