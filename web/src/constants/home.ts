import type { SliderRange } from "@/components/LabeledSlider";
import { SELECTABLE_MODES, type FilterParams } from "@/lib/geo/coverage";

export const DEFAULT_FILTER_PARAMS: FilterParams = {
  day: "weekday",
  band: "am",
  minDeparturesPerHour: 4,
  radiusMeters: 400,
  modes: [...SELECTABLE_MODES],
};
export const MIN_DEPARTURES_SLIDER: SliderRange = { min: 0, max: 20, step: 1 };
export const RADIUS_SLIDER: SliderRange = { min: 100, max: 800, step: 50 };
// Spoken value of the radius slider (aria-valuetext), e.g. "400 m".
export const RADIUS_VALUE_FORMAT: Intl.NumberFormatOptions = { style: "unit", unit: "meter", unitDisplay: "short" };
// Decimal places of displayed numbers: counts, the share and slider values are whole; the area has one ("12.3 km²").
export const WHOLE_NUMBER_FRACTION_DIGITS = 0;
export const AREA_FRACTION_DIGITS = 1;

// Reserves the summary's three short lines (stops, area, share) in every state, so nothing below the card moves when the stops load.
export const RESULTS_MIN_HEIGHT_CLASS = "min-h-[3lh]";
