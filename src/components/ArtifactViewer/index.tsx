"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useThemeClasses } from "@/components/ui";
import type { WorkspaceSettings } from "@/components/workspaceSettings";
import FileExplorer from "@/components/FileExplorer";
import type { WorkspaceFileRow } from "@/lib/supabase/types";
import ArtifactTab from "./ArtifactTab";
import EmptyWorkspace from "./EmptyWorkspace";
import WorkspacePanelHeader from "./WorkspacePanelHeader";
import SpreadsheetViewer from "./SpreadsheetViewer";
import TextViewer from "./TextViewer";
import type { Artifact, HighlightedRange } from "./types";

// Re-export the Artifact type so consumers can import from the same path
export type { Artifact } from "./types";

interface ArtifactViewerProps {
  openArtifacts: Artifact[];
  workspaceFiles: WorkspaceFileRow[];
  fileCount: number;
  activeArtifactId: string | null;
  setActiveArtifactId: (id: string | null) => void;
  closeArtifact: (id: string) => void;
  openArtifact: (file: WorkspaceFileRow) => void;
  highlightedRange: HighlightedRange | null;
  onUploadFiles: () => void;
  settings: Pick<WorkspaceSettings, "theme" | "density" | "fontSize" | "lineNumbers">;
}

/**
 * ArtifactViewer — the left workspace panel.
 *
 * Responsibilities:
 *  - File explorer sidebar panel (open/close individual files)
 *  - Tab strip (delegates to ArtifactTab)
 *  - Auto-scroll to highlighted line range
 *  - Dispatch to TextViewer or SpreadsheetViewer based on artifact type
 *  - Empty state when no artifacts are open (delegates to EmptyWorkspace)
 */
export default function ArtifactViewer({
  openArtifacts,
  workspaceFiles,
  fileCount,
  activeArtifactId,
  setActiveArtifactId,
  closeArtifact,
  openArtifact,
  highlightedRange,
  onUploadFiles,
  settings,
}: ArtifactViewerProps) {
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);
  const compact = settings.density === "compact";
  const showLineNumbers = settings.lineNumbers;
  const [explorerOpen, setExplorerOpen] = useState(true);

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
  const explorerBorder = isDark ? "border-[#2A2A2A]" : "border-[#E7E5E4]";

  return (
    <section
      className={`flex h-full flex-col overflow-hidden ${tc.shell}`}
      aria-label="Artifact Workspace"
    >
      <WorkspacePanelHeader
        fileCount={fileCount}
        onUploadFiles={onUploadFiles}
        tc={tc}
      />

      {/* Main split area */}
      <div className="flex min-h-0 flex-1">
        
        {/* File explorer — collapsible sidebar */}
        <div
          className={`shrink-0 border-r transition-[width] duration-300 ease-in-out flex flex-col ${explorerBorder} ${
            isDark ? "bg-[#111111]" : "bg-[#FAFAFA]"
          } ${explorerOpen ? "w-[220px]" : "w-[40px]"}`}
        >
          {/* Sidebar Toggle Header */}
          <div className={`flex items-center justify-between px-2 py-2 border-b ${explorerBorder}`}>
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest transition-opacity duration-200 ${tc.textSecondary} ${
                explorerOpen ? "opacity-100 px-2" : "opacity-0 w-0 hidden"
              }`}
            >
              Files
            </span>
            <button
              type="button"
              onClick={() => setExplorerOpen((o) => !o)}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${tc.btnGhost} ${
                !explorerOpen ? "mx-auto" : ""
              }`}
              title={explorerOpen ? "Close file explorer" : "Open file explorer"}
              aria-label="Toggle file explorer"
            >
              {explorerOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            {explorerOpen ? (
              <FileExplorer
                workspaceFiles={workspaceFiles}
                openArtifacts={openArtifacts}
                activeArtifactId={activeArtifactId}
                onOpenFile={openArtifact}
                onCloseFile={closeArtifact}
                onSelectFile={setActiveArtifactId}
                tc={tc}
                isDark={isDark}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                {/* When collapsed, we could just show icons or nothing.
                    Showing nothing but the toggle is standard in most editors. */}
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex min-w-0 flex-1 flex-col relative">
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
              <EmptyWorkspace onUploadFiles={onUploadFiles} tc={tc} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
