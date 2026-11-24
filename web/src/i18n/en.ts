import type { DayType, Mode, TimeBand } from "@/lib/geo/coverage";

// English UI text. Shaped like a next-intl message file (namespaces → keys) so it can move to en.json later.
export const messages = {
  RootLayout: {
    title: "Vienna transit accessibility",
    description: "Areas of Vienna within walking distance of frequent public transit.",
  },
  HomePage: {
    title: "Vienna transit accessibility",
  },
  ControlsPanel: {
    title: "Parameters",
    dayToggle: {
      label: "Day type",
      options: {
        weekday: "weekday",
        saturday: "saturday",
        sunday: "sunday",
      } satisfies Record<DayType, string>,
    },
    timeBandToggle: {
      label: "Time of day",
      options: {
        am: "am",
        midday: "midday",
        pm: "pm",
        evening: "evening",
      } satisfies Record<TimeBand, string>,
    },
    modeToggle: {
      label: "Transport modes",
      options: {
        tram: "tram",
        metro: "metro",
        rail: "rail",
        bus: "bus",
        other: "other",
      } satisfies Record<Mode, string>,
      // TODO(i18n): followed by the disabled modes' labels; turn into an ICU list ({modes}) once a localization package is added.
      unavailableHint: "No stops in the timetable data:",
    },
    minDeparturesSlider: {
      label: "Min. departures/hour:",
    },
    radiusSlider: {
      label: "Walking radius:",
      unit: "m",
    },
  },
  ResultsCard: {
    // TODO(i18n): the summaries are split around bold values; turn them into ICU rich text
    // (e.g. "<b>{qualifying}</b> of {total} stops qualify") and render with t.rich once a localization package is added.
    stopsSummary: {
      of: "of",
      suffix: "stops qualify",
    },
    coveredArea: {
      label: "Covered area:",
      unit: "km²",
    },
    viennaShare: {
      suffix: "% of Vienna, approx.",
    },
    loading: "Loading stops…",
    error: "Could not load stops. Please reload the page.",
  },
  DataAttribution: {
    // TODO(i18n): split around the link; turn into ICU rich text (<link>…</link>) once a localization package is added.
    prefix: "Timetable data: Wiener Linien (GTFS). Datenquelle: Stadt Wien –",
    link: "data.wien.gv.at",
    suffix: ", CC BY",
  },
  TransitMap: {
    // Given to MapLibre: the canvas uses mapLabel as its accessible name (role "region").
    mapLabel: "Map of qualifying stops and covered area",
    toggleAttributionLabel: "Toggle attribution",
  },
  LanguageSwitch: {
    // Names the navigation around the link to the other language.
    label: "Language",
  },
} as const;
