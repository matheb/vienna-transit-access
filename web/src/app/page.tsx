"use client";
import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ControlsPanel from "@/components/ControlsPanel";
import ResultsCard from "@/components/ResultsCard";
import { DEFAULT_FILTER_PARAMS } from "@/constants/home";
import { filterStops, getCoverage, type FilterParams, type Stop } from "@/lib/geo/coverage";
import { messages } from "@/i18n/en";
import { startStopsLoad } from "@/services/stopsLoader";
import { StopsLoadStatus } from "@/services/stopsService";

const TransitMap = dynamic(() => import("@/components/TransitMap"), { ssr: false });

export default function HomePage() {
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loadStatus, setLoadStatus] = useState<StopsLoadStatus>(StopsLoadStatus.loading);
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);

  useEffect(() => startStopsLoad(setAllStops, setLoadStatus), []);

  // Controls render from filterParams immediately; the map and numbers follow the deferred copy,
  // so slider thumbs stay smooth while the coverage (tens of ms) is recomputed.
  const deferredFilterParams = useDeferredValue(filterParams);
  const qualifyingStops = useMemo(() => filterStops(allStops, deferredFilterParams), [allStops, deferredFilterParams]);
  const coverage = useMemo(
    () => getCoverage(qualifyingStops, deferredFilterParams.radiusMeters),
    [qualifyingStops, deferredFilterParams.radiusMeters],
  );
  const updateFilterParam = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) =>
    setFilterParams((previous) => ({ ...previous, [key]: value }));

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="w-full space-y-4 overflow-y-auto p-4 md:w-96">
        <h1 className="text-xl font-semibold">{messages.HomePage.title}</h1>
        <ControlsPanel filterParams={filterParams} onFilterParamChange={updateFilterParam} />
        <ResultsCard
          loadStatus={loadStatus}
          qualifyingStopCount={qualifyingStops.length}
          totalStopCount={allStops.length}
          coverage={coverage}
        />
      </aside>
      <section className="h-[60vh] flex-1 md:h-auto">
        <TransitMap stops={{ type: "FeatureCollection", features: qualifyingStops }} area={coverage.polygon} />
      </section>
    </main>
  );
}
