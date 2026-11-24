// The modes the tests know, as in stops.geojson ("modes"); the toggles follow the data.
type TestedMode = "tram" | "metro" | "rail" | "bus";

// What one page language shows. Every language must have all of these.
export interface PageTexts {
  pageTitle: string;
  loadingText: string;
  stopsSummaryPattern: RegExp;
  coveredAreaPattern: RegExp;
  // Words that only appear when results are shown; the server HTML must contain neither.
  stopsSummaryText: string;
  areaUnitText: string;
  minDeparturesSliderName: RegExp;
  radiusSliderName: RegExp;
  radiusValueTextPattern: RegExp;
  dayToggleNames: string[];
  timeBandToggleNames: string[];
  // Toggle label per data mode, in the order the toggles appear.
  modeToggleNames: Record<TestedMode, string>;
  unavailableModesHintPrefix: string;
  mapRegionName: string;
}

// Expected texts per page language. They are literals on purpose: an e2e test checks what the user sees, so a changed
// label must fail. Never import them from src/.
export const TEXT = {
  en: {
    pageTitle: "Vienna transit accessibility",
    loadingText: "Loading stops…",
    stopsSummaryPattern: /^\d+ of \d+ stops qualify$/,
    coveredAreaPattern: /^Covered area:/,
    stopsSummaryText: "stops qualify",
    areaUnitText: "km²",
    minDeparturesSliderName: /^Min\. departures\/hour:/,
    radiusSliderName: /^Walking radius:/,
    radiusValueTextPattern: /^\d+ m$/,
    dayToggleNames: ["weekday", "saturday", "sunday"],
    timeBandToggleNames: ["am", "midday", "pm", "evening"],
    modeToggleNames: { tram: "tram", metro: "metro", rail: "rail", bus: "bus" },
    unavailableModesHintPrefix: "No stops in the timetable data:",
    mapRegionName: "Map of qualifying stops and covered area",
  },
} satisfies Record<string, PageTexts>;

// The same in every language.
export const ATTRIBUTION_LINK_NAME = "data.wien.gv.at";
export const ATTRIBUTION_URL = "https://data.wien.gv.at";
export const STOPS_DATA_PATH = "/data/stops.geojson";

// Routes: / sends visitors to the English page; a language we do not offer has no page.
export const ENGLISH_PATH = "/en";
export const UNSUPPORTED_LOCALE_PATH = "/fr";
export const TEMPORARY_REDIRECT_STATUS = 307;
export const NOT_FOUND_STATUS = 404;
// The live site; hreflang links are absolute URLs on it (metadataBase).
export const SITE_URL = "https://vienna-transit-access.vercel.app";

// axe rule tags: WCAG 2.0 and 2.1, levels A and AA.
export const AXE_WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Minimum contrast of a focus indicator against what it is drawn on (WCAG 1.4.11 non-text contrast).
export const MIN_FOCUS_INDICATOR_CONTRAST = 3;

// Phone viewport (390 x 844 CSS px) and the smallest share of its height the map must get there.
export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const MIN_MAP_VIEWPORT_SHARE = 0.5;

// Request URL patterns used by the stubs.
export const STOPS_URL_PATTERN = "**/data/stops.geojson";
export const CARTO_URL_PATTERN = /^https:\/\/([a-z0-9-]+\.)*cartocdn\.com\//;
// The self-hosted web font (next/font); blocking it makes the page render with the fallback font.
export const FONT_URL_PATTERN = "**/_next/static/media/*.woff2";

// Timeouts: playwright.config.ts holds all of them today; an e2e-only timeout would go here.
