"use client";

interface SegmentOption<T extends string> {
  value: T;
  label?: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T> | T>;
  value: T;
  onChange: (next: T) => void;
  activeClass: string;
  inactiveClass: string;
  baseClass?: string;
}

/**
 * A horizontal row of mutually exclusive buttons — used for Theme and
 * Density pickers in the settings panel.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  activeClass,
  inactiveClass,
  baseClass = "h-9 flex-1 rounded-lg border text-xs font-medium capitalize transition-all",
}: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const optValue = typeof opt === "string" ? opt : opt.value;
        const optLabel = typeof opt === "string" ? opt : (opt.label ?? opt.value);
        const isActive = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}
