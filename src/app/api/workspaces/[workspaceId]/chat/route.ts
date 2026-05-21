import { NextResponse } from "next/server";
import {
  findLatestConversationByWorkspace,
  findConversationById,
  listMessages,
} from "@/lib/chat/repository";
import { findWorkspaceById } from "@/lib/workspace/repository";
import { getSessionUserId } from "@/lib/auth/session";
import type { MessageRow } from "@/lib/supabase/types";

export const runtime = "nodejs";

interface ChatRouteContext {
  params: Promise<{ workspaceId: string }>;
}

function processMessages(rows: MessageRow[]) {
  const result = [];
  for (const row of rows) {
    const timestamp = new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const sender = row.role === "user" ? ("user" as const) : ("agent" as const);

    if (row.content.startsWith("__CANVAS_UI_MESSAGES__\n")) {
      try {
        const jsonStr = row.content.substring("__CANVAS_UI_MESSAGES__\n".length);
        const uiMsgs = JSON.parse(jsonStr) as Array<{
          type: "text" | "tool_call";
          text?: string;
          toolCall?: any;
        }>;

        for (let i = 0; i < uiMsgs.length; i++) {
          const m = uiMsgs[i];
          
          if (m.type === "text" && (m.text || "").trim() === "") {
            continue; // Skip empty whitespace chunks that get saved before tool calls
          }

          result.push({
            id: `${row.id}-${i}`,
            sender,
            text: m.text ?? "",
            timestamp,
            toolCall: m.toolCall,
          });
        }
      } catch {
        result.push({
          id: row.id,
          sender,
          text: row.content.replace("__CANVAS_UI_MESSAGES__\n", ""),
          timestamp,
        });
      }
    } else {
      result.push({
        id: row.id,
        sender,
        text: row.content,
        timestamp,
      });
    }
  }
  return result;
}

export async function GET(request: Request, context: ChatRouteContext) {
  const { workspaceId } = await context.params;
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const workspace = await findWorkspaceById(workspaceId, userId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  let conversation = null;
  if (conversationId && conversationId !== "new") {
    conversation = await findConversationById(conversationId);
  } else if (conversationId !== "new") {
    conversation = await findLatestConversationByWorkspace(workspaceId);
  }

  const messages = conversation ? await listMessages(conversation.id) : [];

  return NextResponse.json({
    workspace,
    conversation,
    messages: processMessages(messages),
  });
}
