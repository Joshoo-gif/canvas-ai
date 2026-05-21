import { NextResponse } from "next/server";
import { listConversationsByWorkspace } from "@/lib/chat/repository";
import { findWorkspaceById } from "@/lib/workspace/repository";

export const runtime = "nodejs";

interface ConversationsRouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_: Request, context: ConversationsRouteContext) {
  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const conversations = await listConversationsByWorkspace(workspaceId);

  return NextResponse.json({
    conversations,
  });
}
