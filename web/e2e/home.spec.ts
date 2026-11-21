import { ATTRIBUTION_URL, LOADING_TEXT, MODE_TOGGLE_NAME, PAGE_TITLE } from "./constants";
import { expect, test } from "./fixtures";
import {
  getAttributionLink, getCoveredArea, getLoadingStatus, getRadiusSlider, getStopsSummary, getToggle,
} from "./homePage";
import { holdStopsRequest } from "./stubs";

// CARTO stubbing, console error printing and the uncaught-page-error check come from the automatic fixture.
test("home page loads stops and responds to the controls", async ({ page }) => {
  const releaseStops = await holdStopsRequest(page);
  const stopsSummary = getStopsSummary(page);
  const coveredArea = getCoveredArea(page);
  let attributionYWhileLoading: number | undefined;

  await test.step("shows the title and the loading state", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(getLoadingStatus(page)).toHaveText(LOADING_TEXT);
    attributionYWhileLoading = (await getAttributionLink(page).boundingBox())?.y;  });

  await test.step("shows the stop count once the stops have loaded", async () => {
    releaseStops();
    await expect(getLoadingStatus(page)).toBeHidden();
    await expect(stopsSummary).toBeVisible();
  });

  await test.step("the content below the results card does not move when the stops load", async () => {
    expect(attributionYWhileLoading, "attribution link y while loading").toBeDefined();
    const attributionYLoaded = (await getAttributionLink(page).boundingBox())?.y;    expect(attributionYLoaded, "attribution link y after load").toBe(attributionYWhileLoading);
  });

  await test.step("a mode toggle changes the stop count", async () => {
    const modeToggle = getToggle(page, MODE_TOGGLE_NAME);
    const pressedBefore = (await modeToggle.getAttribute("aria-pressed")) ?? "";
    const summaryBefore = (await stopsSummary.textContent()) ?? "";
    await modeToggle.click();
    await expect(modeToggle).not.toHaveAttribute("aria-pressed", pressedBefore);
    await expect(stopsSummary).not.toHaveText(summaryBefore);
  });

  await test.step("the walking radius slider changes the covered area", async () => {
    const radiusSlider = getRadiusSlider(page);
    const radiusBefore = await radiusSlider.inputValue();
    const coveredAreaBefore = (await coveredArea.textContent()) ?? "";
    await radiusSlider.press("ArrowRight");
    await expect(radiusSlider).not.toHaveValue(radiusBefore);
    await expect(coveredArea).not.toHaveText(coveredAreaBefore);
  });

  await test.step("links the data source", async () => {
    await expect(getAttributionLink(page)).toHaveAttribute("href", ATTRIBUTION_URL);
  });
});
