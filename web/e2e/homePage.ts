import type { Page } from "@playwright/test";
import { ATTRIBUTION_LINK_NAME, type PageTexts } from "./constants";

// Locators for the home page, found by role and accessible label. Assertions stay in the specs.
// Locators that depend on the page language take its texts.

export function getLoadingStatus(page: Page) {
  return page.getByRole("status");
}

// The loading text by its words. Waiting for it to disappear works whether or not the element that held it stays in
// the page (the status element will stay, to announce results), so this is how tests wait for the stops to load.
export function getLoadingText(page: Page, texts: PageTexts) {
  return page.getByText(texts.loadingText, { exact: true });
}

export function getStopsSummary(page: Page, texts: PageTexts) {
  return page.getByText(texts.stopsSummaryPattern);
}

export function getCoveredArea(page: Page, texts: PageTexts) {
  return page.getByText(texts.coveredAreaPattern);
}

// Any option toggle by its visible label: mode ("bus"), day ("weekday") or time band ("am").
export function getToggle(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

export function getMinDeparturesSlider(page: Page, texts: PageTexts) {
  return page.getByRole("slider", { name: texts.minDeparturesSliderName });
}

export function getRadiusSlider(page: Page, texts: PageTexts) {
  return page.getByRole("slider", { name: texts.radiusSliderName });
}

export function getAttributionLink(page: Page) {
  return page.getByRole("link", { name: ATTRIBUTION_LINK_NAME });
}

export function getMapRegion(page: Page, texts: PageTexts) {
  return page.getByRole("region", { name: texts.mapRegionName });
}

// The language switch: the link to the other language inside the navigation named for it.
export function getOtherLanguageLink(page: Page, texts: PageTexts) {
  return page.getByRole("navigation", { name: texts.languageNavName })
    .getByRole("link", { name: texts.otherLanguageLinkName, exact: true });
}

// The side panel (<aside>) with the title, the language switch, the controls, the results and the data credit.
export function getControlsPanel(page: Page) {
  return page.getByRole("complementary");
}
