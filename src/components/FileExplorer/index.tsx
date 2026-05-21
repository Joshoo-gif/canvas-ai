"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Sheet, Trash2 } from "lucide-react";
import type { ThemeClasses } from "@/components/ui";
import type { WorkspaceFileRow } from "@/lib/supabase/types";
import type { Artifact } from "@/components/ArtifactViewer";

interface FileExplorerProps {
  /** All files in the workspace (from the DB) */
  workspaceFiles: WorkspaceFileRow[];
  /** Currently open (visible) artifacts */
  openArtifacts: Artifact[];
  /** The currently active artifact id */
  activeArtifactId: string | null;
  /** Called to open a file that is currently closed */
  onOpenFile: (file: WorkspaceFileRow) => void;
  /** Called to close a currently open artifact */
  onCloseFile: (artifactId: string) => void;
  /** Called to switch focus to an open artifact */
  onSelectFile: (artifactId: string) => void;
  /** Called to delete a file */
  onDeleteFile?: (artifactId: string) => void;
  tc: ThemeClasses;
  isDark: boolean;
}

function getFileIcon(mimeType: string) {
  const isSheet =
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv") ||
    mimeType.includes("excel");
  const cls = "h-3.5 w-3.5 shrink-0";
  return isSheet ? <Sheet className={cls} /> : <FileText className={cls} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileExplorer({
  workspaceFiles,
  openArtifacts,
  activeArtifactId,
  onOpenFile,
  onCloseFile,
  onSelectFile,
  onDeleteFile,
  tc,
  isDark,
}: FileExplorerProps) {
  const openIds = new Set(openArtifacts.map((a) => a.id));
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fileId: string;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (workspaceFiles.length === 0) {
    return (
      <div
        className={`px-4 py-6 text-center text-[11px] leading-relaxed ${tc.textSecondary}`}
      >
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      {workspaceFiles.map((file) => {
        const isOpen = openIds.has(file.id);
        const isActive = file.id === activeArtifactId;

        return (
          <div
            key={file.id}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                fileId: file.id,
              });
            }}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition-all duration-150 ${
              isActive
                ? tc.itemActive
                : isOpen
                ? isDark
                  ? "bg-[#1E1E1E] text-[#D6D3D1] hover:bg-[#262626]"
                  : "bg-[#F5F5F4] text-[#404040] hover:bg-[#EDEBE9]"
                : tc.itemInactive
            }`}
          >
            {/* File icon */}
            <span className={`${isActive ? tc.textPrimary : tc.textSecondary}`}>
              {getFileIcon(file.mime_type)}
            </span>

            {/* Name + size — clicking activates/opens */}
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                if (isOpen) {
                  onSelectFile(file.id);
                } else {
                  onOpenFile(file);
                }
              }}
              title={file.original_name}
            >
              <span
                className={`block truncate text-[12px] font-medium leading-tight ${
                  isActive ? tc.textPrimary : tc.textSubdued
                }`}
              >
                {file.original_name}
              </span>
              <span
                className={`block text-[10px] leading-tight ${tc.textSecondary}`}
              >
                {formatBytes(file.byte_size ?? 0)}
                {!isOpen && (
                  <span className="ml-1.5 opacity-60">· closed</span>
                )}
              </span>
            </button>

            {/* Toggle open/close */}
            <button
              type="button"
              onClick={() => {
                if (isOpen) {
                  onCloseFile(file.id);
                } else {
                  onOpenFile(file);
                }
              }}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 ${tc.btnGhost}`}
              title={isOpen ? "Close file" : "Open file"}
              aria-label={isOpen ? "Close file" : "Open file"}
            >
              {isOpen ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        );
      })}

      {contextMenu && onDeleteFile && (
        <div
          className={`fixed z-50 min-w-[160px] rounded-md border shadow-lg ${
            isDark
              ? "border-[#404040] bg-[#1E1E1E] text-[#D6D3D1]"
              : "border-[#E7E5E4] bg-white text-[#404040]"
          } p-1`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
              isDark ? "hover:bg-[#EF4444]/10 hover:text-[#F87171]" : "hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            } text-red-500`}
            onClick={() => {
              onDeleteFile(contextMenu.fileId);
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete File
          </button>
        </div>
      )}
    </div>
  );
}
