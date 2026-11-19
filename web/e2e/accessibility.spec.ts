import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import {
  AXE_WCAG_TAGS, DAY_TOGGLE_NAMES, MODE_TOGGLE_NAMES, RADIUS_VALUE_TEXT_PATTERN, TIME_BAND_TOGGLE_NAMES,
} from "./constants";
import { expect, test } from "./fixtures";
import {
  getAttributionLink, getCoveredArea, getLoadingStatus, getMinDeparturesSlider,
  getRadiusSlider, getStopsSummary, getToggle,
} from "./homePage";
import { holdStopsRequest } from "./stubs";

type AxeViolation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

interface FocusIndicator {
  indicatorElement: string;
  outline: string;
  boxShadow: string;
  hasVisibleOutline: boolean;
  hasVisibleBoxShadow: boolean;
}

// The toggle groups in Tab order; each group's Tab stop is its pressed toggle, which is the first one by default.
const TOGGLE_GROUPS = [
  { label: "day", toggleNames: DAY_TOGGLE_NAMES },
  { label: "time band", toggleNames: TIME_BAND_TOGGLE_NAMES },
  { label: "mode", toggleNames: MODE_TOGGLE_NAMES },
];
const MIN_DEPARTURES_TAB_STOP = 4;
const RADIUS_TAB_STOP = 5;

// Opens the page and waits until the stops and the coverage are shown.
async function openLoadedPage(page: Page) {
  const releaseStops = await holdStopsRequest(page);
  await page.goto("/");
  releaseStops();
  await expect(getLoadingStatus(page)).toBeHidden();
  await expect(getStopsSummary(page)).toBeVisible();
  await expect(getCoveredArea(page)).toBeVisible();
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
async function getFocusIndicator(page: Page): Promise<FocusIndicator> {
  return page.evaluate(async () => {
    // Alpha (0-255) of any CSS colour syntax, read back from a 1x1 canvas; an unparsable colour counts as transparent.
    function getAlpha(color: string) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return 0;
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3];
    }
    function isVisibleShadow(shadow: string) {
      const color = shadow.match(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/)?.[0] ?? "";
      const lengths = shadow.replace(color, "").match(/-?[\d.]+px/g) ?? [];
      return getAlpha(color) > 0 && lengths.some((length) => parseFloat(length) !== 0);
    }

    const focused = document.activeElement ?? document.body;
    const isSliderInput = focused instanceof HTMLInputElement && focused.type === "range";
    const indicatorElement = (isSliderInput ? focused.parentElement : focused) ?? focused;
    await Promise.all(indicatorElement.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(indicatorElement);
    const shadows = style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^(]*\))/);
    return {
      indicatorElement: `${indicatorElement.tagName.toLowerCase()}${isSliderInput ? " (slider thumb)" : ""}`,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      boxShadow: style.boxShadow,
      hasVisibleOutline: style.outlineStyle !== "none" && style.outlineWidth !== "0px" && getAlpha(style.outlineColor) > 0,
      hasVisibleBoxShadow: shadows.some(isVisibleShadow),
    };
  });
}

async function getPressedStates(page: Page, toggleNames: string[]) {
  return Promise.all(toggleNames.map((name) => getToggle(page, name).getAttribute("aria-pressed")));
}

// The innermost group (or radiogroup) that contains the given toggle.
function getGroupOf(page: Page, toggle: Locator) {
  return page.getByRole("group").or(page.getByRole("radiogroup")).filter({ has: toggle }).last();
}

function getTabStopLocators(page: Page) {
  return [
    ...TOGGLE_GROUPS.map((group) => getToggle(page, group.toggleNames[0])),
    getMinDeparturesSlider(page),
    getRadiusSlider(page),
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

test("Tab moves through the toggle groups, both sliders and the data link in order", async ({ page }) => {
  for (const tabStop of getTabStopLocators(page)) {
    await page.keyboard.press("Tab");
    await expect(tabStop).toBeFocused();
  }
});

test("every Tab stop shows a focus indicator", async ({ page }) => {
  for (const tabStop of getTabStopLocators(page)) {
    await page.keyboard.press("Tab");
    await expect(tabStop).toBeFocused();
    const focusIndicator = await getFocusIndicator(page);
    const hasIndicator = focusIndicator.hasVisibleOutline || focusIndicator.hasVisibleBoxShadow;
    expect.soft(hasIndicator, `focus indicator on ${tabStop}: ${JSON.stringify(focusIndicator)}`).toBe(true);
  }
});

test("arrow keys, Home and End move focus inside each toggle group without pressing", async ({ page }) => {
  for (const [groupIndex, group] of TOGGLE_GROUPS.entries()) {
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
  const [firstDay, secondDay] = DAY_TOGGLE_NAMES;
  const [firstBand, secondBand] = TIME_BAND_TOGGLE_NAMES;

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
    [MIN_DEPARTURES_TAB_STOP, getMinDeparturesSlider(page)],
    [RADIUS_TAB_STOP, getRadiusSlider(page)],
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

test("each toggle group has an accessible name", async ({ page }) => {
  for (const group of TOGGLE_GROUPS) {
    const toggleGroup = getGroupOf(page, getToggle(page, group.toggleNames[0]));
    await expect.soft(toggleGroup, `${group.label} group: role group/radiogroup with a name`).toHaveAccessibleName(/\S/);
  }
});

test("a slider's accessible name does not contain its current value", async ({ page }) => {
  for (const slider of [getMinDeparturesSlider(page), getRadiusSlider(page)]) {
    const value = await slider.inputValue();
    const valuePattern = new RegExp(`\\b${value}\\b`);
    await expect.soft(slider, `slider name must not contain its value ${value}`).not.toHaveAccessibleName(valuePattern);
  }
  await expect(getRadiusSlider(page), "radius is spoken with its unit").toHaveAttribute("aria-valuetext", RADIUS_VALUE_TEXT_PATTERN);
});
