import type { Page } from "@playwright/test";
import {
  ATTRIBUTION_LINK_NAME, COVERED_AREA_PATTERN, MAP_REGION_NAME, MIN_DEPARTURES_SLIDER_NAME,
  RADIUS_SLIDER_NAME, STOPS_SUMMARY_PATTERN,
} from "./constants";

// Locators for the home page, found by role and accessible label. Assertions stay in the specs.

export function getLoadingStatus(page: Page) {
  return page.getByRole("status");
}

export function getStopsSummary(page: Page) {
  return page.getByText(STOPS_SUMMARY_PATTERN);
}

export function getCoveredArea(page: Page) {
  return page.getByText(COVERED_AREA_PATTERN);
}

// Any option toggle by its visible label: mode ("bus"), day ("weekday") or time band ("am").
export function getToggle(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

export function getMinDeparturesSlider(page: Page) {
  return page.getByRole("slider", { name: MIN_DEPARTURES_SLIDER_NAME });
}

export function getRadiusSlider(page: Page) {
  return page.getByRole("slider", { name: RADIUS_SLIDER_NAME });
}

export function getAttributionLink(page: Page) {
  return page.getByRole("link", { name: ATTRIBUTION_LINK_NAME });
}

export function getMapRegion(page: Page) {
  return page.getByRole("region", { name: MAP_REGION_NAME });
}
