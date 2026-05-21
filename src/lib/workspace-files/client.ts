import type { WorkspaceFileRow } from "@/lib/supabase/types";
import { WORKSPACE_FILE_ACCEPT } from "./validation";

async function readErrorResponse(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }
  return `HTTP ${response.status}: ${response.statusText}`;
}

export async function listWorkspaceFiles(
  workspaceId: string,
): Promise<WorkspaceFileRow[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/files`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  const payload: { files?: WorkspaceFileRow[] } = await response.json();
  return payload.files ?? [];
}

export async function uploadWorkspaceFile(
  workspaceId: string,
  file: File,
): Promise<WorkspaceFileRow> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/workspaces/${workspaceId}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  const payload: { file?: WorkspaceFileRow } = await response.json();
  if (!payload.file) {
    throw new Error("Upload succeeded but no file record was returned.");
  }

  return payload.file;
}

export async function deleteWorkspaceFile(
  workspaceId: string,
  fileId: string,
): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }
}

export { WORKSPACE_FILE_ACCEPT };
