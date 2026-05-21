"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Artifact, HighlightedRange } from "./types";
import type { ThemeClasses } from "@/components/ui";
import { parseCsvRows } from "@/lib/workspace-files/csv";

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
  const rows = parseCsvRows(artifact.content.join("\n"));
  const bottomScrollbarRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bottomScrollbar = bottomScrollbarRef.current;
    const tableScroll = tableScrollRef.current;

    if (!bottomScrollbar || !tableScroll) return;

    const syncBottomFromTable = () => {
      bottomScrollbar.scrollLeft = tableScroll.scrollLeft;
    };

    const syncTableFromBottom = () => {
      tableScroll.scrollLeft = bottomScrollbar.scrollLeft;
    };

    bottomScrollbar.addEventListener("scroll", syncTableFromBottom, { passive: true });
    tableScroll.addEventListener("scroll", syncBottomFromTable, { passive: true });

    return () => {
      bottomScrollbar.removeEventListener("scroll", syncTableFromBottom);
      tableScroll.removeEventListener("scroll", syncBottomFromTable);
    };
  }, [artifact.id]);

  if (rows.length === 0) return null;

  const [headers, ...dataRows] = rows;
  const widestRowColumnCount = dataRows.reduce(
    (max, row) => Math.max(max, row.length),
    headers.length,
  );
  const scrollbarWidth = Math.max(
    1200,
    widestRowColumnCount * 220 + (showLineNumbers ? 56 : 0),
  );

  return (
    <div ref={tableScrollRef} className="flex h-full min-h-0 w-full flex-col overflow-auto">
      <div
        ref={bottomScrollbarRef}
        className="sticky bottom-0 z-20 h-4 overflow-x-auto overflow-y-hidden bg-transparent"
        aria-label="Table horizontal scrollbar"
      >
        <div className="h-px min-w-max">
          <div className="h-px" style={{ width: `${scrollbarWidth}px` }} />
        </div>
      </div>

      <div className="w-full">
        <table
          className={`min-w-full border-collapse border-spacing-0 text-left ${tc.border}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <thead className={tc.surface}>
            <tr>
              {showLineNumbers && (
                <th
                  className={`w-12 border-b border-l border-r border-t px-4 py-2.5 text-center font-medium ${tc.border} ${tc.textSecondary}`}
                >
                  #
                </th>
              )}
              {headers.map((header, pos) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static header list
                <th
                  key={`header-${header}-${pos}`}
                  className={`border-b border-r border-t px-4 py-2.5 text-left font-semibold tracking-tight ${tc.border} ${tc.textPrimary}`}
                >
                  {header.replace(/"/g, "")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
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
                      className={`border-b border-l border-r px-4 py-2.5 text-center font-mono text-xs select-none ${tc.border} ${rowNumberClass}`}
                    >
                      {lineNum}
                    </td>
                  )}
                  {row.map((cell, cellPos) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable column order
                    <td
                      key={`row-${lineNum}-cell-${cellPos}`}
                      className={`max-w-[200px] truncate border-b border-r px-4 py-2.5 font-mono ${tc.border} ${cellClass}`}
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
    </div>
  );
}
