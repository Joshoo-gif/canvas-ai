/**
 * useChat — client-side hook for streaming chat with /api/chat.
 *
 * Manages:
 *  - Message list state
 *  - Loading persisted workspace chat history from Supabase
 *  - Streaming assistant responses via SSE
 *  - conversationId persistence across turns
 *  - Agent status label updates
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@/components/CommandCenter/types";

function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface UseChatOptions {
  workspaceId?: string | null;
  conversationId?: string | null;
  /** Called whenever agent status should update. */
  onStatusChange?: (status: string) => void;
  initialMessages?: Message[];
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  isLoadingHistory: boolean;
  sendMessage: (text: string) => Promise<void>;
  conversationId: string | null;
}

export function useChat({
  workspaceId,
  conversationId,
  onStatusChange,
  initialMessages = [],
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);

  const setStatus = useCallback(
    (status: string) => {
      onStatusChange?.(status);
    },
    [onStatusChange],
  );

  useEffect(() => {
    let cancelled = false;

    if (!workspaceId) {
      conversationIdRef.current = null;
      activeAssistantMessageIdRef.current = null;
      setMessages([]);
      setIsLoadingHistory(false);
      setStatus("Create a workspace to start chatting.");
      return () => {
        cancelled = true;
      };
    }

    if (conversationId === "new") {
      conversationIdRef.current = null;
      activeAssistantMessageIdRef.current = null;
      setMessages([]);
      setIsLoadingHistory(false);
      setStatus("Agent Idle");
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingHistory(true);
    setStatus("Loading workspace chat...");

    void (async () => {
      try {
        const url = new URL(`/api/workspaces/${workspaceId}/chat`, window.location.origin);
        if (conversationId) {
          url.searchParams.set("conversationId", conversationId);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payload: {
          conversation: { id: string } | null;
          messages: Message[];
        } = await response.json();

        if (cancelled) return;

        conversationIdRef.current = payload.conversation?.id ?? null;
        activeAssistantMessageIdRef.current = null;
        setMessages(payload.messages ?? []);
        setStatus(payload.messages.length > 0 ? "Agent Idle" : "Workspace Ready");
      } catch (error) {
        if (cancelled) return;
        conversationIdRef.current = null;
        activeAssistantMessageIdRef.current = null;
        setMessages([]);
        setStatus(
          error instanceof Error
            ? `Failed to load workspace chat: ${error.message}`
            : "Failed to load workspace chat.",
        );
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, conversationId, setStatus]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || isLoadingHistory || !text.trim()) return;
      if (!workspaceId) {
        setStatus("Create a workspace first.");
        return;
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: timestamp(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatus("Agent Thinking...");
      setIsStreaming(true);

      // Placeholder for the streaming assistant message.
      const assistantId = `agent-${Date.now()}`;
      activeAssistantMessageIdRef.current = assistantId;
      const placeholderMsg: Message = {
        id: assistantId,
        sender: "agent",
        text: "",
        timestamp: timestamp(),
      };

      setMessages((prev) => [...prev, placeholderMsg]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId: conversationIdRef.current,
            workspaceId: workspaceId ?? null,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        setStatus("Agent Responding...");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === "meta") {
              // Capture the conversationId for subsequent turns.
              if (event.conversationId) {
                conversationIdRef.current = event.conversationId as string;
              }
            } else if (event.type === "tool_call") {
              const toolCallMessage: Message = {
                id: event.toolCallId as string,
                sender: "agent",
                text: "",
                timestamp: timestamp(),
                toolCall: {
                  id: event.toolCallId as string,
                  name: event.name as string,
                  target: event.target as string,
                  artifactId:
                    typeof event.artifactId === "string"
                      ? event.artifactId
                      : undefined,
                  range:
                    event.range &&
                    typeof event.range === "object" &&
                    typeof (event.range as { startLine?: unknown }).startLine ===
                      "number" &&
                    typeof (event.range as { endLine?: unknown }).endLine ===
                      "number"
                      ? {
                          startLine: (event.range as { startLine: number })
                            .startLine,
                          endLine: (event.range as { endLine: number }).endLine,
                        }
                      : undefined,
                  status: "running",
                },
              };

              const currentAssistantMessageId =
                activeAssistantMessageIdRef.current;

              setMessages((prev) => {
                if (!currentAssistantMessageId) {
                  return [...prev, toolCallMessage];
                }

                const currentAssistantMessage = prev.find(
                  (message) => message.id === currentAssistantMessageId,
                );
                const shouldRemoveEmptyPlaceholder =
                  currentAssistantMessage?.sender === "agent" &&
                  currentAssistantMessage.text.trim() === "" &&
                  !currentAssistantMessage.toolCall &&
                  !(currentAssistantMessage.thoughts?.length ?? 0);

                if (!shouldRemoveEmptyPlaceholder) {
                  return [...prev, toolCallMessage];
                }

                return [
                  ...prev.filter(
                    (message) => message.id !== currentAssistantMessageId,
                  ),
                  toolCallMessage,
                ];
              });

              activeAssistantMessageIdRef.current = null;
              setStatus(`Agent Inspecting ${toolCallMessage.toolCall?.name}...`);
            } else if (event.type === "tool_result") {
              const toolStatus =
                event.status === "completed" || event.status === "failed"
                  ? event.status
                  : null;
              if (!toolStatus) continue;

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === (event.toolCallId as string) &&
                  message.toolCall
                    ? {
                        ...message,
                        toolCall: {
                          ...message.toolCall,
                          status: toolStatus,
                        },
                      }
                    : message,
                ),
              );

              if (toolStatus === "failed") {
                setStatus("Agent Error");
              } else {
                setStatus("Agent Responding...");
              }
            } else if (event.type === "delta") {
              const chunk = (event.text as string) ?? "";
              if (!chunk) continue;
              const currentAssistantMessageId =
                activeAssistantMessageIdRef.current;

              if (!currentAssistantMessageId) {
                const nextAssistantId = `agent-${Date.now()}`;
                activeAssistantMessageIdRef.current = nextAssistantId;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: nextAssistantId,
                    sender: "agent",
                    text: chunk,
                    timestamp: timestamp(),
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((message) =>
                    message.id === currentAssistantMessageId
                      ? { ...message, text: message.text + chunk }
                      : message,
                  ),
                );
              }
            } else if (event.type === "done") {
              setStatus("Agent Idle");
            } else if (event.type === "error") {
              const errMsg = (event.message as string) ?? "Unknown error.";
              const targetAssistantId =
                activeAssistantMessageIdRef.current ?? assistantId;
              activeAssistantMessageIdRef.current = null;
              setMessages((prev) => {
                const targetMessageExists = prev.some(
                  (message) => message.id === targetAssistantId,
                );

                if (targetMessageExists) {
                  return prev.map((message) =>
                    message.id === targetAssistantId
                      ? {
                          ...message,
                          text: message.text || `⚠️ Error: ${errMsg}`,
                        }
                      : message,
                  );
                }

                return [
                  ...prev,
                  {
                    id: `agent-error-${Date.now()}`,
                    sender: "agent",
                    text: `⚠️ Error: ${errMsg}`,
                    timestamp: timestamp(),
                  },
                ];
              });
              setStatus("Agent Error");
            }
          }
        }
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : "Failed to reach the server.";
        const targetAssistantId =
          activeAssistantMessageIdRef.current ?? assistantId;
        activeAssistantMessageIdRef.current = null;
        setMessages((prev) => {
          const targetMessageExists = prev.some(
            (message) => message.id === targetAssistantId,
          );

          if (targetMessageExists) {
            return prev.map((message) =>
              message.id === targetAssistantId
                ? {
                    ...message,
                    text: message.text || `⚠️ ${errMsg}`,
                  }
                : message,
            );
          }

          return [
            ...prev,
            {
              id: `agent-error-${Date.now()}`,
              sender: "agent",
              text: `⚠️ ${errMsg}`,
              timestamp: timestamp(),
            },
          ];
        });
        setStatus("Agent Error");
      } finally {
        setIsStreaming(false);
      }
    },
    [isLoadingHistory, isStreaming, workspaceId, setStatus],
  );

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    conversationId: conversationIdRef.current,
  };
}
