"use client";

import type React from "react";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Descriptive label for accessibility */
  label: string;
  /** Tailwind class string for icon + hover colours */
  colorClass: string;
  /** Optional size class (default: h-8 w-8) */
  sizeClass?: string;
  /** Optional shape class (default: rounded-lg) */
  shapeClass?: string;
  children: React.ReactNode;
}

/**
 * A small, accessible icon button used consistently across the workspace.
 * Pass `colorClass` with the full hover/active token strings derived from
 * `useThemeClasses` so theme logic stays outside this primitive.
 */
export default function IconButton({
  label,
  colorClass,
  sizeClass = "h-8 w-8",
  shapeClass = "rounded-lg",
  children,
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center transition-colors ${sizeClass} ${shapeClass} ${colorClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
