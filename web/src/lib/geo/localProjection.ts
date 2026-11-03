import type { Position } from "geojson";

// Mean Earth radius (IUGG), the same value Turf uses.
export const EARTH_RADIUS_METERS = 6371008.8;
const DEGREES_TO_RADIANS = Math.PI / 180;

export interface LocalProjection {
  toMeters(lonLat: Position): [xMeters: number, yMeters: number];
  toLonLat(meters: Position): [lon: number, lat: number];
}

/**
 * Equirectangular projection to local metres around an origin (x east, y north).
 * Distances are exact along the origin's latitude; across Vienna (about ±0.12° latitude) the
 * east-west scale error stays below 0.3 %, which is fine for an approximate coverage area.
 */
export function getLocalProjection(originLon: number, originLat: number): LocalProjection {
  const metersPerDegreeLat = EARTH_RADIUS_METERS * DEGREES_TO_RADIANS;
  const metersPerDegreeLon = metersPerDegreeLat * Math.cos(originLat * DEGREES_TO_RADIANS);
  return {
    toMeters: ([lon, lat]) => [(lon - originLon) * metersPerDegreeLon, (lat - originLat) * metersPerDegreeLat],
    toLonLat: ([xMeters, yMeters]) => [originLon + xMeters / metersPerDegreeLon, originLat + yMeters / metersPerDegreeLat],
  };
}
