// Slider onValueChange gives a number for single-thumb sliders and an array otherwise; we only use the first thumb.
export function getSliderValue(value: number | readonly number[]): number {
  return typeof value === "number" ? value : value[0];
}
