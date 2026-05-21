import { NextResponse } from "next/server";
import { findWorkspaceById } from "@/lib/workspace/repository";
import {
  findWorkspaceFileById,
  deleteWorkspaceFile,
} from "@/lib/workspace-files/repository";

export const runtime = "nodejs";

interface WorkspaceFileRouteContext {
  params: Promise<{ workspaceId: string; fileId: string }>;
}

export async function DELETE(_: Request, context: WorkspaceFileRouteContext) {
  const { workspaceId, fileId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const file = await findWorkspaceFileById(fileId);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (file.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "File does not belong to this workspace." }, { status: 403 });
  }

  try {
    await deleteWorkspaceFile(fileId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file." },
      { status: 500 }
    );
  }
}
