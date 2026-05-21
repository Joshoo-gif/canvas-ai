import { NextResponse } from "next/server";
import { deleteConversation } from "@/lib/chat/repository";

export const runtime = "nodejs";

interface ConversationRouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function DELETE(_: Request, context: ConversationRouteContext) {
  const { conversationId } = await context.params;

  try {
    await deleteConversation(conversationId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to delete conversation.";
    return NextResponse.json({ error }, { status: 500 });
  }
}
