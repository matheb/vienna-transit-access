// Reference only, never shipped in the app: the original exact-union coverage (Turf buffer + union),
// copied from src/lib/geo/coverage.ts before the grid approximation replaced it.
// Used by scripts/benchmark-coverage.mjs and by the real-data comparison test. It is slow (seconds).
import area from "@turf/area";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import union from "@turf/union";

const BUFFER_STEPS = 8; // polygon segments per quarter circle around each stop
const SQUARE_METERS_PER_KM2 = 1e6;

/**
 * @param {import("../../src/lib/geo/coverage").Stop[]} stops
 * @param {number} radiusMeters
 * @returns {{ polygon: import("geojson").Feature<import("geojson").Polygon | import("geojson").MultiPolygon> | null, areaKm2: number }}
 */
export function getUnionCoverage(stops, radiusMeters) {
  if (stops.length === 0) return { polygon: null, areaKm2: 0 };
  const buffers = stops.map((stop) => buffer(stop, radiusMeters, { units: "meters", steps: BUFFER_STEPS }));
  const merged = buffers.length === 1 ? buffers[0] : union(featureCollection(buffers));
  const areaKm2 = merged ? area(merged) / SQUARE_METERS_PER_KM2 : 0;
  return { polygon: merged, areaKm2 };
}
