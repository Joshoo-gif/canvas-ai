"use client";

import { useEffect, useRef } from "react";
import { useThemeClasses } from "@/components/ui";
import type { WorkspaceSettings } from "@/components/workspaceSettings";
import ArtifactTab from "./ArtifactTab";
import EmptyWorkspace from "./EmptyWorkspace";
import SpreadsheetViewer from "./SpreadsheetViewer";
import TextViewer from "./TextViewer";
import type { Artifact, HighlightedRange } from "./types";

// Re-export the Artifact type so consumers can import from the same path
export type { Artifact } from "./types";

interface ArtifactViewerProps {
  openArtifacts: Artifact[];
  activeArtifactId: string | null;
  setActiveArtifactId: (id: string | null) => void;
  closeArtifact: (id: string) => void;
  highlightedRange: HighlightedRange | null;
  onDeployFiles: () => void;
  settings: Pick<WorkspaceSettings, "theme" | "density" | "fontSize" | "lineNumbers">;
}

/**
 * ArtifactViewer — the left workspace panel.
 *
 * Responsibilities:
 *  - Tab strip (delegates to ArtifactTab)
 *  - Auto-scroll to highlighted line range
 *  - Dispatch to TextViewer or SpreadsheetViewer based on artifact type
 *  - Empty state when no artifacts are open (delegates to EmptyWorkspace)
 */
export default function ArtifactViewer({
  openArtifacts,
  activeArtifactId,
  setActiveArtifactId,
  closeArtifact,
  highlightedRange,
  onDeployFiles,
  settings,
}: ArtifactViewerProps) {
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);
  const compact = settings.density === "compact";
  const showLineNumbers = settings.lineNumbers;

  const activeArtifact =
    openArtifacts.find((art) => art.id === activeArtifactId) ?? null;

  // Keyed by "${artifactId}-line-${lineNum}" for smooth scroll targeting
  const lineRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (highlightedRange && activeArtifact) {
      const midLine = Math.floor(
        (highlightedRange.startLine + highlightedRange.endLine) / 2,
      );
      const el = lineRefs.current[`${activeArtifact.id}-line-${midLine}`];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedRange, activeArtifact]);

  const tabHeightClass = compact ? "h-10" : "h-11";

  return (
    <section
      className={`flex h-full flex-col overflow-hidden ${tc.shell}`}
      aria-label="Artifact Workspace"
    >
      {/* Tab strip */}
      {openArtifacts.length > 0 && (
        <div
          role="tablist"
          className={`flex items-center gap-1 overflow-x-auto border-b px-2 scrollbar-none shrink-0 ${tabHeightClass} ${tc.tabList} ${tc.border}`}
        >
          {openArtifacts.map((art) => (
            <ArtifactTab
              key={art.id}
              artifact={art}
              isActive={art.id === activeArtifactId}
              onSelect={setActiveArtifactId}
              onClose={closeArtifact}
              tc={tc}
            />
          ))}
        </div>
      )}

      {/* Content area */}
      <div className={`relative flex-1 overflow-y-auto ${tc.shell}`}>
        {activeArtifact ? (
          <div className={`h-full ${compact ? "p-3" : "p-4"}`}>
            {/* Range badge */}
            {highlightedRange && (
              <div
                className={`absolute right-3 top-3 z-20 rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono shadow-sm ${tc.rangeBadge}`}
              >
                LINES {highlightedRange.startLine}–{highlightedRange.endLine}
              </div>
            )}

            {activeArtifact.type === "sheet" ? (
              <SpreadsheetViewer
                artifact={activeArtifact}
                highlightedRange={highlightedRange}
                showLineNumbers={showLineNumbers}
                fontSize={settings.fontSize}
                tc={tc}
                lineRefs={lineRefs}
              />
            ) : (
              <TextViewer
                artifact={activeArtifact}
                highlightedRange={highlightedRange}
                showLineNumbers={showLineNumbers}
                fontSize={settings.fontSize}
                tc={tc}
                lineRefs={lineRefs}
              />
            )}
          </div>
        ) : (
          <EmptyWorkspace onDeployFiles={onDeployFiles} tc={tc} />
        )}
      </div>
    </section>
  );
}
