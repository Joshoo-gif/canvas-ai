"use client";

import { FileUp } from "lucide-react";
import type { ThemeClasses } from "@/components/ui";

interface EmptyWorkspaceProps {
  onUploadFiles: () => void;
  tc: ThemeClasses;
}

/**
 * Shown when no artifacts are open in the ArtifactViewer.
 * Prompts the user to upload workspace files.
 */
export default function EmptyWorkspace({
  onUploadFiles,
  tc,
}: EmptyWorkspaceProps) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center p-8 text-center ${tc.surfaceTint}`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${tc.emptyCard}`}
      >
        <FileUp className={`h-6 w-6 ${tc.textSecondary}`} />
      </div>

      <h3 className={`mb-1.5 text-sm font-semibold ${tc.textPrimary}`}>
        No files uploaded yet
      </h3>

      <p className={`mb-6 max-w-xs text-xs leading-relaxed ${tc.textSecondary}`}>
        Upload txt, md, pdf, or docx files to extract their text into numbered
        lines for later AI reading.
      </p>

      <button
        type="button"
        onClick={onUploadFiles}
        className={`flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold shadow-sm transition-all duration-200 ${tc.btnPrimary}`}
      >
        <FileUp className="h-3.5 w-3.5" />
        Upload file
      </button>
    </div>
  );
}
