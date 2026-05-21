import { NextResponse } from "next/server";
import {
  findLatestConversationByWorkspace,
  listMessages,
} from "@/lib/chat/repository";
import { findWorkspaceById } from "@/lib/workspace/repository";
import type { MessageRow } from "@/lib/supabase/types";

export const runtime = "nodejs";

interface ChatRouteContext {
  params: Promise<{ workspaceId: string }>;
}

function toMessagePayload(row: MessageRow) {
  return {
    id: row.id,
    sender: row.role === "user" ? ("user" as const) : ("agent" as const),
    text: row.content,
    timestamp: new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export async function GET(_: Request, context: ChatRouteContext) {
  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const conversation = await findLatestConversationByWorkspace(workspaceId);
  const messages = conversation ? await listMessages(conversation.id) : [];

  return NextResponse.json({
    workspace,
    conversation,
    messages: messages.map(toMessagePayload),
  });
}
