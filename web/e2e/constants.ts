// Expected texts are literals on purpose: an e2e test checks what the user sees, so a changed label must fail.
// Never import them from src/.
export const PAGE_TITLE = "Vienna transit accessibility";
export const LOADING_TEXT = "Loading stops…";
export const STOPS_SUMMARY_PATTERN = /^\d+ of \d+ stops qualify$/;
export const COVERED_AREA_PATTERN = /^Covered area:/;
export const MIN_DEPARTURES_SLIDER_NAME = /^Min\. departures\/hour:/;
export const RADIUS_SLIDER_NAME = /^Walking radius:/;
export const MODE_TOGGLE_NAME = "bus";
export const ATTRIBUTION_LINK_NAME = "data.wien.gv.at";
export const ATTRIBUTION_URL = "https://data.wien.gv.at";
export const RADIUS_VALUE_TEXT_PATTERN = /^\d+ m$/;
export const DAY_TOGGLE_NAMES = ["weekday", "saturday", "sunday"];
export const TIME_BAND_TOGGLE_NAMES = ["am", "midday", "pm", "evening"];
export const MODE_TOGGLE_NAMES = ["tram", "metro", "rail", "bus"];

// axe rule tags: WCAG 2.0 and 2.1, levels A and AA.
export const AXE_WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Minimum contrast of a focus indicator against what it is drawn on (WCAG 1.4.11 non-text contrast).
export const MIN_FOCUS_INDICATOR_CONTRAST = 3;

// Request URL patterns used by the stubs.
export const STOPS_URL_PATTERN = "**/data/stops.geojson";
export const CARTO_URL_PATTERN = /^https:\/\/([a-z0-9-]+\.)*cartocdn\.com\//;

// Timeouts: playwright.config.ts holds all of them today; an e2e-only timeout would go here.
