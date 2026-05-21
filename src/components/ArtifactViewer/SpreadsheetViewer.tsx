"use client";

import type { MutableRefObject } from "react";
import type { Artifact, HighlightedRange } from "./types";
import type { ThemeClasses } from "@/components/ui";

interface SpreadsheetViewerProps {
  artifact: Artifact;
  highlightedRange: HighlightedRange | null;
  showLineNumbers: boolean;
  fontSize: number;
  tc: ThemeClasses;
  lineRefs: MutableRefObject<Record<string, HTMLElement | null>>;
}

/**
 * Renders CSV artifacts as a styled HTML table with optional row-number
 * column and amber highlighting for the active range.
 */
export default function SpreadsheetViewer({
  artifact,
  highlightedRange,
  showLineNumbers,
  fontSize,
  tc,
  lineRefs,
}: SpreadsheetViewerProps) {
  const rows = artifact.content.map((line) => line.split(","));
  if (rows.length === 0) return null;

  const [headers, ...dataRows] = rows;

  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`min-w-full divide-y text-left ${tc.border}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <thead className={tc.surface}>
          <tr>
            {showLineNumbers && (
              <th
                className={`w-12 border-b border-r px-4 py-2.5 text-center font-medium ${tc.border} ${tc.textSecondary}`}
              >
                #
              </th>
            )}
            {headers.map((header, pos) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static header list
              <th
                key={`header-${header}-${pos}`}
                className={`border-b border-r px-4 py-2.5 text-left font-semibold tracking-tight ${tc.border} ${tc.textPrimary}`}
              >
                {header.replace(/"/g, "")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={`divide-y ${tc.border}`}>
          {dataRows.map((row, rowIdx) => {
            const lineNum = rowIdx + 2;
            const isHighlighted =
              highlightedRange != null &&
              lineNum >= highlightedRange.startLine &&
              lineNum <= highlightedRange.endLine;

            const rowClass = isHighlighted ? tc.rowHighlight : tc.rowHover;
            const rowNumberClass = isHighlighted
              ? tc.lineNumHighlight
              : tc.textSecondary;
            const cellClass = isHighlighted ? tc.contentHighlight : tc.textSecondary;

            return (
              <tr
                key={`row-${lineNum}`}
                ref={(el) => {
                  lineRefs.current[`${artifact.id}-line-${lineNum}`] = el;
                }}
                className={`transition-colors duration-150 ${rowClass}`}
              >
                {showLineNumbers && (
                  <td
                    className={`border-r px-4 py-2.5 text-center font-mono text-xs select-none ${tc.border} ${rowNumberClass}`}
                  >
                    {lineNum}
                  </td>
                )}
                {row.map((cell, cellPos) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable column order
                  <td
                    key={`row-${lineNum}-cell-${cellPos}`}
                    className={`max-w-[200px] truncate border-r px-4 py-2.5 font-mono ${tc.border} ${cellClass}`}
                  >
                    {cell.replace(/"/g, "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
