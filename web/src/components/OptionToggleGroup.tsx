import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface OptionToggleGroupProps<T extends string> {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onValueChange: (value: string[]) => void;
  multiple?: boolean;
}

export default function OptionToggleGroup<T extends string>({ options, labels, value, onValueChange, multiple = false }: OptionToggleGroupProps<T>) {
  return (
    <ToggleGroup multiple={multiple} value={value} onValueChange={onValueChange}>
      {options.map((option) => <ToggleGroupItem key={option} value={option}>{labels[option]}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}
