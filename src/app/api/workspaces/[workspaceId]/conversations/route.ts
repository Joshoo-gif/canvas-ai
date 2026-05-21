import { NextResponse } from "next/server";
import { listConversationsByWorkspace } from "@/lib/chat/repository";
import { findWorkspaceById } from "@/lib/workspace/repository";
import { getSessionUserId } from "@/lib/auth/session";

export const runtime = "nodejs";

interface ConversationsRouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_: Request, context: ConversationsRouteContext) {
  const { workspaceId } = await context.params;
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const workspace = await findWorkspaceById(workspaceId, userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const conversations = await listConversationsByWorkspace(workspaceId);

  return NextResponse.json({
    conversations,
  });
}
