import type { Page } from "@playwright/test";
import { CARTO_URL_PATTERN, STOPS_URL_PATTERN } from "./constants";

const EMPTY_MAP_STYLE = { version: 8, sources: {}, layers: [] };

// Answers every CARTO request with an empty map style, so MapLibre asks for no tiles and the test never touches CARTO.
export async function stubCartoRequests(page: Page) {
  await page.route(CARTO_URL_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(EMPTY_MAP_STYLE),
    }),
  );
}

// Holds the stops request until the returned function is called, so the loading state can be checked without timing.
export async function holdStopsRequest(page: Page) {
  let releaseStops = () => {};
  const stopsReleased = new Promise<void>((resolve) => {
    releaseStops = resolve;
  });
  await page.route(STOPS_URL_PATTERN, async (route) => {
    await stopsReleased;
    await route.continue();
  });
  return releaseStops;
}

interface StopsFeature {
  properties: { modes: string[] };
}

// Answers the stops request with only the stops that serve the given mode, each listing only that mode, so every
// other mode has no stops and its toggle is disabled and named in the hint.
export async function stubStopsWithOneMode(page: Page, mode: string) {
  await page.route(STOPS_URL_PATTERN, async (route) => {
    const response = await route.fetch();
    const stopsData = (await response.json()) as { features: StopsFeature[] };
    const features = stopsData.features
      .filter((feature) => feature.properties.modes.includes(mode))
      .map((feature) => ({ ...feature, properties: { ...feature.properties, modes: [mode] } }));
    await route.fulfill({ response, json: { ...stopsData, features } });
  });
}
