import {
  findWorkspaceFileById,
  getWorkspaceFileLineRange,
  listWorkspaceFiles,
} from "./repository";
import type { WorkspaceFileRow } from "@/lib/supabase/types";
import type { WorkspaceFileExtension } from "./validation";

export interface WorkspaceArtifactSummary {
  artifactId: string;
  fileName: string;
  mimeType: string;
  extension: WorkspaceFileExtension;
  byteSize: number;
  lineCount: number;
}

export interface WorkspaceSearchHit {
  artifactId: string;
  fileName: string;
  extension: WorkspaceFileExtension;
  matchCount: number;
}

export interface KeywordInstance {
  lineNumber: number;
  matchCount: number;
  snippet: string;
}

export interface KeywordLocationResult {
  artifactId: string;
  fileName: string;
  keyword: string;
  totalMatches: number;
  instances: KeywordInstance[];
}

export interface FileSegmentResult {
  artifactId: string;
  fileName: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  text: string;
  lines: string[];
}

function normalizeTerm(value: string): string {
  return value.replace(/\u0000/g, "").trim();
}

function countOccurrences(haystack: string, needle: string): number {
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  if (!normalizedNeedle) return 0;

  let count = 0;
  let index = 0;
  while (true) {
    const foundAt = normalizedHaystack.indexOf(normalizedNeedle, index);
    if (foundAt === -1) break;
    count += 1;
    index = foundAt + normalizedNeedle.length;
  }

  return count;
}

function snippetAroundMatch(line: string, keyword: string): string {
  const compactLine = line.replace(/\s+/g, " ").trim();
  if (!compactLine) return "";

  const normalizedLine = compactLine.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const matchIndex = normalizedLine.indexOf(normalizedKeyword);

  if (matchIndex === -1) {
    return compactLine.length > 180
      ? `${compactLine.slice(0, 177)}...`
      : compactLine;
  }

  const radius = 48;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(
    compactLine.length,
    matchIndex + normalizedKeyword.length + radius,
  );
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compactLine.length ? "..." : "";

  return `${prefix}${compactLine.slice(start, end)}${suffix}`;
}

function toArtifactSummary(file: WorkspaceFileRow): WorkspaceArtifactSummary {
  return {
    artifactId: file.id,
    fileName: file.original_name,
    mimeType: file.mime_type,
    extension: file.extension as WorkspaceFileExtension,
    byteSize: file.byte_size,
    lineCount: file.line_count,
  };
}

async function assertWorkspaceFile(
  workspaceId: string,
  artifactId: string,
): Promise<WorkspaceFileRow> {
  const file = await findWorkspaceFileById(artifactId);
  if (!file || file.workspace_id !== workspaceId) {
    throw new Error("Artifact not found in the active workspace.");
  }

  return file;
}

export async function listWorkspaceArtifacts(
  workspaceId: string,
): Promise<WorkspaceArtifactSummary[]> {
  const files = await listWorkspaceFiles(workspaceId);
  return files.map(toArtifactSummary);
}

export async function globalWorkspaceSearch(
  workspaceId: string,
  query: string,
): Promise<WorkspaceSearchHit[]> {
  const normalizedQuery = normalizeTerm(query);
  if (!normalizedQuery) {
    throw new Error("Search query is required.");
  }

  const files = await listWorkspaceFiles(workspaceId);
  return files
    .map((file) => {
      const matchCount = countOccurrences(file.extracted_text, normalizedQuery);
      return matchCount > 0
        ? {
            artifactId: file.id,
            fileName: file.original_name,
            extension: file.extension as WorkspaceFileExtension,
            matchCount,
          }
        : null;
    })
    .filter((item): item is WorkspaceSearchHit => item !== null);
}

export async function locateKeywordInstances(
  workspaceId: string,
  artifactId: string,
  keyword: string,
): Promise<KeywordLocationResult> {
  const normalizedKeyword = normalizeTerm(keyword);
  if (!normalizedKeyword) {
    throw new Error("Keyword is required.");
  }

  const file = await assertWorkspaceFile(workspaceId, artifactId);
  const instances: KeywordInstance[] = [];
  let totalMatches = 0;

  file.extracted_lines.forEach((line, index) => {
    const matchCount = countOccurrences(line, normalizedKeyword);
    if (matchCount <= 0) return;

    totalMatches += matchCount;
    instances.push({
      lineNumber: index + 1,
      matchCount,
      snippet: snippetAroundMatch(line, normalizedKeyword),
    });
  });

  return {
    artifactId: file.id,
    fileName: file.original_name,
    keyword: normalizedKeyword,
    totalMatches,
    instances,
  };
}

export async function readFileSegments(
  workspaceId: string,
  artifactId: string,
  startLine: number,
  endLine: number,
): Promise<FileSegmentResult> {
  const file = await assertWorkspaceFile(workspaceId, artifactId);
  const safeStart = Math.max(1, Math.floor(startLine));
  const safeEnd = Math.max(safeStart, Math.floor(endLine));
  const lines = getWorkspaceFileLineRange(file, safeStart, safeEnd);

  return {
    artifactId: file.id,
    fileName: file.original_name,
    startLine: safeStart,
    endLine: safeEnd,
    lineCount: lines.length,
    text: lines.join("\n"),
    lines,
  };
}
