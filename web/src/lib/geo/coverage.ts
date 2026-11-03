import type { Feature, MultiPolygon, Point, Polygon } from "geojson";
import { getCoverageGrid, getCoveredAreaKm2 } from "./coverageGrid";
import { getCoveragePolygon } from "./coveragePolygon";

export const DAY_TYPES = ["weekday", "saturday", "sunday"] as const;
export type DayType = (typeof DAY_TYPES)[number];
export const TIME_BANDS = ["am", "midday", "pm", "evening"] as const;
export type TimeBand = (typeof TIME_BANDS)[number];
export type Mode = "tram" | "metro" | "rail" | "bus" | "other";
// Modes the user can filter by ("other" is in the data but not offered in the UI).
export const SELECTABLE_MODES = ["tram", "metro", "rail", "bus"] as const satisfies readonly Mode[];

export interface StopProperties {
  id: string;
  name: string;
  modes: Mode[];
  dph: Record<DayType, Record<TimeBand, number>>;
}
export type Stop = Feature<Point, StopProperties>;

export interface FilterParams {
  day: DayType;
  band: TimeBand;
  minDeparturesPerHour: number;
  radiusMeters: number;
  modes: Mode[];
}

export interface Coverage {
  polygon: Feature<Polygon | MultiPolygon> | null;
  areaKm2: number;
  viennaShare: number; // 0..1
}

export const VIENNA_AREA_KM2 = 414.9;
// Chosen with scripts/benchmark-coverage.mjs: about 40–70 ms on the real stops, area within 1 % of the exact union.
export const COVERAGE_CELL_SIZE_METERS = 25;

export function filterStops(stops: Stop[], params: FilterParams): Stop[] {
  return stops.filter(
    (stop) =>
      (stop.properties.dph[params.day]?.[params.band] ?? 0) >= params.minDeparturesPerHour &&
      stop.properties.modes.some((mode) => params.modes.includes(mode)),
  );
}

/**
 * Approximate area within radiusMeters of any stop, plus its outline for the map.
 * Both come from one grid in local metres (see coverageGrid.ts): the area counts covered cells and the
 * polygon is the traced grid edge. On the real stops the area is within 1 % of an exact circle union.
 */
export function getCoverage(stops: Stop[], radiusMeters: number, cellSizeMeters = COVERAGE_CELL_SIZE_METERS): Coverage {
  const grid = getCoverageGrid(stops, radiusMeters, cellSizeMeters);
  const areaKm2 = getCoveredAreaKm2(grid);
  return { polygon: getCoveragePolygon(grid), areaKm2, viennaShare: Math.min(areaKm2 / VIENNA_AREA_KM2, 1) };
}
