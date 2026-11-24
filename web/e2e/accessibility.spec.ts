import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import {
  AXE_WCAG_TAGS, MIN_FOCUS_INDICATOR_CONTRAST, TEXT, type PageTexts,
} from "./constants";
import { expect, test } from "./fixtures";
import {
  getAttributionLink, getCoveredArea, getLoadingStatus, getMapRegion, getMinDeparturesSlider,
  getRadiusSlider, getStopsSummary, getToggle,
} from "./homePage";
import { getModesWithStops } from "./stopsData";
import { holdStopsRequest } from "./stubs";

type AxeViolation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

// An sRGB colour as [red, green, blue, alpha], each 0-255.
type Rgba = [number, number, number, number];

interface FocusIndicator {
  indicatorElement: string;
  outline: string;
  boxShadow: string;
  hasVisibleOutline: boolean;
  hasVisibleBoxShadow: boolean;
  indicatorColor: Rgba;
  backgroundLayers: Rgba[];
}

const texts = TEXT.en;

// The labels of the mode toggles, in toggle order, split by whether the data has stops for that mode.
function getModeToggleNames(pageTexts: PageTexts, modesWithStops: Set<string>, withStops: boolean) {
  return Object.entries(pageTexts.modeToggleNames)
    .filter(([mode]) => modesWithStops.has(mode) === withStops)
    .map(([, name]) => name);
}

// The toggle groups in Tab order; each group's Tab stop is its pressed toggle, which is the first one by default.
// The mode group lists only the modes with stops in the data; a disabled toggle is skipped by Tab and the arrow keys.
function getToggleGroups(modesWithStops: Set<string>) {
  return [
    { label: "day", toggleNames: texts.dayToggleNames },
    { label: "time band", toggleNames: texts.timeBandToggleNames },
    { label: "mode", toggleNames: getModeToggleNames(texts, modesWithStops, true) },
  ];
}
type ToggleGroups = ReturnType<typeof getToggleGroups>;
const MIN_DEPARTURES_TAB_STOP = 4;
const RADIUS_TAB_STOP = 5;
const WHITE: Rgba = [255, 255, 255, 255];
const THEMES = ["light", "dark"] as const;

// Opens the page and waits until the stops and the coverage are shown.
async function openLoadedPage(page: Page) {
  const releaseStops = await holdStopsRequest(page);
  await page.goto("/");
  releaseStops();
  await expect(getLoadingStatus(page)).toBeHidden();
  await expect(getStopsSummary(page, texts)).toBeVisible();
  await expect(getCoveredArea(page, texts)).toBeVisible();
}

// Presses Tab the given number of times, starting from wherever focus is (the top of a freshly loaded page).
async function pressTab(page: Page, count: number) {
  for (let i = 0; i < count; i++) await page.keyboard.press("Tab");
}

// One line per failing element: rule id, impact, selector, then the element's HTML and axe's explanation.
function getViolationReport(violations: AxeViolation[]) {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) =>
      `${violation.id} [${violation.impact ?? "unknown impact"}] ${node.target.join(" ")}\n` +
      `    ${node.html}\n    ${(node.failureSummary ?? "").replaceAll("\n", "\n    ")}`,
    ),
  );
}

// Reads the focus indicator of the element that has keyboard focus, after its CSS transitions have finished.
// For a slider, Base UI focuses a visually hidden <input type="range">, so the indicator must be on its parent, the visible thumb.
// Visible outline: style not "none", width not "0px", colour not transparent.
// Visible box-shadow: at least one shadow with a non-transparent colour and a non-zero offset, blur or spread.
// Indicator colour: the first visible shadow's colour, else the outline colour.
// Background layers: the background colours from the indicator's parent upwards, until an opaque one;
// the indicator is drawn outside the element, so the element's own background is skipped.
async function getFocusIndicator(page: Page): Promise<FocusIndicator> {
  return page.evaluate(async () => {
    // Any CSS colour syntax (oklab and oklch too) as sRGB, read back from a 1x1 canvas; an unparsable colour comes back transparent.
    function toRgba(color: string): Rgba {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return [0, 0, 0, 0];
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
      return [red, green, blue, alpha];
    }
    function getShadowColor(shadow: string) {
      return shadow.match(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/)?.[0] ?? "";
    }
    function isVisibleShadow(shadow: string) {
      const color = getShadowColor(shadow);
      const lengths = shadow.replace(color, "").match(/-?[\d.]+px/g) ?? [];
      return toRgba(color)[3] > 0 && lengths.some((length) => parseFloat(length) !== 0);
    }
    function getBackgroundLayers(element: Element) {
      const layers: Rgba[] = [];
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const layer = toRgba(getComputedStyle(ancestor).backgroundColor);
        if (layer[3] > 0) layers.push(layer);
        if (layer[3] === 255) break;
      }
      return layers;
    }

    const focused = document.activeElement ?? document.body;
    const isSliderInput = focused instanceof HTMLInputElement && focused.type === "range";
    const indicatorElement = (isSliderInput ? focused.parentElement : focused) ?? focused;
    await Promise.all(indicatorElement.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(indicatorElement);
    const shadows = style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^(]*\))/);
    const visibleShadow = shadows.find(isVisibleShadow);
    return {
      indicatorElement: `${indicatorElement.tagName.toLowerCase()}${isSliderInput ? " (slider thumb)" : ""}`,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      boxShadow: style.boxShadow,
      hasVisibleOutline: style.outlineStyle !== "none" && style.outlineWidth !== "0px" && toRgba(style.outlineColor)[3] > 0,
      hasVisibleBoxShadow: visibleShadow !== undefined,
      indicatorColor: toRgba(visibleShadow ? getShadowColor(visibleShadow) : style.outlineColor),
      backgroundLayers: getBackgroundLayers(indicatorElement),
    };
  });
}

// Paints a colour over an opaque one, blending in sRGB like the browser does.
function compositeOver(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top[3] / 255;
  const [red, green, blue] = [0, 1, 2].map((channel) => top[channel] * alpha + bottom[channel] * (1 - alpha));
  return [red, green, blue, 255];
}

// WCAG contrast ratio of two opaque colours: 1 for the same colour, 21 for black on white.
function getContrastRatio(first: Rgba, second: Rgba) {
  const getLuminance = ([red, green, blue]: Rgba) => {
    const [r, g, b] = [red, green, blue].map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [lighter, darker] = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function toHex([red, green, blue]: Rgba) {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

// Contrast of the focus indicator against the background it is drawn on, with both colours for the failure message.
function getIndicatorContrast({ indicatorColor, backgroundLayers }: FocusIndicator) {
  const background = backgroundLayers.reduceRight<Rgba>((below, layer) => compositeOver(layer, below), WHITE);
  const indicator = compositeOver(indicatorColor, background);
  return { ratio: getContrastRatio(indicator, background), indicator: toHex(indicator), background: toHex(background) };
}

async function getPressedStates(page: Page, toggleNames: string[]) {
  return Promise.all(toggleNames.map((name) => getToggle(page, name).getAttribute("aria-pressed")));
}

// The innermost group (or radiogroup) that contains the given toggle.
function getGroupOf(page: Page, toggle: Locator) {
  return page.getByRole("group").or(page.getByRole("radiogroup")).filter({ has: toggle }).last();
}

function getTabStopLocators(page: Page, toggleGroups: ToggleGroups) {
  return [
    ...toggleGroups.map((group) => getToggle(page, group.toggleNames[0])),
    getMinDeparturesSlider(page, texts),
    getRadiusSlider(page, texts),
    getAttributionLink(page),
  ];
}

test.beforeEach(async ({ page }) => {
  await openLoadedPage(page);
});

test("axe finds no WCAG 2.0/2.1 A or AA violations on the loaded page", async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(AXE_WCAG_TAGS).analyze();
  const report = getViolationReport(results.violations);
  expect(report, `axe violations:\n${report.join("\n")}`).toEqual([]);
});

// MapLibre names its canvas with our map label; the section around it has no name, so there is no second region.
test("exactly one region has the map's name, and it is the map canvas", async ({ page }) => {
  await expect(getMapRegion(page, texts)).toHaveCount(1);
  await expect(getMapRegion(page, texts)).toHaveJSProperty("tagName", "CANVAS");
});

test("Tab moves through the toggle groups, both sliders and the data link in order", async ({ page, request }) => {
  const toggleGroups = getToggleGroups(await getModesWithStops(request));
  for (const tabStop of getTabStopLocators(page, toggleGroups)) {
    await page.keyboard.press("Tab");
    await expect(tabStop).toBeFocused();
  }
});

for (const theme of THEMES) {
  test(`every Tab stop shows a focus indicator with at least ${MIN_FOCUS_INDICATOR_CONTRAST}:1 contrast (${theme} theme)`, async ({ page, request }) => {
    const toggleGroups = getToggleGroups(await getModesWithStops(request));
    // Dark mode is class-based (.dark on an ancestor), so emulating prefers-color-scheme would not switch it.
    if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
    for (const tabStop of getTabStopLocators(page, toggleGroups)) {
      await page.keyboard.press("Tab");
      await expect(tabStop).toBeFocused();
      const focusIndicator = await getFocusIndicator(page);
      const hasIndicator = focusIndicator.hasVisibleOutline || focusIndicator.hasVisibleBoxShadow;
      expect.soft(hasIndicator, `focus indicator on ${tabStop}: ${JSON.stringify(focusIndicator)}`).toBe(true);
      const contrast = getIndicatorContrast(focusIndicator);
      const contrastReport = `${contrast.ratio.toFixed(2)}:1, ${contrast.indicator} on ${contrast.background}`;
      expect.soft(contrast.ratio, `focus indicator contrast on ${tabStop}: ${contrastReport}`)
        .toBeGreaterThanOrEqual(MIN_FOCUS_INDICATOR_CONTRAST);
      test.info().annotations.push({ type: "focus-contrast", description: `${tabStop}: ${contrastReport}` });
    }
  });
}

test("the contrast ratio is 21 for black on white, 1 for a colour on itself, and too low for the old 50% ring", () => {
  expect(getContrastRatio([0, 0, 0, 255], WHITE)).toBeCloseTo(21);
  expect(getContrastRatio(WHITE, WHITE)).toBe(1);
  const oldRing = compositeOver([161, 161, 161, 128], WHITE);
  expect(getContrastRatio(oldRing, WHITE)).toBeLessThan(MIN_FOCUS_INDICATOR_CONTRAST);
});

test("arrow keys, Home and End move focus inside each toggle group without pressing", async ({ page, request }) => {
  const toggleGroups = getToggleGroups(await getModesWithStops(request));
  for (const [groupIndex, group] of toggleGroups.entries()) {
    await test.step(`${group.label} group`, async () => {
      const toggleNames = group.toggleNames;
      const lastIndex = toggleNames.length - 1;
      await openLoadedPage(page);
      await pressTab(page, groupIndex + 1);
      const pressedBefore = await getPressedStates(page, toggleNames);
      await expect(getToggle(page, toggleNames[0])).toBeFocused();
      for (const name of toggleNames.slice(1)) {
        await page.keyboard.press("ArrowRight");
        await expect(getToggle(page, name)).toBeFocused();
      }
      await page.keyboard.press("ArrowLeft");
      await expect(getToggle(page, toggleNames[lastIndex - 1])).toBeFocused();
      await page.keyboard.press("Home");
      await expect(getToggle(page, toggleNames[0])).toBeFocused();
      await page.keyboard.press("End");
      await expect(getToggle(page, toggleNames[lastIndex])).toBeFocused();
      expect(await getPressedStates(page, toggleNames)).toEqual(pressedBefore);
    });
  }
});

test("Space presses a day toggle and Enter presses a time-band toggle", async ({ page }) => {
  const [firstDay, secondDay] = texts.dayToggleNames;
  const [firstBand, secondBand] = texts.timeBandToggleNames;

  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect(getToggle(page, secondDay)).toBeFocused();
  await expect(getToggle(page, secondDay)).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(getToggle(page, secondDay)).toHaveAttribute("aria-pressed", "true");
  await expect(getToggle(page, firstDay)).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect(getToggle(page, secondBand)).toBeFocused();
  await expect(getToggle(page, secondBand)).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(getToggle(page, secondBand)).toHaveAttribute("aria-pressed", "true");
  await expect(getToggle(page, firstBand)).toHaveAttribute("aria-pressed", "false");
});

test("arrow keys change both sliders", async ({ page }) => {
  for (const [tabStop, slider] of [
    [MIN_DEPARTURES_TAB_STOP, getMinDeparturesSlider(page, texts)],
    [RADIUS_TAB_STOP, getRadiusSlider(page, texts)],
  ] as const) {
    await openLoadedPage(page);
    await pressTab(page, tabStop);
    await expect(slider).toBeFocused();
    const valueBefore = await slider.inputValue();
    await page.keyboard.press("ArrowRight");
    await expect(slider).not.toHaveValue(valueBefore);
    await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveValue(valueBefore);
  }
});

test("each toggle group has an accessible name", async ({ page, request }) => {
  const toggleGroups = getToggleGroups(await getModesWithStops(request));
  for (const group of toggleGroups) {
    const toggleGroup = getGroupOf(page, getToggle(page, group.toggleNames[0]));
    await expect.soft(toggleGroup, `${group.label} group: role group/radiogroup with a name`).toHaveAccessibleName(/\S/);
  }
});

test("modes without stops in the data are disabled, not pressed, and named in a visible hint", async ({ page, request }) => {
  const modesWithStops = await getModesWithStops(request);
  const unavailableNames = getModeToggleNames(texts, modesWithStops, false);
  const hint = page.getByText(texts.unavailableModesHintPrefix);
  if (unavailableNames.length === 0) {
    await expect(hint).toHaveCount(0);
    return;
  }
  const hintText = `${texts.unavailableModesHintPrefix} ${unavailableNames.join(", ")}`;
  await expect(hint).toHaveText(hintText);
  for (const name of unavailableNames) {
    const toggle = getToggle(page, name);
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAccessibleDescription(hintText);
  }
});

test("a slider's accessible name does not contain its current value", async ({ page }) => {
  for (const slider of [getMinDeparturesSlider(page, texts), getRadiusSlider(page, texts)]) {
    const value = await slider.inputValue();
    const valuePattern = new RegExp(`\\b${value}\\b`);
    await expect.soft(slider, `slider name must not contain its value ${value}`).not.toHaveAccessibleName(valuePattern);
  }
  await expect(getRadiusSlider(page, texts), "radius is spoken with its unit").toHaveAttribute("aria-valuetext", texts.radiusValueTextPattern);
});
