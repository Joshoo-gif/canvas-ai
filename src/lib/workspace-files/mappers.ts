import type { Artifact } from "@/components/ArtifactViewer";
import type { WorkspaceFileRow } from "@/lib/supabase/types";

export function workspaceFileToArtifact(file: WorkspaceFileRow): Artifact {
  return {
    id: file.id,
    name: file.original_name,
    type: file.extension === "csv" ? "sheet" : "document",
    content: file.extracted_lines,
  };
}

export function workspaceFilesToArtifacts(
  files: WorkspaceFileRow[],
): Artifact[] {
  return files.map(workspaceFileToArtifact);
}
