/**
 * POST /api/chat
 *
 * Accepts a user message and optional conversationId / workspaceId.
 * Streams the assistant response via Server-Sent Events (text/event-stream).
 * Persists user + assistant messages to Supabase when streaming completes.
 *
 * Request body:
 * {
 *   message:        string           — the user's new message
 *   conversationId: string | null    — existing conversation to continue (or null to create)
 *   workspaceId:    string | null    — workspace to associate the conversation with
 * }
 *
 * SSE event types:
 *   data: {"type":"delta",  "text": "..."}  — streamed content chunk
 *   data: {"type":"meta",   "conversationId": "...", "messageId": "..."}
 *   data: {"type":"tool_call",   ... }      — workspace tool invocation
 *   data: {"type":"tool_result",  ... }      — workspace tool completion
 *   data: {"type":"done"}
 *   data: {"type":"error",  "message": "..."}
 */

import { type NextRequest, NextResponse } from "next/server";
import { findWorkspaceById } from "@/lib/workspace/repository";
import {
  createConversation,
  findConversationById,
  insertMessage,
  listMessages,
} from "@/lib/chat/repository";
import {
  streamWorkspaceChat,
  type ChatMessage,
  type WorkspaceChatEvent,
} from "@/lib/chat/openai";

// Edge runtime is NOT used — we need Node.js for the OpenAI SDK.
export const runtime = "nodejs";

/** Helper: write an SSE event line to the encoder. */
function sseEvent(
  encoder: TextEncoder,
  payload: Record<string, unknown>,
): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (payload: Record<string, unknown>) => {
        controller.enqueue(sseEvent(encoder, payload));
      };

      try {
        // ------------------------------------------------------------------
        // 1. Parse and validate request body
        // ------------------------------------------------------------------
        let body: {
          message?: string;
          conversationId?: string | null;
          workspaceId?: string | null;
        };

        try {
          body = await req.json();
        } catch {
          enqueue({ type: "error", message: "Invalid JSON body." });
          controller.close();
          return;
        }

        const userMessage = (body.message ?? "").trim();
        if (!userMessage) {
          enqueue({ type: "error", message: "message is required." });
          controller.close();
          return;
        }

        // ------------------------------------------------------------------
        // 2. Resolve or create workspace + conversation
        // ------------------------------------------------------------------
        const workspaceId = body.workspaceId ?? null;
        if (!workspaceId) {
          enqueue({ type: "error", message: "workspaceId is required." });
          controller.close();
          return;
        }

        const workspace = await findWorkspaceById(workspaceId);
        if (!workspace) {
          enqueue({ type: "error", message: "Workspace not found." });
          controller.close();
          return;
        }

        let conversationId = body.conversationId ?? null;
        if (conversationId) {
          // Validate the conversation exists; fall back to creating a new one.
          const existing = await findConversationById(conversationId);
          if (!existing || existing.workspace_id !== workspace.id) {
            conversationId = null;
          }
        }

        if (!conversationId) {
          const conv = await createConversation(workspace.id);
          conversationId = conv.id;
        }

        // ------------------------------------------------------------------
        // 3. Load conversation history for context
        // ------------------------------------------------------------------
        const history = await listMessages(conversationId);

        // ------------------------------------------------------------------
        // 4. Persist the user message
        // ------------------------------------------------------------------
        const userRow = await insertMessage({
          conversationId,
          role: "user",
          content: userMessage,
        });

        // Send meta event so the client knows the conversation/message IDs.
        enqueue({
          type: "meta",
          conversationId,
          messageId: userRow.id,
        });

        // ------------------------------------------------------------------
        // 5. Build message list for OpenAI
        // ------------------------------------------------------------------
        const chatMessages: ChatMessage[] = history.map((message) => {
          let content = message.content;
          if (content.startsWith("__CANVAS_UI_MESSAGES__\n")) {
            try {
              const jsonStr = content.substring("__CANVAS_UI_MESSAGES__\n".length);
              const uiMsgs = JSON.parse(jsonStr) as Array<{ type: string; text?: string }>;
              content = uiMsgs.filter((m) => m.type === "text").map((m) => m.text).join("");
            } catch {
              // Fallback if parsing fails
              content = content.replace("__CANVAS_UI_MESSAGES__\n", "");
            }
          }

          return {
            role: message.role === "user" ? "user" : "assistant",
            content,
          };
        });

        const assistantResult = await streamWorkspaceChat({
          workspaceId,
          history: chatMessages,
          userMessage,
          onEvent: (event: WorkspaceChatEvent) => {
            if (event.type === "delta") {
              enqueue({ type: "delta", text: event.text });
              return;
            }

            if (event.type === "tool_call") {
              enqueue({
                type: "tool_call",
                toolCallId: event.toolCallId,
                name: event.name,
                target: event.target,
                artifactId: event.artifactId ?? null,
                range: event.range ?? null,
                status: event.status,
              });
              return;
            }

            enqueue({
              type: "tool_result",
              toolCallId: event.toolCallId,
              status: event.status,
              message: event.message ?? null,
            });
          },
        });

        // ------------------------------------------------------------------
        // 7. Persist the assistant message
        // ------------------------------------------------------------------
        const hasToolCalls = assistantResult.uiMessages.some(m => m.type === "tool_call");
        const contentToSave = hasToolCalls
          ? `__CANVAS_UI_MESSAGES__\n${JSON.stringify(assistantResult.uiMessages)}`
          : assistantResult.content;

        const assistantRow = await insertMessage({
          conversationId,
          role: "assistant",
          content: contentToSave,
          finishReason: assistantResult.finishReason,
          promptTokens: assistantResult.promptTokens,
          completionTokens: assistantResult.completionTokens,
        });

        // ------------------------------------------------------------------
        // 8. Signal completion
        // ------------------------------------------------------------------
        enqueue({
          type: "done",
          assistantMessageId: assistantRow.id,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unexpected server error.";
        console.error("[/api/chat] Error:", err);
        try {
          enqueue({ type: "error", message });
        } catch {
          // Controller may already be closed.
        }
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
