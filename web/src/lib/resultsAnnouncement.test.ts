import { describe, expect, it } from "vitest";
import { messages as germanMessages } from "@/i18n/de";
import { messages as englishMessages } from "@/i18n/en";
import { getResultsAnnouncement } from "@/lib/resultsAnnouncement";

const RESULTS = { qualifyingStopCount: 2, totalStopCount: 5, coverage: { polygon: null, areaKm2: 12.34, viennaShare: 0.034 } };
const EMPTY_RESULTS = { qualifyingStopCount: 0, totalStopCount: 5, coverage: { polygon: null, areaKm2: 0, viennaShare: 0 } };

describe("getResultsAnnouncement", () => {
  it("joins the three English card lines into one sentence", () => {
    expect(getResultsAnnouncement(englishMessages, "en", RESULTS))
      .toBe("2 of 5 stops qualify. Covered area: 12.3 km². 3% of Vienna, approx.");
  });

  it("uses the German texts and de-AT numbers, keeping the no-break space before %", () => {
    expect(getResultsAnnouncement(germanMessages, "de-AT", RESULTS))
      .toBe("2 von 5 Haltestellen erfüllen die Kriterien. Abgedeckte Fläche: 12,3 km². 3 % von Wien (ca.)");
  });

  it("formats zero results like the card: 0 and 0.0", () => {
    expect(getResultsAnnouncement(englishMessages, "en", EMPTY_RESULTS))
      .toBe("0 of 5 stops qualify. Covered area: 0.0 km². 0% of Vienna, approx.");
  });
});
