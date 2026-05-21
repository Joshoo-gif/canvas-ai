import { getSupabaseServer } from "@/lib/supabase/server";
import type { WorkspaceFileInsert, WorkspaceFileRow } from "@/lib/supabase/types";

export type { WorkspaceFileRow };

function sanitizeDbText(value: string): string {
  const normalized = value.replace(/\u0000/g, "");
  if (typeof normalized.toWellFormed === "function") {
    return normalized.toWellFormed();
  }
  return normalized;
}

function sanitizeInsert(insert: WorkspaceFileInsert): WorkspaceFileInsert {
  return {
    ...insert,
    original_name: sanitizeDbText(insert.original_name),
    mime_type: sanitizeDbText(insert.mime_type),
    extension: sanitizeDbText(insert.extension),
    extracted_text: sanitizeDbText(insert.extracted_text ?? ""),
    extracted_lines: (insert.extracted_lines ?? []).map((line) =>
      sanitizeDbText(line),
    ),
    error_message:
      insert.error_message == null ? insert.error_message : sanitizeDbText(insert.error_message),
  };
}

export async function listWorkspaceFiles(
  workspaceId: string,
): Promise<WorkspaceFileRow[]> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("workspace_files")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[workspace-files] listWorkspaceFiles failed: ${error.message}`,
    );
  }

  return (data as WorkspaceFileRow[]) ?? [];
}

export async function findWorkspaceFileById(
  id: string,
): Promise<WorkspaceFileRow | null> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("workspace_files")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[workspace-files] findWorkspaceFileById failed: ${error.message}`,
    );
  }

  return (data as WorkspaceFileRow) ?? null;
}

export async function createWorkspaceFile(
  insert: WorkspaceFileInsert,
): Promise<WorkspaceFileRow> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("workspace_files")
    .insert(sanitizeInsert(insert))
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `[workspace-files] createWorkspaceFile failed: ${error?.message}`,
    );
  }

  return data as WorkspaceFileRow;
}

export function getWorkspaceFileLineRange(
  file: WorkspaceFileRow,
  startLine: number,
  endLine: number,
): string[] {
  const safeStart = Math.max(1, Math.floor(startLine));
  const safeEnd = Math.max(safeStart, Math.floor(endLine));
  return file.extracted_lines.slice(safeStart - 1, safeEnd);
}
