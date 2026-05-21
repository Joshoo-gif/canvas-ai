"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { ToolCall } from "./types";
import type { ThemeClasses } from "@/components/ui";

interface ToolCallCardProps {
  toolCall: ToolCall;
  onToolCallClick?: (toolCall: ToolCall) => void;
  tc: ThemeClasses;
}

/**
 * A clickable card that represents a single tool invocation inside a
 * message thread. Clicking it navigates the ArtifactViewer to the
 * referenced file and line range.
 */
export default function ToolCallCard({
  toolCall,
  onToolCallClick,
  tc,
}: ToolCallCardProps) {
  const isClickable = !!toolCall.range;

  const statusOverrideClass =
    toolCall.status === "running"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : toolCall.status === "failed"
        ? "border-red-200 bg-red-50 text-red-800"
        : "";

  return (
    <button
      type="button"
      onClick={() => isClickable && onToolCallClick?.(toolCall)}
      className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${tc.toolCard} ${tc.border} ${
        isClickable ? tc.toolCardHover : ""
      } ${statusOverrideClass}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {toolCall.status === "running" ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600" />
        ) : toolCall.status === "failed" ? (
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        )}

        <span className="truncate font-mono">
          <strong className={tc.textPrimary}>{toolCall.name}</strong>{" "}
          {toolCall.target}
          {toolCall.range && (
            <span className="ml-1.5 rounded border border-[#E7E5E4] bg-[#F5F5F4] px-1.5 py-0.5 text-[10px] font-bold text-[#404040]">
              L{toolCall.range.startLine}–{toolCall.range.endLine}
            </span>
          )}
        </span>
      </div>

      {isClickable && (
        <ArrowRight
          className={`h-3 w-3 shrink-0 transition-all group-hover:translate-x-0.5 ${tc.textSecondary}`}
        />
      )}
    </button>
  );
}
