import { describe, expect, it } from "vitest";
import { EARTH_RADIUS_METERS, getLocalProjection } from "./localProjection";

const VIENNA_LON = 16.373;
const VIENNA_LAT = 48.208;
const DEGREES_TO_RADIANS = Math.PI / 180;

function getHaversineMeters([lonA, latA]: number[], [lonB, latB]: number[]): number {
  const deltaLat = (latB - latA) * DEGREES_TO_RADIANS;
  const deltaLon = (lonB - lonA) * DEGREES_TO_RADIANS;
  const halfChord =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(latA * DEGREES_TO_RADIANS) * Math.cos(latB * DEGREES_TO_RADIANS) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(halfChord));
}

describe("getLocalProjection", () => {
  const projection = getLocalProjection(VIENNA_LON, VIENNA_LAT);

  it("maps the origin to 0,0", () => {
    expect(projection.toMeters([VIENNA_LON, VIENNA_LAT])).toEqual([0, 0]);
  });

  it("round-trips lon/lat through metres", () => {
    const lonLat = [16.25, 48.3];
    const [lon, lat] = projection.toLonLat(projection.toMeters(lonLat));
    expect(lon).toBeCloseTo(lonLat[0], 9);
    expect(lat).toBeCloseTo(lonLat[1], 9);
  });

  it("matches great-circle distances within 0.1 % for 1 km east and north", () => {
    for (const offsetMeters of [[1000, 0], [0, 1000]]) {
      const target = projection.toLonLat(offsetMeters);
      const distanceMeters = getHaversineMeters([VIENNA_LON, VIENNA_LAT], target);
      expect(Math.abs(distanceMeters - 1000) / 1000).toBeLessThan(0.001);
    }
  });
});
