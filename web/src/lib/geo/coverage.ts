import area from "@turf/area";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";

export type DayType = "weekday" | "saturday" | "sunday";
export type TimeBand = "am" | "midday" | "pm" | "evening";
export type Mode = "tram" | "metro" | "rail" | "bus" | "other";

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

export function filterStops(stops: Stop[], params: FilterParams): Stop[] {
  return stops.filter(
    (stop) =>
      (stop.properties.dph[params.day]?.[params.band] ?? 0) >= params.minDeparturesPerHour &&
      stop.properties.modes.some((mode) => params.modes.includes(mode)),
  );
}

export function getCoverage(stops: Stop[], radiusMeters: number): Coverage {
  if (stops.length === 0) return { polygon: null, areaKm2: 0, viennaShare: 0 };
  const buffers = stops.map((stop) => buffer(stop, radiusMeters, { units: "meters", steps: 8 })!);
  const merged: Feature<Polygon | MultiPolygon> | null =
    buffers.length === 1 ? buffers[0] : union(featureCollection(buffers) as FeatureCollection<Polygon | MultiPolygon>);
  const areaKm2 = merged ? area(merged) / 1e6 : 0;
  return { polygon: merged, areaKm2, viennaShare: Math.min(areaKm2 / VIENNA_AREA_KM2, 1) };
}
