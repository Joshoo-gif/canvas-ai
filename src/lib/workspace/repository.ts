/**
 * Workspace repository — server-side data access for workspaces.
 * Encapsulates all Supabase queries for the workspaces table.
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { WorkspaceInsert, WorkspaceRow } from "@/lib/supabase/types";

export type { WorkspaceRow };

/**
 * List all workspaces newest-first so the sidebar can render the user's most
 * recently active spaces at the top.
 */
export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("workspaces")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`[workspace] listWorkspaces failed: ${error.message}`);
  return (data as WorkspaceRow[]) ?? [];
}

/**
 * Find a workspace by ID.
 * Returns null when not found rather than throwing.
 */
export async function findWorkspaceById(
  id: string,
): Promise<WorkspaceRow | null> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`[workspace] findById failed: ${error.message}`);
  return (data as WorkspaceRow) ?? null;
}

/**
 * Create a new workspace with the given name.
 */
export async function createWorkspace(name: string): Promise<WorkspaceRow> {
  const db = getSupabaseServer();
  const insert: WorkspaceInsert = { name };
  const { data, error } = await db
    .from("workspaces")
    .insert(insert)
    .select()
    .single();

  if (error || !data)
    throw new Error(`[workspace] createWorkspace failed: ${error?.message}`);
  return data as WorkspaceRow;
}

/** UUID v4 regex — only valid UUIDs are forwarded to Supabase. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Resolve the canonical workspace to use for a request.
 *
 * Priority:
 *   1. requestedId — if it is a valid UUID and exists in the DB, use it.
 *   2. env.CANVAS_DEFAULT_WORKSPACE_ID — if configured and valid UUID.
 *   3. Auto-create a "Default Workspace".
 *
 * Non-UUID strings (e.g. sidebar display IDs like "dev", "research") are
 * silently ignored so they never reach Supabase.
 */
export async function resolveWorkspace(
  requestedId?: string | null,
): Promise<WorkspaceRow> {
  if (requestedId && isUuid(requestedId)) {
    const ws = await findWorkspaceById(requestedId);
    if (ws) return ws;
  }

  const { env } = await import("@/lib/env");
  if (env.canvas.defaultWorkspaceId && isUuid(env.canvas.defaultWorkspaceId)) {
    const ws = await findWorkspaceById(env.canvas.defaultWorkspaceId);
    if (ws) return ws;
  }

  // Auto-create a default workspace on first use.
  return createWorkspace("Default Workspace");
}
