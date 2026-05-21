"use client";

import type { Message, ToolCall } from "./types";
import ThoughtCard from "./ThoughtCard";
import ToolCallCard from "./ToolCallCard";
import type { ThemeClasses } from "@/components/ui";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onToolCallClick?: (toolCall: ToolCall) => void;
  tc: ThemeClasses;
  isDark: boolean;
}

/**
 * Renders a single message in the conversation thread.
 * Handles user and agent variants, including thought cards and tool call cards.
 *
 * When an agent message has an empty text (isLive), a three-dot loading
 * indicator is shown instead of a bubble with a blinking cursor.
 */
export default function MessageBubble({
  message,
  onToolCallClick,
  tc,
  isDark,
}: MessageBubbleProps) {
  const isUser = message.sender === "user";
  // A message is "live" if it's an agent message that has no text yet
  // (the streaming placeholder state).
  const isLive = !isUser && message.text === "";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isDark
                ? "bg-[#2A2A2A] text-[#A8A29E]"
                : "bg-[#E8E6E4] text-[#737373]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
              isDark
                ? "bg-[#1E1E1E] border-[#303030] text-[#A8A29E]"
                : "bg-white border-[#E8E6E4] text-[#737373]"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex min-w-0 flex-1 flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Sender label + timestamp */}
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className={`text-[11px] font-semibold ${tc.textPrimary}`}>
            {isUser ? "You" : "Agent"}
          </span>
          <span className={`text-[10px] font-mono ${tc.textSecondary}`}>
            {message.timestamp}
          </span>
        </div>

        {isUser ? (
          <div
            className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed ${tc.userBubble}`}
          >
            {message.text}
          </div>
        ) : (
          <div className="w-full max-w-[92%] space-y-2.5">
            {/* Loading dots while waiting for first token */}
            {isLive && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm border px-4 py-3 ${
                  isDark
                    ? "border-[#282828] bg-[#161616]"
                    : "border-[#EBEBEB] bg-white shadow-sm shadow-black/[0.04]"
                }`}
                aria-label="Agent is thinking"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${
                    isDark ? "bg-[#606060]" : "bg-[#C0BEB8]"
                  }`}
                />
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${
                    isDark ? "bg-[#606060]" : "bg-[#C0BEB8]"
                  }`}
                />
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-bounce ${
                    isDark ? "bg-[#606060]" : "bg-[#C0BEB8]"
                  }`}
                />
              </div>
            )}

            {/* Text bubble — only shown once there is text, no cursor */}
            {message.text && (
              <div
                className={`rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed ${
                  isDark
                    ? "border-[#282828] bg-[#161616] text-[#E8E6E4]"
                    : "border-[#EBEBEB] bg-white text-[#1A1A1A] shadow-sm shadow-black/[0.04]"
                }`}
              >
                {message.text}
              </div>
            )}

            {message.thoughts && message.thoughts.length > 0 && (
              <ThoughtCard
                thoughts={message.thoughts}
                messageId={message.id}
                tc={tc}
              />
            )}

            {message.toolCall && (
              <ToolCallCard
                toolCall={message.toolCall}
                onToolCallClick={onToolCallClick}
                tc={tc}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
