"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DAY_TYPES, SELECTABLE_MODES, TIME_BANDS, filterStops, getCoverage,
  type DayType, type FilterParams, type Mode, type Stop, type TimeBand,
} from "@/lib/geo/coverage";
import { getSliderValue } from "@/lib/slider";
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
const MIN_DEPARTURES_SLIDER = { min: 0, max: 20, step: 1 };
const RADIUS_SLIDER = { min: 100, max: 800, step: 50 };

export default function Home() {
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [filterParams, setFilterParams] = useState<FilterParams>(DEFAULT_FILTER_PARAMS);

  useEffect(() => {
    fetchStops().then(setAllStops);
  }, []);

  const qualifyingStops = useMemo(() => filterStops(allStops, filterParams), [allStops, filterParams]);
  const coverage = useMemo(() => getCoverage(qualifyingStops, filterParams.radiusMeters), [qualifyingStops, filterParams.radiusMeters]);
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
  function handleMinDeparturesChange(value: number | readonly number[]) {
    updateFilterParam("minDeparturesPerHour", getSliderValue(value));
  }
  function handleRadiusChange(value: number | readonly number[]) {
    updateFilterParam("radiusMeters", getSliderValue(value));
  }

  return (
    <main className="flex h-screen flex-col md:flex-row">
      <aside className="w-full space-y-4 overflow-y-auto p-4 md:w-96">
        <h1 className="text-xl font-semibold">{homeMessages.title}</h1>
        <Card>
          <CardHeader><CardTitle>{homeMessages.parametersTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ToggleGroup value={[filterParams.day]} onValueChange={handleDayChange}>
              {DAY_TYPES.map((day) => <ToggleGroupItem key={day} value={day}>{messages.dayTypes[day]}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup value={[filterParams.band]} onValueChange={handleTimeBandChange}>
              {TIME_BANDS.map((band) => <ToggleGroupItem key={band} value={band}>{messages.timeBands[band]}</ToggleGroupItem>)}
            </ToggleGroup>
            <ToggleGroup multiple value={filterParams.modes} onValueChange={handleModesChange}>
              {SELECTABLE_MODES.map((mode) => <ToggleGroupItem key={mode} value={mode}>{messages.modes[mode]}</ToggleGroupItem>)}
            </ToggleGroup>
            <label className="block text-sm">{homeMessages.minDeparturesLabel} {filterParams.minDeparturesPerHour}
              <Slider {...MIN_DEPARTURES_SLIDER} value={[filterParams.minDeparturesPerHour]} onValueChange={handleMinDeparturesChange} />
            </label>
            <label className="block text-sm">{homeMessages.radiusLabel} {filterParams.radiusMeters} {homeMessages.radiusUnit}
              <Slider {...RADIUS_SLIDER} value={[filterParams.radiusMeters]} onValueChange={handleRadiusChange} />
            </label>
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
