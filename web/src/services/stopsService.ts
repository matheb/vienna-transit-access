import type { Stop } from "@/lib/geo/coverage";

export enum StopsLoadStatus {
  loading = "loading",
  ready = "ready",
  error = "error",
}

export const STOPS_URL = "/data/stops.geojson";

export function fetchStops(): Promise<Stop[]> {
  return fetch(STOPS_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load stops: HTTP ${response.status}`);
      return response.json();
    })
    .then((featureCollection: { features: Stop[] }) => featureCollection.features);
}
