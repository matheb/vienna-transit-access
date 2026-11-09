import { Card, CardContent } from "@/components/ui/card";
import { HIDDEN_KEEPING_LAYOUT_STYLE, LAYOUT_RESERVING_COVERAGE, RESULTS_GRID_CELL_CLASS } from "@/constants/home";
import type { Coverage } from "@/lib/geo/coverage";
import { messages } from "@/i18n/en";
import { StopsLoadStatus } from "@/services/stopsService";

interface ResultsCardProps {
  loadStatus: StopsLoadStatus;
  qualifyingStopCount: number;
  totalStopCount: number;
  coverage: Coverage;
}

export default function ResultsCard({ loadStatus, qualifyingStopCount, totalStopCount, coverage }: ResultsCardProps) {
  const isReady = loadStatus === StopsLoadStatus.ready;
  const displayedCoverage = isReady ? coverage : LAYOUT_RESERVING_COVERAGE;

  return (
    <Card>
      <CardContent className="grid pt-6 text-sm">
        <div className={RESULTS_GRID_CELL_CLASS} style={isReady ? undefined : HIDDEN_KEEPING_LAYOUT_STYLE}>
          <p>
            <b>{qualifyingStopCount}</b> {messages.home.stopsSummary.of} {totalStopCount} {messages.home.stopsSummary.suffix}
          </p>
          <p>
            {messages.home.coveredArea.label} <b>{displayedCoverage.areaKm2.toFixed(1)} {messages.home.coveredArea.unit}</b>{" "}
            ({(displayedCoverage.viennaShare * 100).toFixed(0)}{messages.home.coveredArea.shareSuffix})
          </p>
        </div>
        {loadStatus === StopsLoadStatus.loading && <p role="status" className={RESULTS_GRID_CELL_CLASS}>{messages.home.stopsStatus.loading}</p>}
        {loadStatus === StopsLoadStatus.error && <p role="alert" className={RESULTS_GRID_CELL_CLASS}>{messages.home.stopsStatus.error}</p>}
      </CardContent>
    </Card>
  );
}
