import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LabeledSlider from "@/components/LabeledSlider";
import OptionToggleGroup from "@/components/OptionToggleGroup";
import { MIN_DEPARTURES_SLIDER, RADIUS_SLIDER, RADIUS_VALUE_FORMAT } from "@/constants/home";
import {
  DAY_TYPES, SELECTABLE_MODES, TIME_BANDS,
  type DayType, type FilterParams, type Mode, type TimeBand,
} from "@/lib/geo/coverage";
import { messages } from "@/i18n/en";

interface ControlsPanelProps {
  filterParams: FilterParams;
  availableModes: readonly Mode[];
  onFilterParamChange: <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => void;
}

export default function ControlsPanel({ filterParams, availableModes, onFilterParamChange }: ControlsPanelProps) {
  // A mode without stops is shown disabled and never pressed, even if the filter still contains it.
  const pressedModes = filterParams.modes.filter((mode) => availableModes.includes(mode));
  const unavailableModes = SELECTABLE_MODES.filter((mode) => !availableModes.includes(mode));

  // Single-select toggle groups report [] when the active item is clicked again; keep the current value then.
  function handleDayChange(value: string[]) {
    if (value[0]) onFilterParamChange("day", value[0] as DayType);
  }
  function handleTimeBandChange(value: string[]) {
    if (value[0]) onFilterParamChange("band", value[0] as TimeBand);
  }
  function handleModesChange(value: string[]) {
    onFilterParamChange("modes", value as Mode[]);
  }
  function handleMinDeparturesChange(value: number) {
    onFilterParamChange("minDeparturesPerHour", value);
  }
  function handleRadiusChange(value: number) {
    onFilterParamChange("radiusMeters", value);
  }

  return (
    <Card>
      <CardHeader><CardTitle>{messages.ControlsPanel.title}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <OptionToggleGroup groupLabel={messages.ControlsPanel.dayToggle.label} options={DAY_TYPES} labels={messages.ControlsPanel.dayToggle.options} value={[filterParams.day]} onValueChange={handleDayChange} />
        <OptionToggleGroup groupLabel={messages.ControlsPanel.timeBandToggle.label} options={TIME_BANDS} labels={messages.ControlsPanel.timeBandToggle.options} value={[filterParams.band]} onValueChange={handleTimeBandChange} />
        <OptionToggleGroup
          multiple
          groupLabel={messages.ControlsPanel.modeToggle.label}
          options={SELECTABLE_MODES}
          labels={messages.ControlsPanel.modeToggle.options}
          value={pressedModes}
          disabledOptions={unavailableModes}
          disabledHint={messages.ControlsPanel.modeToggle.unavailableHint}
          onValueChange={handleModesChange}
        />
        <LabeledSlider
          label={messages.ControlsPanel.minDeparturesSlider.label}
          value={filterParams.minDeparturesPerHour}
          range={MIN_DEPARTURES_SLIDER}
          onValueChange={handleMinDeparturesChange}
        />
        <LabeledSlider
          label={messages.ControlsPanel.radiusSlider.label}
          value={filterParams.radiusMeters}
          unit={messages.ControlsPanel.radiusSlider.unit}
          range={RADIUS_SLIDER}
          valueFormat={RADIUS_VALUE_FORMAT}
          onValueChange={handleRadiusChange}
        />
      </CardContent>
    </Card>
  );
}
