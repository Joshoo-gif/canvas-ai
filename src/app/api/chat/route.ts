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
 *   data: {"type":"done"}
 *   data: {"type":"error",  "message": "..."}
 */

import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { findWorkspaceById } from "@/lib/workspace/repository";
import {
  createConversation,
  findConversationById,
  insertMessage,
  listMessages,
} from "@/lib/chat/repository";

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
        const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content:
              "You are Canvas, an advanced AI coding assistant embedded in a professional engineering workspace. " +
              "Be concise, precise, and helpful. When referencing code or files, be specific about line numbers and context.",
          },
          // Inject conversation history
          ...history.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
          // Add the new user message
          { role: "user", content: userMessage },
        ];

        // ------------------------------------------------------------------
        // 6. Stream from OpenAI — only emit content, skip reasoning_content
        // ------------------------------------------------------------------
        const openai = new OpenAI({
          apiKey: env.openai.apiKey,
          ...(env.openai.baseUrl ? { baseURL: env.openai.baseUrl } : {}),
        });

        const openaiStream = await openai.chat.completions.create({
          model: env.openai.model,
          messages: chatMessages,
          stream: true,
          stream_options: { include_usage: true },
        });

        const contentChunks: string[] = [];
        let finishReason: string | null = null;
        let promptTokens: number | null = null;
        let completionTokens: number | null = null;

        for await (const chunk of openaiStream) {
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens ?? null;
            completionTokens = chunk.usage.completion_tokens ?? null;
          }

          const choice = chunk.choices?.[0];
          if (!choice) continue;

          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }

          const delta = choice.delta as Record<string, unknown>;

          // Skip reasoning_content — only stream the regular content.
          if (delta?.reasoning_content) continue;

          const text = (delta?.content as string) ?? "";
          if (text) {
            contentChunks.push(text);
            enqueue({ type: "delta", text });
          }
        }

        const fullContent = contentChunks.join("");

        // ------------------------------------------------------------------
        // 7. Persist the assistant message
        // ------------------------------------------------------------------
        const assistantRow = await insertMessage({
          conversationId,
          role: "assistant",
          content: fullContent,
          finishReason,
          promptTokens,
          completionTokens,
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
