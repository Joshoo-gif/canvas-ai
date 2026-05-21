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
  onDeleteFile: (fileId: string) => void;
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
  onDeleteFile,
  settings,
}: ArtifactViewerProps) {
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);
  const compact = settings.density === "compact";
  const showLineNumbers = settings.lineNumbers;
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);

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

  const explorerDragRef = useRef(false);

  const startResizeExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    explorerDragRef.current = true;
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = explorerWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!explorerDragRef.current) return;
      const newWidth = Math.min(400, Math.max(150, startWidth + (ev.clientX - startX)));
      setExplorerWidth(newWidth);
    };

    const onMouseUp = () => {
      explorerDragRef.current = false;
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

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
          className={`relative shrink-0 border-r flex flex-col overflow-x-hidden select-none ${
            !isResizing ? "transition-[width] duration-300 ease-in-out" : ""
          } ${explorerBorder} ${
            isDark ? "bg-[#111111]" : "bg-[#FAFAFA]"
          }`}
          style={{ width: explorerOpen ? `${explorerWidth}px` : "40px" }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={startResizeExplorer}
            className={`absolute bottom-0 right-0 top-0 z-10 w-[5px] cursor-col-resize hover:bg-[#FAFAF9]/10 ${
              !explorerOpen ? "hidden" : ""
            }`}
          />

          {/* Sidebar Toggle Header */}
          <div className={`flex h-10 items-center justify-between overflow-hidden border-b px-2 ${explorerBorder}`}>
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setExplorerOpen((o) => !o)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${tc.btnGhost}`}
                title={explorerOpen ? "Close file explorer" : "Open file explorer"}
                aria-label="Toggle file explorer"
              >
                {explorerOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>

              <span
                className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 ${tc.textSecondary} ${
                  !explorerOpen
                    ? "max-w-0 -translate-x-1 opacity-0"
                    : "max-w-[120px] translate-x-0 opacity-100"
                }`}
                aria-hidden={!explorerOpen}
              >
                Files
              </span>
            </div>
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
                onDeleteFile={onDeleteFile}
                tc={tc}
                isDark={isDark}
              />
            ) : null}
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
