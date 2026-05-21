"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeClasses, StatusDot } from "@/components/ui";
import type { WorkspaceSettings } from "@/components/workspaceSettings";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import type { Message, ToolCall } from "./types";

// Re-export types so consumers can import from the same path
export type { Message, ToolCall } from "./types";

interface CommandCenterProps {
  messages: Message[];
  agentStatus: string;
  onSendMessage: (text: string) => void;
  onToolCallClick?: (toolCall: ToolCall) => void;
  settings: Pick<WorkspaceSettings, "theme" | "density" | "autoScroll">;
}

/**
 * CommandCenter — the right-hand agent interaction panel.
 *
 * Responsibilities:
 *  - Header with title and live agent status
 *  - Scrollable message thread (delegates to MessageBubble)
 *  - Chat input (delegates to ChatInput)
 */
export default function CommandCenter({
  messages,
  agentStatus,
  onSendMessage,
  onToolCallClick,
  settings,
}: CommandCenterProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);
  const compact = settings.density === "compact";

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll down when message list changes
  useEffect(() => {
    if (!settings.autoScroll) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, settings.autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden border-l ${tc.shellMuted} ${tc.border}`}
      aria-label="Agent Command Center"
    >
      {/* Header */}
      <div
        className={`flex h-14 shrink-0 items-center justify-between px-5 ${tc.header} ${tc.border}`}
      >
        <h2 className={`text-sm font-semibold tracking-tight ${tc.textPrimary}`}>
          Command Center
        </h2>
        <StatusDot status={agentStatus} />
      </div>

      {/* Message thread */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${
          compact ? "space-y-4 px-4 py-4" : "space-y-5 px-5 py-5"
        }`}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onToolCallClick={onToolCallClick}
            tc={tc}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        tc={tc}
      />
    </section>
  );
}
