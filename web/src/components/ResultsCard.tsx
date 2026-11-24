import { Card, CardContent } from "@/components/ui/card";
import { RESULTS_MIN_HEIGHT_CLASS } from "@/constants/home";
import type { Coverage } from "@/lib/geo/coverage";
import { useMessages } from "@/i18n/MessagesProvider";
import { StopsLoadStatus } from "@/services/stopsService";

interface ResultsCardProps {
  loadStatus: StopsLoadStatus;
  qualifyingStopCount: number;
  totalStopCount: number;
  coverage: Coverage;
}

export default function ResultsCard({ loadStatus, qualifyingStopCount, totalStopCount, coverage }: ResultsCardProps) {
  const messages = useMessages();
  return (
    <Card>
      <CardContent className="pt-6 text-sm">
        <div className={RESULTS_MIN_HEIGHT_CLASS}>
          {loadStatus === StopsLoadStatus.ready && (
            <>
              <p>
                <b>{qualifyingStopCount}</b> {messages.ResultsCard.stopsSummary.of} {totalStopCount} {messages.ResultsCard.stopsSummary.suffix}
              </p>
              <p>
                {messages.ResultsCard.coveredArea.label} <b>{coverage.areaKm2.toFixed(1)} {messages.ResultsCard.coveredArea.unit}</b>
              </p>
              <p>
                <b>{(coverage.viennaShare * 100).toFixed(0)}</b>{messages.ResultsCard.viennaShare.suffix}
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
