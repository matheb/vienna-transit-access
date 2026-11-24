import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface OptionToggleGroupProps<T extends string> {
  groupLabel: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onValueChange: (value: string[]) => void;
  multiple?: boolean;
  disabledOptions?: readonly T[];
  // Shown under the group, followed by the disabled options' labels, while any option is disabled.
  // Its line is always reserved when given, so nothing below moves when options become disabled.
  disabledHint?: string;
}

// groupLabel names the whole group for screen readers (aria-label); it is not shown on screen.
export default function OptionToggleGroup<T extends string>({
  groupLabel, options, labels, value, onValueChange, multiple = false, disabledOptions = [], disabledHint,
}: OptionToggleGroupProps<T>) {
  const hintId = useId();
  const hasDisabledOptions = disabledOptions.length > 0;
  return (
    <div className="space-y-1.5">
      {/* flex-wrap: longer labels (German time bands) move to a second row instead of overflowing the panel. */}
      <ToggleGroup aria-label={groupLabel} multiple={multiple} value={value} onValueChange={onValueChange} className="flex-wrap">
        {options.map((option) => {
          const isDisabled = disabledOptions.includes(option);
          return (
            <ToggleGroupItem key={option} value={option} disabled={isDisabled} aria-describedby={isDisabled && disabledHint !== undefined ? hintId : undefined}>
              {labels[option]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {disabledHint !== undefined && (
        <p id={hintId} className="min-h-4 text-xs text-muted-foreground">
          {hasDisabledOptions && `${disabledHint} ${disabledOptions.map((option) => labels[option]).join(", ")}`}
        </p>
      )}
    </div>
  );
}
