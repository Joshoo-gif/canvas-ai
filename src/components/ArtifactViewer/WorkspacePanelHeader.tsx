"use client";

import { Files, Plus } from "lucide-react";
import type { ThemeClasses } from "@/components/ui";

interface WorkspacePanelHeaderProps {
  fileCount: number;
  onUploadFiles: () => void;
  tc: ThemeClasses;
}

export default function WorkspacePanelHeader({
  fileCount,
  onUploadFiles,
  tc,
}: WorkspacePanelHeaderProps) {
  return (
    <div
      className={`flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 ${tc.border} ${tc.surface}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Files className={`h-4 w-4 shrink-0 ${tc.textSecondary}`} />
        <div className="min-w-0">
          <div className={`truncate text-sm font-semibold ${tc.textPrimary}`}>
            Workspace files
          </div>
          <div className={`truncate text-[10px] ${tc.textSecondary}`}>
            {fileCount > 0
              ? `${fileCount} uploaded file${fileCount === 1 ? "" : "s"}`
              : "Upload txt, md, pdf, or docx files"}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onUploadFiles}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-150 ${tc.border} ${tc.btnGhost}`}
        aria-label="Upload file"
        title="Upload file"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
