import { Slider } from "@/components/ui/slider";
import { getSliderValue } from "@/lib/slider";

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

interface LabeledSliderProps {
  label: string;
  value: number;
  unit?: string;
  range: SliderRange;
  valueFormat?: Intl.NumberFormatOptions;
  onValueChange: (value: number) => void;
}

// Renders "<label> <value> [unit]" above a single-thumb slider.
// The visible value is aria-hidden so the slider's accessible name is only the label; screen readers read the value
// from the slider itself (aria-valuenow, or aria-valuetext formatted with valueFormat).
export default function LabeledSlider({ label, value, unit, range, valueFormat, onValueChange }: LabeledSliderProps) {
  function handleSliderChange(sliderValue: number | readonly number[]) {
    onValueChange(getSliderValue(sliderValue));
  }

  return (
    <label className="block text-sm">{label}{" "}
      <span aria-hidden="true">{value}{unit !== undefined && ` ${unit}`}</span>
      <Slider {...range} format={valueFormat} value={[value]} onValueChange={handleSliderChange} />
    </label>
  );
}
