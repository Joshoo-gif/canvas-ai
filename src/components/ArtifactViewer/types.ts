/**
 * Shared types for the ArtifactViewer feature module.
 * Kept here so sub-components don't need to import the full parent file.
 */
export interface Artifact {
  id: string;
  name: string;
  type: "document" | "sheet" | "code";
  content: string[];
}

export interface HighlightedRange {
  startLine: number;
  endLine: number;
}
