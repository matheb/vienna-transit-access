import { LOCALE_PATHS, PAGE_LANGUAGES, TEXT } from "./constants";
import { expect, test } from "./fixtures";
import {
  getCoveredArea, getLoadingStatus, getLoadingText, getRadiusSlider, getStopsSummary, getToggle, getViennaShare,
} from "./homePage";

// Result changes are announced to screen readers through the page's one status element: the loading line, which stays
// in the page once the stops have loaded. It speaks only after the result has settled, so a dragged slider or a held
// arrow key gives one announcement instead of one per step. The first results after loading are not announced,
// because the user has changed nothing yet.
// The expected texts are the visible card lines, so the tests follow the data and the page language. toContainText
// waits, so it also covers the settling delay without a fixed sleep.
for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];

  test.describe(language, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(LOCALE_PATHS[language]);
      await expect(getLoadingText(page, texts)).toBeHidden();
      await expect(getStopsSummary(page, texts)).toBeVisible();
    });

    test("the first results after loading are not announced", async ({ page }) => {
      await expect(getLoadingStatus(page)).toHaveText("");
    });

    test("after a mode toggle changes the result, the status announces all three result lines", async ({ page }) => {
      await getToggle(page, texts.modeToggleNames.bus).click();
      // The announcement fires only after the card has stopped changing (the coverage is deferred), so once the status
      // holds text, the visible lines are final and can be read.
      await expect(getLoadingStatus(page)).toContainText(/\S/);
      const resultLines = await Promise.all(
        [getStopsSummary(page, texts), getCoveredArea(page, texts), getViennaShare(page, texts)]
          .map(async (line) => (await line.textContent()) ?? ""),
      );
      for (const line of resultLines) await expect(getLoadingStatus(page)).toContainText(line);
    });

    test("after the radius slider changes the covered area, the status announces the new area", async ({ page }) => {
      await getRadiusSlider(page, texts).press("ArrowRight");
      // As above: the status gets text only once the card has settled, so the visible area is final then.
      await expect(getLoadingStatus(page)).toContainText(/\S/);
      const coveredAreaText = (await getCoveredArea(page, texts).textContent()) ?? "";
      await expect(getLoadingStatus(page)).toContainText(coveredAreaText);
    });
  });
}
