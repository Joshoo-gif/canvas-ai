"use client";

import { FilePlus } from "lucide-react";
import type { ThemeClasses } from "@/components/ui";

interface EmptyWorkspaceProps {
  onDeployFiles: () => void;
  tc: ThemeClasses;
}

/**
 * Shown when no artifacts are open in the ArtifactViewer.
 * Prompts the user to deploy sample files.
 */
export default function EmptyWorkspace({
  onDeployFiles,
  tc,
}: EmptyWorkspaceProps) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center p-8 text-center ${tc.surfaceTint}`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${tc.emptyCard}`}
      >
        <FilePlus className={`h-6 w-6 ${tc.textSecondary}`} />
      </div>

      <h3 className={`mb-1.5 text-sm font-semibold ${tc.textPrimary}`}>
        Workspace Empty
      </h3>

      <p className={`mb-6 max-w-xs text-xs leading-relaxed ${tc.textSecondary}`}>
        Deploy or drop files into the workspace to begin analysis.
      </p>

      <button
        type="button"
        onClick={onDeployFiles}
        className={`h-9 rounded-full px-5 text-xs font-semibold shadow-sm transition-all duration-200 ${tc.btnPrimary}`}
      >
        Deploy Sample Files
      </button>
    </div>
  );
}
