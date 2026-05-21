import { NextResponse } from "next/server";
import { findWorkspaceById, deleteWorkspace } from "@/lib/workspace/repository";

export const runtime = "nodejs";

interface WorkspaceRouteContext {
  params: Promise<{ workspaceId: string }>;
}

import { getSessionUserId } from "@/lib/auth/session";

export async function DELETE(_: Request, context: WorkspaceRouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId, userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  try {
    await deleteWorkspace(workspaceId, userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete workspace." },
      { status: 500 }
    );
  }
}
