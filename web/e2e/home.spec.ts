import { ATTRIBUTION_URL, FONT_URL_PATTERN, LOCALE_PATHS, PAGE_LANGUAGES, TEXT } from "./constants";
import { expect, test } from "./fixtures";
import {
  getAttributionLink, getCoveredArea, getLoadingStatus, getLoadingText, getRadiusSlider, getStopsSummary, getToggle,
} from "./homePage";
import { holdStopsRequest } from "./stubs";

for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];
  const path = LOCALE_PATHS[language];

  test.describe(language, () => {
    // CARTO stubbing, console error printing and the uncaught-page-error check come from the automatic fixture.
    test("home page loads stops and responds to the controls", async ({ page }) => {
      const releaseStops = await holdStopsRequest(page);
      const stopsSummary = getStopsSummary(page, texts);
      const coveredArea = getCoveredArea(page, texts);
      let attributionYWhileLoading: number | undefined;

      await test.step("shows the title and the loading state", async () => {
        await page.goto(path);
        await expect(page).toHaveTitle(texts.pageTitle);
        await expect(getLoadingStatus(page)).toHaveText(texts.loadingText);
        attributionYWhileLoading = (await getAttributionLink(page).boundingBox())?.y;
      });

      await test.step("shows the stop count once the stops have loaded", async () => {
        releaseStops();
        await expect(getLoadingText(page, texts)).toBeHidden();
        await expect(stopsSummary).toBeVisible();
      });

      await test.step("the content below the results card does not move when the stops load", async () => {
        expect(attributionYWhileLoading, "attribution link y while loading").toBeDefined();
        const attributionYLoaded = (await getAttributionLink(page).boundingBox())?.y;
        expect(attributionYLoaded, "attribution link y after load").toBe(attributionYWhileLoading);
      });

      await test.step("a mode toggle changes the stop count", async () => {
        const modeToggle = getToggle(page, texts.modeToggleNames.bus);
        const pressedBefore = (await modeToggle.getAttribute("aria-pressed")) ?? "";
        const summaryBefore = (await stopsSummary.textContent()) ?? "";
        await modeToggle.click();
        await expect(modeToggle).not.toHaveAttribute("aria-pressed", pressedBefore);
        await expect(stopsSummary).not.toHaveText(summaryBefore);
      });

      await test.step("the walking radius slider changes the covered area", async () => {
        const radiusSlider = getRadiusSlider(page, texts);
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

    // Text width depends on the font, so CI and local machines can wrap differently. Without the web font the page
    // uses the fallback font, and the results card must still keep its height when the stops load.
    test("with the fallback font, the content below the results card does not move when the stops load", async ({ page }) => {
      await page.route(FONT_URL_PATTERN, (route) => route.abort());
      const releaseStops = await holdStopsRequest(page);
      await page.goto(path);
      await expect(getLoadingStatus(page)).toHaveText(texts.loadingText);
      const attributionYWhileLoading = (await getAttributionLink(page).boundingBox())?.y;
      releaseStops();
      await expect(getLoadingText(page, texts)).toBeHidden();
      await expect(getStopsSummary(page, texts)).toBeVisible();
      const attributionYLoaded = (await getAttributionLink(page).boundingBox())?.y;
      expect(attributionYWhileLoading, "attribution link y while loading").toBeDefined();
      expect(attributionYLoaded, `attribution link y: ${attributionYWhileLoading} while loading, ${attributionYLoaded} after load`)
        .toBe(attributionYWhileLoading);
    });
  });
}
