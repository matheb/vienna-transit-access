"use client";
import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LabeledSlider, { type SliderRange } from "@/components/LabeledSlider";
import OptionToggleGroup from "@/components/OptionToggleGroup";
import {
  DAY_TYPES, SELECTABLE_MODES, TIME_BANDS, filterStops, getCoverage,
  type DayType, type FilterParams, type Mode, type Stop, type TimeBand,
} from "@/lib/geo/coverage";
import { messages } from "@/i18n/en";
import { fetchStops } from "@/services/stopsService";

const TransitMap = dynamic(() => import("@/components/TransitMap"), { ssr: false });

const homeMessages = messages.home;

const DEFAULT_FILTER_PARAMS: FilterParams = {
  day: "weekday",
  band: "am",
  minDeparturesPerHour: 4,
  radiusMeters: 400,
  modes: [...SELECTABLE_MODES],
};
const MIN_DEPARTURES_SLIDER: SliderRange = { min: 0, max: 20, step: 1 };
const RADIUS_SLIDER: SliderRange = { min: 100, max: 800, step: 50 };

export default function Home() {
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);

  useEffect(() => {
    fetchStops().then(setAllStops);
  }, []);

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

  // Single-select toggle groups report [] when the active item is clicked again; keep the current value then.
  function handleDayChange(value: string[]) {
    if (value[0]) updateFilterParam("day", value[0] as DayType);
  }
  function handleTimeBandChange(value: string[]) {
    if (value[0]) updateFilterParam("band", value[0] as TimeBand);
  }
  function handleModesChange(value: string[]) {
    updateFilterParam("modes", value as Mode[]);
  }
  function handleMinDeparturesChange(value: number) {
    updateFilterParam("minDeparturesPerHour", value);
  }
  function handleRadiusChange(value: number) {
    updateFilterParam("radiusMeters", value);
  }

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="w-full space-y-4 overflow-y-auto p-4 md:w-96">
        <h1 className="text-xl font-semibold">{homeMessages.title}</h1>
        <Card>
          <CardHeader><CardTitle>{homeMessages.parametersTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <OptionToggleGroup options={DAY_TYPES} labels={messages.dayTypes} value={[filterParams.day]} onValueChange={handleDayChange} />
            <OptionToggleGroup options={TIME_BANDS} labels={messages.timeBands} value={[filterParams.band]} onValueChange={handleTimeBandChange} />
            <OptionToggleGroup multiple options={SELECTABLE_MODES} labels={messages.modes} value={filterParams.modes} onValueChange={handleModesChange} />
            <LabeledSlider
              label={homeMessages.minDeparturesLabel}
              value={filterParams.minDeparturesPerHour}
              range={MIN_DEPARTURES_SLIDER}
              onValueChange={handleMinDeparturesChange}
            />
            <LabeledSlider
              label={homeMessages.radiusLabel}
              value={filterParams.radiusMeters}
              unit={homeMessages.radiusUnit}
              range={RADIUS_SLIDER}
              onValueChange={handleRadiusChange}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-sm">
            <p>
              <b>{qualifyingStops.length}</b> {homeMessages.stopsSummary.of} {allStops.length} {homeMessages.stopsSummary.suffix}
            </p>
            <p>
              {homeMessages.coveredArea.label} <b>{coverage.areaKm2.toFixed(1)} {homeMessages.coveredArea.unit}</b>{" "}
              ({(coverage.viennaShare * 100).toFixed(0)}{homeMessages.coveredArea.shareSuffix})
            </p>
          </CardContent>
        </Card>
      </aside>
      <section className="h-[60vh] flex-1 md:h-auto">
        <TransitMap stops={{ type: "FeatureCollection", features: qualifyingStops }} area={coverage.polygon} />
      </section>
    </main>
  );
}
