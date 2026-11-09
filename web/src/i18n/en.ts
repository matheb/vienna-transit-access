import type { DayType, Mode, TimeBand } from "@/lib/geo/coverage";

// English UI text. Shaped like a next-intl message file (namespaces → keys) so it can move to en.json later.
export const messages = {
  metadata: {
    title: "Vienna transit accessibility",
    description: "Areas of Vienna within walking distance of frequent public transit.",
  },
  home: {
    title: "Vienna transit accessibility",
    parametersTitle: "Parameters",
    minDeparturesLabel: "Min. departures/hour:",
    radiusLabel: "Walking radius:",
    radiusUnit: "m",
    // TODO(i18n): the summaries are split around bold values; turn them into ICU rich text
    // (e.g. "<b>{qualifying}</b> of {total} stops qualify") and render with t.rich once a localization package is added.
    stopsSummary: {
      of: "of",
      suffix: "stops qualify",
    },
    coveredArea: {
      label: "Covered area:",
      unit: "km²",
      shareSuffix: "% of Vienna, approx.",
    },
    stopsStatus: {
      loading: "Loading stops…",
      error: "Could not load stops. Please reload the page.",
    },
  },
  dayTypes: {
    weekday: "weekday",
    saturday: "saturday",
    sunday: "sunday",
  } satisfies Record<DayType, string>,
  timeBands: {
    am: "am",
    midday: "midday",
    pm: "pm",
    evening: "evening",
  } satisfies Record<TimeBand, string>,
  modes: {
    tram: "tram",
    metro: "metro",
    rail: "rail",
    bus: "bus",
    other: "other",
  } satisfies Record<Mode, string>,
};
