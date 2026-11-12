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
