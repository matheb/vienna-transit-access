import area from "@turf/area";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";

export type DayType = "weekday" | "saturday" | "sunday";
export type Band = "am" | "midday" | "pm" | "evening";
export type Mode = "tram" | "metro" | "rail" | "bus" | "other";

export interface StopProps {
  id: string;
  name: string;
  modes: Mode[];
  dph: Record<DayType, Record<Band, number>>;
}
export type Stop = Feature<Point, StopProps>;

export interface Params {
  day: DayType;
  band: Band;
  minDph: number;
  radius: number; // metres
  modes: Mode[];
}

export const VIENNA_KM2 = 414.9;

export function filterStops(stops: Stop[], p: Params): Stop[] {
  return stops.filter(
    (s) =>
      (s.properties.dph[p.day]?.[p.band] ?? 0) >= p.minDph &&
      s.properties.modes.some((m) => p.modes.includes(m)),
  );
}

export function coverage(stops: Stop[], radiusM: number) {
  if (stops.length === 0) return { polygon: null, km2: 0, share: 0 };
  const buffers = stops.map((s) => buffer(s, radiusM, { units: "meters", steps: 8 })!);
  const merged: Feature<Polygon | MultiPolygon> | null =
    buffers.length === 1 ? buffers[0] : union(featureCollection(buffers) as FeatureCollection<Polygon | MultiPolygon>);
  const km2 = merged ? area(merged) / 1e6 : 0;
  return { polygon: merged, km2, share: Math.min(km2 / VIENNA_KM2, 1) };
}
