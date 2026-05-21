"use client";

interface StatusDotProps {
  status: string;
}

/**
 * Renders a coloured dot + label for agent status in the CommandCenter header.
 * Status semantics: "Idle" → neutral, "Compiling" → amber, anything else → green.
 */
export default function StatusDot({ status }: StatusDotProps) {
  const dotClass = status.includes("Idle")
    ? "bg-[#A8A29E]"
    : status.includes("Compiling")
      ? "bg-amber-500 animate-pulse"
      : "bg-emerald-500 animate-pulse";

  const textClass = status.includes("Idle")
    ? "text-[#A8A29E]"
    : status.includes("Compiling")
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-medium ${textClass}`}>{status}</span>
    </div>
  );
}
