import { AREA_FRACTION_DIGITS, WHOLE_NUMBER_FRACTION_DIGITS } from "@/constants/home";
import type { Messages } from "@/i18n/types";
import { getFormattedNumber } from "@/lib/format";
import type { Coverage } from "@/lib/geo/coverage";

// Joins the card's three lines into one sentence, so a screen reader hears one announcement.
const LINE_SEPARATOR = ". ";

interface ResultsAnnouncementInput {
  qualifyingStopCount: number;
  totalStopCount: number;
  coverage: Coverage;
}

// The results card's three lines (stops, covered area, share of Vienna) as one sentence for screen readers, built from
// the same texts, number formats and digits as the card, so what is spoken matches what is shown.
export function getResultsAnnouncement(
  messages: Messages,
  intlLocale: string,
  { qualifyingStopCount, totalStopCount, coverage }: ResultsAnnouncementInput,
): string {
  const { stopsSummary, coveredArea, viennaShare } = messages.ResultsCard;
  const stopsLine = `${getFormattedNumber(intlLocale, qualifyingStopCount, WHOLE_NUMBER_FRACTION_DIGITS)} ${stopsSummary.of} `
    + `${getFormattedNumber(intlLocale, totalStopCount, WHOLE_NUMBER_FRACTION_DIGITS)} ${stopsSummary.suffix}`;
  const areaLine = `${coveredArea.label} ${getFormattedNumber(intlLocale, coverage.areaKm2, AREA_FRACTION_DIGITS)} ${coveredArea.unit}`;
  const shareLine = `${getFormattedNumber(intlLocale, coverage.viennaShare * 100, WHOLE_NUMBER_FRACTION_DIGITS)}${viennaShare.suffix}`;
  return [stopsLine, areaLine, shareLine].join(LINE_SEPARATOR);
}
