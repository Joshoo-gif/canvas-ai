"use client";

import type { MutableRefObject } from "react";
import type { Artifact, HighlightedRange } from "./types";
import type { ThemeClasses } from "@/components/ui";

interface TextViewerProps {
  artifact: Artifact;
  highlightedRange: HighlightedRange | null;
  showLineNumbers: boolean;
  fontSize: number;
  tc: ThemeClasses;
  lineRefs: MutableRefObject<Record<string, HTMLElement | null>>;
}

/**
 * Renders Markdown / plain-text artifacts line by line with optional
 * line-number gutter and amber highlight for the active range.
 */
export default function TextViewer({
  artifact,
  highlightedRange,
  showLineNumbers,
  fontSize,
  tc,
  lineRefs,
}: TextViewerProps) {
  return (
    <div
      className="font-mono leading-relaxed select-text"
      style={{ fontSize: `${fontSize}px` }}
    >
      {artifact.content.map((line, index) => {
        const lineNum = index + 1;
        const isHighlighted =
          highlightedRange != null &&
          lineNum >= highlightedRange.startLine &&
          lineNum <= highlightedRange.endLine;

        const rowClass = isHighlighted ? tc.rowHighlight : tc.rowHover;
        const lineNumberClass = isHighlighted ? tc.lineNumHighlight : tc.lineNumDefault;
        const contentClass = isHighlighted ? tc.contentHighlight : tc.contentDefault;

        return (
          <div
            key={lineNum}
            ref={(el) => {
              lineRefs.current[`${artifact.id}-line-${lineNum}`] = el;
            }}
            className={`group flex items-start rounded py-0.5 px-2 transition-all duration-150 ${rowClass}`}
          >
            {showLineNumbers && (
              <span
                className={`mr-4 w-10 shrink-0 border-r pr-4 text-right select-none ${tc.border} ${lineNumberClass}`}
              >
                {lineNum}
              </span>
            )}
            <span className={`break-all whitespace-pre-wrap ${contentClass}`}>
              {line}
            </span>
          </div>
        );
      })}
    </div>
  );
}
