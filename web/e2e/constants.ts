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

// Request URL patterns used by the stubs.
export const STOPS_URL_PATTERN = "**/data/stops.geojson";
export const CARTO_URL_PATTERN = /^https:\/\/([a-z0-9-]+\.)*cartocdn\.com\//;

// Timeouts: playwright.config.ts holds all of them today; an e2e-only timeout would go here.
