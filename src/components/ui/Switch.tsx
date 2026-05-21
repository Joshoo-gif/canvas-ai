"use client";

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  trackClass: string;
  knobClass: string;
  label: string;
}

/**
 * An accessible toggle switch used in the settings panel.
 * Colour logic is passed in via `trackClass` / `knobClass` so that the
 * primitive stays theme-agnostic.
 */
export default function Switch({
  id,
  checked,
  onChange,
  trackClass,
  knobClass,
  label,
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${trackClass}`}
    >
      <span
        className={`absolute h-3.5 w-3.5 rounded-full shadow-sm transition-transform ${knobClass} ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}
