"use client";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Inline badge / pill — used for the highlighted line-range indicator
 * in the ArtifactViewer and wherever compact labels are needed.
 */
export default function Badge({ className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}
