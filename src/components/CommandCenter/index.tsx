"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeClasses, StatusDot } from "@/components/ui";
import type { WorkspaceSettings } from "@/components/workspaceSettings";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import type { Message, ToolCall } from "./types";
import { Bot, MessageSquare, History, Plus } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

// Re-export types so consumers can import from the same path
export type { Message, ToolCall } from "./types";

interface CommandCenterProps {
  messages: Message[];
  agentStatus: string;
  onSendMessage: (text: string) => void;
  onToolCallClick?: (toolCall: ToolCall) => void;
  settings: Pick<WorkspaceSettings, "theme" | "density" | "autoScroll">;
  /** True while the assistant is streaming a response. */
  isStreaming?: boolean;
  onNewChat?: () => void;
  onOpenHistory?: () => void;
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
  isStreaming = false,
  onNewChat,
  onOpenHistory,
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
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden ${isDark ? "bg-[#0E0E0E]" : "bg-[#F8F7F6]"}`}
      aria-label="Agent Command Center"
    >
      {/* Header */}
      <div
        className={`flex h-14 shrink-0 items-center justify-between px-5 border-b ${
          isDark
            ? "bg-[#111111] border-[#282828]"
            : "bg-white border-[#EBEBEB]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isDark
                ? "bg-[#262626] text-[#A8A29E]"
                : "bg-[#F0EEEC] text-[#737373]"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2
              className={`text-[13px] font-semibold tracking-tight leading-none ${tc.textPrimary}`}
            >
              Agent Chat
            </h2>
            <p className={`text-[10px] mt-0.5 ${tc.textSecondary}`}>
              Canvas AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Chat history"
            colorClass={isDark ? "text-[#A8A29E] hover:bg-[#262626] hover:text-[#FAFAF9]" : "text-[#737373] hover:bg-[#F0EEEC] hover:text-[#101011]"}
            sizeClass="h-8 w-8"
            onClick={onOpenHistory}
          >
            <History className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="New chat"
            colorClass={isDark ? "text-[#A8A29E] hover:bg-[#262626] hover:text-[#FAFAF9]" : "text-[#737373] hover:bg-[#F0EEEC] hover:text-[#101011]"}
            sizeClass="h-8 w-8"
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Message thread */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${
          compact ? "px-4 py-4 space-y-3" : "px-5 py-5 space-y-4"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center px-6">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-[#1E1E1E] border border-[#303030]"
                  : "bg-white border border-[#E8E6E4] shadow-sm"
              }`}
            >
              <MessageSquare className={`h-6 w-6 ${tc.textSecondary}`} />
            </div>
            <div className="space-y-2 max-w-xs">
              <div className={`text-sm font-semibold ${tc.textPrimary}`}>
                Start a conversation
              </div>
              <p className={`text-xs leading-relaxed ${tc.textSecondary}`}>
                Select a workspace and type a message below. The agent can
                read files, run tools, and stream responses in real time.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {["Explain the project architecture", "What files are open?", "Run a lint check"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSendMessage(suggestion)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      isDark
                        ? "border-[#2A2A2A] bg-[#1A1A1A] text-[#A8A29E] hover:border-[#404040] hover:text-[#FAFAF9]"
                        : "border-[#E8E6E4] bg-white text-[#737373] hover:border-[#C4C2C0] hover:text-[#0A0A0A]"
                    }`}
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSameSenderAsPrev =
              idx > 0 && messages[idx - 1].sender === msg.sender;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                onToolCallClick={onToolCallClick}
                tc={tc}
                isDark={isDark}
                hideProfile={isSameSenderAsPrev}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        tc={tc}
        isDark={isDark}
        isStreaming={isStreaming}
      />
    </section>
  );
}
