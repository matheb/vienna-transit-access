import AxeBuilder from "@axe-core/playwright";
import { AXE_WCAG_TAGS, MIN_MAP_VIEWPORT_SHARE, MOBILE_VIEWPORT } from "./constants";
import { expect, test } from "./fixtures";
import { getLoadingStatus, getMapRegion, getStopsSummary } from "./homePage";
import { holdStopsRequest } from "./stubs";

// Phone size with touch. Only this file runs at this size, so the rest of the suite is not run twice.
test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

test.beforeEach(async ({ page }) => {
  const releaseStops = await holdStopsRequest(page);
  await page.goto("/");
  releaseStops();
  await expect(getLoadingStatus(page)).toBeHidden();
  await expect(getStopsSummary(page)).toBeVisible();
});

test(`the map gets at least ${MIN_MAP_VIEWPORT_SHARE * 100}% of the viewport height`, async ({ page }) => {
  const box = await getMapRegion(page).boundingBox();
  const top = Math.max(box?.y ?? 0, 0);
  const bottom = Math.min((box?.y ?? 0) + (box?.height ?? 0), MOBILE_VIEWPORT.height);
  const visibleHeight = Math.max(bottom - top, 0);
  expect(
    visibleHeight,
    `visible map height ${visibleHeight.toFixed(0)}px of ${MOBILE_VIEWPORT.height}px (map box: ${JSON.stringify(box)})`,
  ).toBeGreaterThanOrEqual(MIN_MAP_VIEWPORT_SHARE * MOBILE_VIEWPORT.height);
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
