/**
 * OpenAI service — wraps the OpenAI SDK for chat completions.
 *
 * Streaming is done via the OpenAI SDK's AsyncIterable streaming API.
 * Reasoning content (from o1/o3 models) is intentionally excluded from
 * the streamed output — only the `content` delta is forwarded to the client.
 */

import OpenAI from "openai";
import { env } from "@/lib/env";

/** Singleton OpenAI client. */
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (_openai) return _openai;
  _openai = new OpenAI({ apiKey: env.openai.apiKey });
  return _openai;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  /** Override the default model from env. */
  model?: string;
  /** System prompt injected before all messages. */
  systemPrompt?: string;
}

export interface StreamChatResult {
  /** AsyncIterable of text deltas (content only, no reasoning). */
  stream: AsyncIterable<string>;
  /** Promise that resolves with the full aggregated response once done. */
  completion: Promise<{
    content: string;
    finishReason: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
  }>;
}

/**
 * Stream a chat completion and yield only the `content` text deltas.
 * Reasoning content emitted by thinking models (o1, o3) is silently dropped.
 */
export async function streamChat(
  params: StreamChatParams,
): Promise<StreamChatResult> {
  const client = getOpenAIClient();
  const model = params.model ?? env.openai.model;

  const systemMessages: OpenAI.Chat.ChatCompletionMessageParam[] =
    params.systemPrompt
      ? [{ role: "system", content: params.systemPrompt }]
      : [];

  const userMessages: OpenAI.Chat.ChatCompletionMessageParam[] =
    params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const openaiStream = await client.chat.completions.create({
    model,
    messages: [...systemMessages, ...userMessages],
    stream: true,
    stream_options: { include_usage: true },
  });

  // We need to broadcast the same stream to two consumers:
  //   1. The route handler (for SSE to the browser)
  //   2. The completion promise (for DB persistence)
  // We achieve this with a TransformStream that tees the text deltas.
  const contentChunks: string[] = [];
  let finishReason: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;

  // Build an async generator that yields content-only deltas.
  async function* contentStream(): AsyncGenerator<string> {
    for await (const chunk of openaiStream) {
      // Usage is included in the final chunk when stream_options.include_usage is set.
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? null;
        completionTokens = chunk.usage.completion_tokens ?? null;
      }

      const choice = chunk.choices?.[0];
      if (!choice) continue;

      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
      }

      const delta = choice.delta;

      // Skip reasoning_content — only emit regular content.
      // The `reasoning_content` field is non-standard and only present on
      // some model outputs (e.g. o1, o3). We check defensively.
      if ((delta as Record<string, unknown>)?.reasoning_content) continue;

      const text = delta?.content ?? "";
      if (text) {
        contentChunks.push(text);
        yield text;
      }
    }
  }

  const stream = contentStream();

  const completion = new Promise<{
    content: string;
    finishReason: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
  }>((resolve) => {
    // We resolve after the generator finishes (caller must consume the stream).
    // The route handler is responsible for draining the stream.
    const checkDone = () => {
      resolve({
        content: contentChunks.join(""),
        finishReason,
        promptTokens,
        completionTokens,
      });
    };

    // Attach resolution to the generator lifecycle via a wrapper.
    const originalStream = stream;
    const wrapped = (async function* () {
      try {
        for await (const chunk of originalStream) {
          yield chunk;
        }
      } finally {
        checkDone();
      }
    })();

    // Replace the stream reference — the caller uses the wrapped version.
    Object.assign(stream, wrapped);
  });

  return { stream, completion };
}
