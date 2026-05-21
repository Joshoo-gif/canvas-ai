import OpenAI from "openai";
import { env } from "@/lib/env";
import {
  prepareWorkspaceToolInvocation,
  workspaceToolDefinitions,
  type WorkspaceToolName,
} from "@/lib/ai/workspace-tools";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WorkspaceChatEventDelta {
  type: "delta";
  text: string;
}

export interface WorkspaceChatEventToolCall {
  type: "tool_call";
  toolCallId: string;
  name: WorkspaceToolName;
  target: string;
  artifactId?: string;
  range?: { startLine: number; endLine: number };
  status: "running";
}

export interface WorkspaceChatEventToolResult {
  type: "tool_result";
  toolCallId: string;
  status: "completed" | "failed";
  message?: string;
}

export type WorkspaceChatEvent =
  | WorkspaceChatEventDelta
  | WorkspaceChatEventToolCall
  | WorkspaceChatEventToolResult;

export interface StreamWorkspaceChatParams {
  workspaceId: string;
  history: ChatMessage[];
  userMessage: string;
  onEvent?: (event: WorkspaceChatEvent) => void;
}

export interface StreamWorkspaceChatResult {
  content: string;
  uiMessages: Array<{
    type: "text" | "tool_call";
    text?: string;
    toolCall?: {
      id: string;
      name: string;
      target: string;
      artifactId?: string;
      range?: { startLine: number; endLine: number };
      status: "completed" | "failed";
    };
  }>;
  finishReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
}

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: env.openai.apiKey,
    ...(env.openai.baseUrl ? { baseURL: env.openai.baseUrl } : {}),
  });
}

function parseToolCallArguments(rawArguments: string): unknown {
  if (!rawArguments.trim()) return {};
  return JSON.parse(rawArguments);
}

export async function streamWorkspaceChat(
  params: StreamWorkspaceChatParams,
): Promise<StreamWorkspaceChatResult> {
  const client = getOpenAIClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildSystemPrompt(),
    } as OpenAI.Chat.ChatCompletionMessageParam,
    ...params.history.map(
      (message) =>
        ({
          role: message.role,
          content: message.content,
        }) as OpenAI.Chat.ChatCompletionMessageParam,
    ),
    {
      role: "user",
      content: params.userMessage,
    } as OpenAI.Chat.ChatCompletionMessageParam,
  ];

  let aggregatedContent = "";
  let finishReason: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  const uiMessages: StreamWorkspaceChatResult["uiMessages"] = [];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const openaiStream = await client.chat.completions.create({
      model: env.openai.model,
      messages,
      tools: workspaceToolDefinitions as unknown as OpenAI.Chat.ChatCompletionTool[],
      tool_choice: "auto",
      stream: true,
      stream_options: { include_usage: true },
    });

    const currentTurnContent: string[] = [];
    const toolCalls = new Map<
      number,
      { id?: string; name?: string; arguments: string }
    >();
    let turnFinishReason: string | null = null;
    let turnHadToolCall = false;

    for await (const chunk of openaiStream) {
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
        completionTokens = chunk.usage.completion_tokens ?? completionTokens;
      }

      const choice = chunk.choices?.[0];
      if (!choice) continue;

      if (choice.finish_reason) {
        turnFinishReason = choice.finish_reason;
      }

      const delta = choice.delta as {
        content?: string;
        tool_calls?: Array<{
          index?: number;
          id?: string;
          type?: string;
          function?: { name?: string; arguments?: string };
        }>;
      };

      const content = delta.content ?? "";
      if (content) {
        aggregatedContent += content;
        currentTurnContent.push(content);
        params.onEvent?.({ type: "delta", text: content });
      }

      for (const toolCallDelta of delta.tool_calls ?? []) {
        turnHadToolCall = true;
        const index = toolCallDelta.index ?? 0;
        const existing = toolCalls.get(index) ?? { arguments: "" };

        if (toolCallDelta.id) {
          existing.id = toolCallDelta.id;
        }
        if (toolCallDelta.function?.name) {
          existing.name = toolCallDelta.function.name;
        }
        if (toolCallDelta.function?.arguments) {
          existing.arguments += toolCallDelta.function.arguments;
        }

        toolCalls.set(index, existing);
      }
    }

    finishReason = turnFinishReason ?? finishReason;

    if (currentTurnContent.length > 0 && currentTurnContent.join("").trim() !== "") {
      uiMessages.push({
        type: "text",
        text: currentTurnContent.join(""),
      });
    }

    const orderedToolCalls = Array.from(toolCalls.entries())
      .sort(([left], [right]) => left - right)
      .map(([, value]) => value)
      .filter((value) => value.id && value.name);

    if (orderedToolCalls.length === 0) {
      break;
    }

    messages.push(
      {
        role: "assistant",
        content: currentTurnContent.join(""),
        tool_calls: orderedToolCalls.map((toolCall) => ({
          id: toolCall.id as string,
          type: "function" as const,
          function: {
            name: toolCall.name as WorkspaceToolName,
            arguments: toolCall.arguments,
          },
        })),
      } as OpenAI.Chat.ChatCompletionMessageParam,
    );

    for (const toolCall of orderedToolCalls) {
      const toolCallId = toolCall.id as string;
      const toolName = toolCall.name as WorkspaceToolName;
      const rawArguments = parseToolCallArguments(toolCall.arguments);

      try {
        const prepared = await prepareWorkspaceToolInvocation(
          params.workspaceId,
          toolName,
          rawArguments,
        );

        params.onEvent?.({
          type: "tool_call",
          toolCallId,
          name: toolName,
          target: prepared.descriptor.target,
          artifactId: prepared.descriptor.artifactId,
          range: prepared.descriptor.range,
          status: "running",
        });

        const toolContent = await prepared.run();
        params.onEvent?.({
          type: "tool_result",
          toolCallId,
          status: "completed",
        });

        uiMessages.push({
          type: "tool_call",
          toolCall: {
            id: toolCallId,
            name: toolName,
            target: prepared.descriptor.target,
            artifactId: prepared.descriptor.artifactId,
            range: prepared.descriptor.range,
            status: "completed",
          },
        });

        messages.push(
          {
            role: "tool",
            tool_call_id: toolCallId,
            content: toolContent,
          } as OpenAI.Chat.ChatCompletionMessageParam,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Tool execution failed.";

        params.onEvent?.({
          type: "tool_call",
          toolCallId,
          name: toolName,
          target: toolName,
          status: "running",
        });
        params.onEvent?.({
          type: "tool_result",
          toolCallId,
          status: "failed",
          message,
        });

        uiMessages.push({
          type: "tool_call",
          toolCall: {
            id: toolCallId,
            name: toolName,
            target: toolName,
            status: "failed",
          },
        });

        messages.push(
          {
            role: "tool",
            tool_call_id: toolCallId,
            content: JSON.stringify({ error: message }),
          } as OpenAI.Chat.ChatCompletionMessageParam,
        );
      }
    }

    if (!turnHadToolCall) {
      break;
    }
  }

  return {
    content: aggregatedContent,
    uiMessages,
    finishReason,
    promptTokens,
    completionTokens,
  };
}
