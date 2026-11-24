import AxeBuilder from "@axe-core/playwright";
import { AXE_WCAG_TAGS, LOCALE_PATHS, MIN_MAP_VIEWPORT_SHARE, MOBILE_VIEWPORT, PAGE_LANGUAGES, TEXT } from "./constants";
import { expect, test } from "./fixtures";
import { getAttributionLink, getLoadingStatus, getLoadingText, getMapRegion, getStopsSummary } from "./homePage";
import { holdStopsRequest } from "./stubs";

// Phone size with touch. Only this file runs at this size, so the rest of the suite is not run twice.
test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];

  test.describe(language, () => {
    // Set in beforeEach while the stops request is held; checked by the layout test.
    let attributionYWhileLoading: number | undefined;

    test.beforeEach(async ({ page }) => {
      const releaseStops = await holdStopsRequest(page);
      await page.goto(LOCALE_PATHS[language]);
      await expect(getLoadingStatus(page)).toBeVisible();
      attributionYWhileLoading = (await getAttributionLink(page).boundingBox())?.y;
      releaseStops();
      await expect(getLoadingText(page, texts)).toBeHidden();
      await expect(getStopsSummary(page, texts)).toBeVisible();
    });

    test("the content below the results card does not move when the stops load", async ({ page }) => {
      expect(attributionYWhileLoading, "attribution link y while loading").toBeDefined();
      const attributionYLoaded = (await getAttributionLink(page).boundingBox())?.y;
      expect(attributionYLoaded, "attribution link y after load").toBe(attributionYWhileLoading);
    });

    test("the page does not scroll sideways", async ({ page }) => {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, "document width").toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    });

    test("axe finds no WCAG 2.0/2.1 A or AA violations at phone size", async ({ page }) => {
      const results = await new AxeBuilder({ page }).withTags(AXE_WCAG_TAGS).analyze();
      const report = results.violations.map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
      );
      expect(report, `axe violations:\n${report.join("\n")}`).toEqual([]);
    });
  });
}

// The map's height does not depend on the page language, so this runs on the English page only.
test(`the map gets at least ${MIN_MAP_VIEWPORT_SHARE * 100}% of the viewport height`, async ({ page }) => {
  await page.goto(LOCALE_PATHS.en);
  await expect(getStopsSummary(page, TEXT.en)).toBeVisible();
  const box = await getMapRegion(page, TEXT.en).boundingBox();
  const top = Math.max(box?.y ?? 0, 0);
  const bottom = Math.min((box?.y ?? 0) + (box?.height ?? 0), MOBILE_VIEWPORT.height);
  const visibleHeight = Math.max(bottom - top, 0);
  expect(
    visibleHeight,
    `visible map height ${visibleHeight.toFixed(0)}px of ${MOBILE_VIEWPORT.height}px (map box: ${JSON.stringify(box)})`,
  ).toBeGreaterThanOrEqual(MIN_MAP_VIEWPORT_SHARE * MOBILE_VIEWPORT.height);
});
