import { Card, CardContent } from "@/components/ui/card";
import { AREA_FRACTION_DIGITS, RESULTS_MIN_HEIGHT_CLASS, WHOLE_NUMBER_FRACTION_DIGITS } from "@/constants/home";
import type { Coverage } from "@/lib/geo/coverage";
import { useIntlLocale, useMessages } from "@/i18n/MessagesProvider";
import { getFormattedNumber } from "@/lib/format";
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
  return (
    <Card>
      <CardContent className="pt-6 text-sm">
        <div className={RESULTS_MIN_HEIGHT_CLASS}>
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
          {loadStatus === StopsLoadStatus.loading && <p role="status">{messages.ResultsCard.loading}</p>}
          {loadStatus === StopsLoadStatus.error && <p role="alert">{messages.ResultsCard.error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
