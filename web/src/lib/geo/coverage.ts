import area from "@turf/area";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";

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
const BUFFER_STEPS = 8; // polygon segments per quarter circle around each stop
const SQUARE_METERS_PER_KM2 = 1e6;

export function filterStops(stops: Stop[], params: FilterParams): Stop[] {
  return stops.filter(
    (stop) =>
      (stop.properties.dph[params.day]?.[params.band] ?? 0) >= params.minDeparturesPerHour &&
      stop.properties.modes.some((mode) => params.modes.includes(mode)),
  );
}

export function getCoverage(stops: Stop[], radiusMeters: number): Coverage {
  if (stops.length === 0) return { polygon: null, areaKm2: 0, viennaShare: 0 };
  const buffers = stops.map((stop) => buffer(stop, radiusMeters, { units: "meters", steps: BUFFER_STEPS })!);
  const merged: Feature<Polygon | MultiPolygon> | null =
    buffers.length === 1 ? buffers[0] : union(featureCollection(buffers) as FeatureCollection<Polygon | MultiPolygon>);
  const areaKm2 = merged ? area(merged) / SQUARE_METERS_PER_KM2 : 0;
  return { polygon: merged, areaKm2, viennaShare: Math.min(areaKm2 / VIENNA_AREA_KM2, 1) };
}
