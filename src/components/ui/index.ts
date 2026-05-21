/**
 * Barrel export for the shared UI primitive library.
 * Import from "@/components/ui" rather than from individual files so that
 * future renames / moves only need a single update here.
 */
export { default as Badge } from "./Badge";
export { default as IconButton } from "./IconButton";
export { default as SegmentedControl } from "./SegmentedControl";
export { default as StatusDot } from "./StatusDot";
export { default as Switch } from "./Switch";
export { useThemeClasses } from "./useThemeClasses";
export type { ThemeClasses } from "./useThemeClasses";
