import { Card, CardContent } from "@/components/ui/card";
import {
  AREA_FRACTION_DIGITS, RESULTS_ANNOUNCEMENT_DELAY_MS, RESULTS_MIN_HEIGHT_CLASS, WHOLE_NUMBER_FRACTION_DIGITS,
} from "@/constants/home";
import { useSettledAnnouncement } from "@/hooks/useSettledAnnouncement";
import type { Coverage } from "@/lib/geo/coverage";
import { useIntlLocale, useMessages } from "@/i18n/MessagesProvider";
import { getFormattedNumber } from "@/lib/format";
import { getResultsAnnouncement } from "@/lib/resultsAnnouncement";
import { StopsLoadStatus } from "@/services/stopsService";

interface ResultsCardProps {
  loadStatus: StopsLoadStatus;
  qualifyingStopCount: number;
  totalStopCount: number;
  coverage: Coverage;
}

export default function ResultsCard({ loadStatus, qualifyingStopCount, totalStopCount, coverage }: ResultsCardProps) {
  const messages = useMessages();
  const intlLocale = useIntlLocale();
  const isLoading = loadStatus === StopsLoadStatus.loading;
  // null while loading or after an error: there are no results to announce.
  const resultsText = loadStatus === StopsLoadStatus.ready
    ? getResultsAnnouncement(messages, intlLocale, { qualifyingStopCount, totalStopCount, coverage })
    : null;
  const announcement = useSettledAnnouncement(resultsText, RESULTS_ANNOUNCEMENT_DELAY_MS);
  return (
    <Card>
      <CardContent className="pt-6 text-sm">
        <div className={RESULTS_MIN_HEIGHT_CLASS}>
          {/* The page's one status element. It is always the first child, so React keeps the same DOM node in every state
              and screen readers keep tracking it as a live region. While loading it shows the loading text; afterwards
              it holds the settled results announcement, visually hidden (sr-only takes no space, so the card keeps its height). */}
          <p role="status" className={isLoading ? undefined : "sr-only"}>
            {isLoading ? messages.ResultsCard.loading : announcement}
          </p>
          {loadStatus === StopsLoadStatus.ready && (
            <>
              <p>
                <b>{getFormattedNumber(intlLocale, qualifyingStopCount, WHOLE_NUMBER_FRACTION_DIGITS)}</b> {messages.ResultsCard.stopsSummary.of}{" "}
                {getFormattedNumber(intlLocale, totalStopCount, WHOLE_NUMBER_FRACTION_DIGITS)} {messages.ResultsCard.stopsSummary.suffix}
              </p>
              <p>
                {messages.ResultsCard.coveredArea.label}{" "}
                <b>{getFormattedNumber(intlLocale, coverage.areaKm2, AREA_FRACTION_DIGITS)} {messages.ResultsCard.coveredArea.unit}</b>
              </p>
              <p>
                <b>{getFormattedNumber(intlLocale, coverage.viennaShare * 100, WHOLE_NUMBER_FRACTION_DIGITS)}</b>{messages.ResultsCard.viennaShare.suffix}
              </p>
            </>
          )}
          {loadStatus === StopsLoadStatus.error && <p role="alert">{messages.ResultsCard.error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
