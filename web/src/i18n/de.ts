import type { Messages } from "./types";

// German UI text for /de. Same keys as en.ts (messages.test.ts checks this); satisfies Messages makes a missing or
// misspelled key fail typecheck.
export const messages = {
  RootLayout: {
    title: "Öffi-Erreichbarkeit in Wien",
    description: "Gebiete in Wien, die zu Fuß nah an häufig fahrenden öffentlichen Verkehrsmitteln liegen.",
  },
  HomePage: {
    title: "Öffi-Erreichbarkeit in Wien",
  },
  ControlsPanel: {
    title: "Parameter",
    dayToggle: {
      label: "Verkehrstag",
      options: {
        weekday: "Werktag",
        saturday: "Samstag",
        sunday: "Sonntag",
      },
    },
    timeBandToggle: {
      label: "Tageszeit",
      options: {
        am: "morgens",
        midday: "mittags",
        pm: "nachmittags",
        evening: "abends",
      },
    },
    modeToggle: {
      label: "Verkehrsmittel",
      options: {
        tram: "Straßenbahn",
        metro: "U-Bahn",
        rail: "Bahn",
        bus: "Bus",
        other: "Sonstige",
      },
      // TODO(i18n): followed by the disabled modes' labels; turn into an ICU list ({modes}) once a localization package is added.
      unavailableHint: "Keine Haltestellen im Datensatz:",
    },
    minDeparturesSlider: {
      label: "Min. Abfahrten/Stunde:",
    },
    radiusSlider: {
      label: "Gehradius:",
      unit: "m",
    },
  },
  ResultsCard: {
    // TODO(i18n): the summaries are split around bold values; turn them into ICU rich text
    // (e.g. "<b>{qualifying}</b> von {total} Haltestellen erfüllen die Kriterien") and render with t.rich once a localization package is added.
    stopsSummary: {
      of: "von",
      suffix: "Haltestellen erfüllen die Kriterien",
    },
    coveredArea: {
      label: "Abgedeckte Fläche:",
      unit: "km²",
    },
    viennaShare: {
      suffix: " % von Wien (ca.)",
    },
    loading: "Haltestellen werden geladen…",
    error: "Haltestellen konnten nicht geladen werden. Bitte die Seite neu laden.",
  },
  DataAttribution: {
    // TODO(i18n): split around the link; turn into ICU rich text (<link>…</link>) once a localization package is added.
    prefix: "Fahrplandaten: Wiener Linien (GTFS). Datenquelle: Stadt Wien –",
    link: "data.wien.gv.at",
    suffix: ", CC BY",
  },
  TransitMap: {
    mapLabel: "Karte der qualifizierenden Haltestellen und der abgedeckten Fläche",
    toggleAttributionLabel: "Quellenangaben ein-/ausblenden",
  },
  LanguageSwitch: {
    label: "Sprache",
  },
} satisfies Messages;
