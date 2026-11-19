import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface OptionToggleGroupProps<T extends string> {
  groupLabel: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onValueChange: (value: string[]) => void;
  multiple?: boolean;
}

// groupLabel names the whole group for screen readers (aria-label); it is not shown on screen.
export default function OptionToggleGroup<T extends string>({ groupLabel, options, labels, value, onValueChange, multiple = false }: OptionToggleGroupProps<T>) {
  return (
    <ToggleGroup aria-label={groupLabel} multiple={multiple} value={value} onValueChange={onValueChange}>
      {options.map((option) => <ToggleGroupItem key={option} value={option}>{labels[option]}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}
