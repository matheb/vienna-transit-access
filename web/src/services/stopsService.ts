import type { Stop } from "@/lib/geo/coverage";

export const STOPS_URL = "/data/stops.geojson";

export function fetchStops(): Promise<Stop[]> {
  return fetch(STOPS_URL)
    .then((response) => response.json())
    .then((featureCollection: { features: Stop[] }) => featureCollection.features);
}
