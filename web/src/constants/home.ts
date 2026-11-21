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

// Reserves the two-line summary's height in every state, so nothing below the card moves when the stops load.
export const RESULTS_MIN_HEIGHT_CLASS = "min-h-[2lh]";
