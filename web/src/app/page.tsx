"use client";
import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ControlsPanel from "@/components/ControlsPanel";
import DataAttribution from "@/components/DataAttribution";
import ResultsCard from "@/components/ResultsCard";
import { DEFAULT_FILTER_PARAMS } from "@/constants/home";
import { SELECTABLE_MODES, filterStops, getAvailableModes, getCoverage, type FilterParams, type Stop } from "@/lib/geo/coverage";
import { useMessages } from "@/i18n/MessagesProvider";
import { startStopsLoad } from "@/services/stopsLoader";
import { StopsLoadStatus } from "@/services/stopsService";

const TransitMap = dynamic(() => import("@/components/TransitMap"), { ssr: false });

export default function HomePage() {
  const messages = useMessages();
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loadStatus, setLoadStatus] = useState<StopsLoadStatus>(StopsLoadStatus.loading);
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);

  useEffect(() => startStopsLoad(setAllStops, setLoadStatus), []);

  // Until the stops are loaded, which modes have stops is unknown, so every mode stays enabled.
  const availableModes = useMemo(
    () => (loadStatus === StopsLoadStatus.ready ? getAvailableModes(allStops) : [...SELECTABLE_MODES]),
    [allStops, loadStatus],
  );

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
    <main className="flex h-dvh flex-col md:h-screen md:flex-row">
      <aside className="min-h-0 w-full flex-1 space-y-4 overflow-y-auto p-4 md:w-96 md:flex-initial">
        <h1 className="text-xl font-semibold">{messages.HomePage.title}</h1>
        <ControlsPanel filterParams={filterParams} availableModes={availableModes} onFilterParamChange={updateFilterParam} />
        <ResultsCard
          loadStatus={loadStatus}
          qualifyingStopCount={qualifyingStops.length}
          totalStopCount={allStops.length}
          coverage={coverage}
        />
        <DataAttribution />
      </aside>
      <section className="order-first h-[55dvh] shrink-0 md:order-none md:h-auto md:flex-1">
        <TransitMap stops={{ type: "FeatureCollection", features: qualifyingStops }} area={coverage.polygon} />
      </section>
    </main>
  );
}
