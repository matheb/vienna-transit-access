import type { Page } from "@playwright/test";
import {
  DESKTOP_VIEWPORT, LOCALE_PATHS, MOBILE_VIEWPORT, PAGE_LANGUAGES, SUBPIXEL_TOLERANCE_PX, TEXT, type PageLanguage,
} from "./constants";
import { expect, test } from "./fixtures";
import { getControlsPanel, getLoadingText, getOtherLanguageLink, getStopsSummary } from "./homePage";
import { stubStopsWithOneMode } from "./stubs";

// Layout guards in both page languages. German labels are longer, so the German runs are the real check. The English
// runs calibrate the guards: they must pass on today's English page, so a German failure means German text that does
// not fit, not a guard that is too strict.
// The results card's height is guarded in home.spec.ts and mobile.spec.ts, which also run in both languages.

// The only mode the stubbed stops keep. Bus has the shortest label, so the hint lists the most and longest labels.
const ONLY_MODE_WITH_STOPS = "bus";

// Opens the page in the given language and waits until the stops are shown.
async function openLoadedPage(page: Page, language: PageLanguage) {
  await page.goto(LOCALE_PATHS[language]);
  await expect(getLoadingText(page, TEXT[language])).toBeHidden();
  await expect(getStopsSummary(page, TEXT[language])).toBeVisible();
}

for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];

  for (const viewport of [MOBILE_VIEWPORT, DESKTOP_VIEWPORT]) {
    test.describe(`${language} ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport });

      test("nothing inside the panel is wider than its own box", async ({ page }) => {
        await openLoadedPage(page, language);
        // Walks every element (no selector): content wider than the box means overflow or cut-off text.
        const overflowing = await getControlsPanel(page).evaluate((panel, tolerance) => {
          const found: string[] = [];
          const walker = document.createTreeWalker(panel, NodeFilter.SHOW_ELEMENT);
          for (let node: Node | null = walker.currentNode; node; node = walker.nextNode()) {
            const element = node as HTMLElement;
            // Base UI's slider thumb draws an enlarged touch area (::after, -inset-2) outside its 12px box and holds the
            // visually hidden native <input type="range">; both are wider than the thumb by design and hold no text.
            const isRangeInput = element instanceof HTMLInputElement && element.type === "range";
            const isSliderThumb = Array.from(element.children).some(
              (child) => child instanceof HTMLInputElement && child.type === "range",
            );
            if (isRangeInput || isSliderThumb) continue;
            if (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + tolerance) {
              const text = (element.textContent ?? "").trim().slice(0, 40);
              found.push(`${element.tagName.toLowerCase()} "${text}": ${element.scrollWidth}px of content in ${element.clientWidth}px`);
            }
          }
          return found;
        }, SUBPIXEL_TOLERANCE_PX);
        expect(overflowing, "elements whose content is wider than their box").toEqual([]);
      });

      test("every toggle stays inside the panel", async ({ page }) => {
        await openLoadedPage(page, language);
        const panel = getControlsPanel(page);
        const panelBox = await panel.boundingBox();
        const toggles = await panel.getByRole("button").all();
        expect(toggles.length, "toggles in the panel").toBeGreaterThan(0);
        const outside: string[] = [];
        for (const toggle of toggles) {
          const box = await toggle.boundingBox();
          if (!box || !panelBox) continue;
          const left = panelBox.x - SUBPIXEL_TOLERANCE_PX;
          const right = panelBox.x + panelBox.width + SUBPIXEL_TOLERANCE_PX;
          if (box.x < left || box.x + box.width > right) outside.push(`"${await toggle.textContent()}": ${JSON.stringify(box)}`);
        }
        expect(outside, `toggles outside the panel ${JSON.stringify(panelBox)}`).toEqual([]);
      });

      test("the unavailable-modes hint stays on one line, even with every other mode listed", async ({ page }) => {
        await stubStopsWithOneMode(page, ONLY_MODE_WITH_STOPS);
        await openLoadedPage(page, language);
        const unavailableNames = Object.entries(texts.modeToggleNames)
          .filter(([mode]) => mode !== ONLY_MODE_WITH_STOPS)
          .map(([, name]) => name);
        const hint = page.getByText(texts.unavailableModesHintPrefix);
        await expect(hint, "the hint lists every mode without stops")
          .toHaveText(`${texts.unavailableModesHintPrefix} ${unavailableNames.join(", ")}`);
        const { height, lineHeight } = await hint.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(element).lineHeight),
        }));
        expect(height, `hint height ${height}px; one line is ${lineHeight}px`).toBeLessThanOrEqual(lineHeight + SUBPIXEL_TOLERANCE_PX);
      });
    });
  }

  test.describe(`${language} phone`, () => {
    test.use({ viewport: MOBILE_VIEWPORT, hasTouch: true });

    test("the language switch is visible without scrolling", async ({ page }) => {
      await page.goto(LOCALE_PATHS[language]);
      await expect(getOtherLanguageLink(page, texts)).toBeInViewport({ ratio: 1 });
    });
  });
}
