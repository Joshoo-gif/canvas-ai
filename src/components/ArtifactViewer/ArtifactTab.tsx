"use client";

import { FileCode, FileText, Sheet, X } from "lucide-react";
import type { Artifact } from "./types";
import type { ThemeClasses } from "@/components/ui";
import IconButton from "@/components/ui/IconButton";

interface ArtifactTabProps {
  artifact: Artifact;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  tc: ThemeClasses;
}

function getFileIcon(type: Artifact["type"]) {
  switch (type) {
    case "sheet":
      return <Sheet className="h-3.5 w-3.5 shrink-0 text-emerald-600" />;
    case "code":
      return <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
    default:
      return <FileText className="h-3.5 w-3.5 shrink-0 text-orange-500" />;
  }
}

/**
 * A single tab in the ArtifactViewer tab strip.
 * Handles file-icon selection, active/inactive state, and the close button.
 */
export default function ArtifactTab({
  artifact,
  isActive,
  onSelect,
  onClose,
  tc,
}: ArtifactTabProps) {
  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect(artifact.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(artifact.id);
        }
      }}
      className={`group flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium cursor-pointer transition-all ${
        isActive ? tc.tabActive : tc.tabInactive
      }`}
    >
      {getFileIcon(artifact.type)}
      <span className="max-w-[110px] truncate">{artifact.name}</span>
      <IconButton
        label="Close file"
        colorClass={`opacity-0 group-hover:opacity-100 ${tc.btnGhost}`}
        sizeClass="h-5 w-5"
        shapeClass="rounded"
        onClick={(e) => {
          e.stopPropagation();
          onClose(artifact.id);
        }}
      >
        <X className="h-3 w-3" />
      </IconButton>
    </div>
  );
}
