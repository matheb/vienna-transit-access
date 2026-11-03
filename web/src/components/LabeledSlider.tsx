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
  onValueChange: (value: number) => void;
}

// Renders "<label> <value> [unit]" above a single-thumb slider.
export default function LabeledSlider({ label, value, unit, range, onValueChange }: LabeledSliderProps) {
  function handleSliderChange(sliderValue: number | readonly number[]) {
    onValueChange(getSliderValue(sliderValue));
  }

  return (
    <label className="block text-sm">{label} {value}{unit !== undefined && ` ${unit}`}
      <Slider {...range} value={[value]} onValueChange={handleSliderChange} />
    </label>
  );
}
