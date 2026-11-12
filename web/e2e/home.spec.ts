import { expect, test, type Page } from "@playwright/test";

// Expected texts are literals on purpose: an e2e test checks what the user sees, so a changed label must fail here.
const PAGE_TITLE = "Vienna transit accessibility";
const LOADING_TEXT = "Loading stops…";
const STOPS_SUMMARY_PATTERN = /^\d+ of \d+ stops qualify$/;
const COVERED_AREA_PATTERN = /^Covered area:/;
const RADIUS_SLIDER_NAME = /^Walking radius:/;
const MODE_TOGGLE_NAME = "bus";
const ATTRIBUTION_LINK_NAME = "data.wien.gv.at";
const ATTRIBUTION_URL = "https://data.wien.gv.at";

const STOPS_URL_PATTERN = "**/data/stops.geojson";
const CARTO_URL_PATTERN = /^https:\/\/([a-z0-9-]+\.)*cartocdn\.com\//;
const EMPTY_MAP_STYLE = { version: 8, sources: {}, layers: [] };

// Answers every CARTO request with an empty map style, so MapLibre asks for no tiles and the test never touches CARTO.
async function stubCartoRequests(page: Page) {
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
async function holdStopsRequest(page: Page) {
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

// Prints the page's console errors into the run output without failing, so a WebGL or map problem is visible.
function printConsoleErrors(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") console.log(`[page console.error] ${message.text()}`);
  });
}

// Collects uncaught page errors (for example a React crash); the test fails if any occurred.
function collectPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return pageErrors;
}

test("home page loads stops and responds to the controls", async ({ page }) => {
  printConsoleErrors(page);
  const pageErrors = collectPageErrors(page);
  await stubCartoRequests(page);
  const releaseStops = await holdStopsRequest(page);

  const stopsSummary = page.getByText(STOPS_SUMMARY_PATTERN);
  const coveredArea = page.getByText(COVERED_AREA_PATTERN);

  await test.step("shows the title and the loading state", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(page.getByRole("status")).toHaveText(LOADING_TEXT);
  });

  await test.step("shows the stop count once the stops have loaded", async () => {
    releaseStops();
    await expect(page.getByRole("status")).toBeHidden();
    await expect(stopsSummary).toBeVisible();
  });

  await test.step("a mode toggle changes the stop count", async () => {
    const modeToggle = page.getByRole("button", { name: MODE_TOGGLE_NAME, exact: true });
    const pressedBefore = (await modeToggle.getAttribute("aria-pressed")) ?? "";
    const summaryBefore = (await stopsSummary.textContent()) ?? "";
    await modeToggle.click();
    await expect(modeToggle).not.toHaveAttribute("aria-pressed", pressedBefore);
    await expect(stopsSummary).not.toHaveText(summaryBefore);
  });

  await test.step("the walking radius slider changes the covered area", async () => {
    const radiusSlider = page.getByRole("slider", { name: RADIUS_SLIDER_NAME });
    const radiusBefore = await radiusSlider.inputValue();
    const coveredAreaBefore = (await coveredArea.textContent()) ?? "";
    await radiusSlider.press("ArrowRight");
    await expect(radiusSlider).not.toHaveValue(radiusBefore);
    await expect(coveredArea).not.toHaveText(coveredAreaBefore);
  });

  await test.step("links the data source", async () => {
    await expect(page.getByRole("link", { name: ATTRIBUTION_LINK_NAME })).toHaveAttribute("href", ATTRIBUTION_URL);
  });

  expect(pageErrors).toEqual([]);
});
