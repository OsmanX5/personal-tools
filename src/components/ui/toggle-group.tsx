"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToggleItem<T extends string> = T | { value: T; label: string };

interface ToggleGroupProps<T extends string> {
  items: readonly ToggleItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
  buttonClassName?: string;
}

function getItemValue<T extends string>(item: ToggleItem<T>): T {
  return typeof item === "string" ? item : item.value;
}

function getItemLabel<T extends string>(item: ToggleItem<T>): string {
  return typeof item === "string" ? item : item.label;
}

export function ToggleGroup<T extends string>({
  items,
  value,
  onValueChange,
  size = "sm",
  className,
  buttonClassName,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        // Scrolls sideways instead of overflowing on narrow screens.
        "scrollbar-none flex max-w-full gap-1 overflow-x-auto",
        className,
      )}
    >
      {items.map((item) => {
        const itemValue = getItemValue(item);
        const itemLabel = getItemLabel(item);
        return (
          <Button
            key={itemValue}
            type="button"
            size={size}
            variant={value === itemValue ? "default" : "outline"}
            className={buttonClassName}
            onClick={() => onValueChange(itemValue)}
          >
            {itemLabel}
          </Button>
        );
      })}
    </div>
  );
}
