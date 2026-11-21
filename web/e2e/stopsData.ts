import type { APIRequestContext } from "@playwright/test";
import { STOPS_DATA_PATH } from "./constants";

interface StopsData {
  features: { properties: { modes: string[] } }[];
}

// The modes that at least one stop has, read from the same data file the page loads, so tests follow the data.
export async function getModesWithStops(request: APIRequestContext) {
  const response = await request.get(STOPS_DATA_PATH);
  const stopsData = (await response.json()) as StopsData;
  return new Set(stopsData.features.flatMap((feature) => feature.properties.modes));
}
