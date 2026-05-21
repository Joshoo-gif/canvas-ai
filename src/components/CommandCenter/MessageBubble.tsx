"use client";

import type { Message, ToolCall } from "./types";
import ThoughtCard from "./ThoughtCard";
import ToolCallCard from "./ToolCallCard";
import type { ThemeClasses } from "@/components/ui";

interface MessageBubbleProps {
  message: Message;
  onToolCallClick?: (toolCall: ToolCall) => void;
  tc: ThemeClasses;
}

/**
 * Renders a single message in the conversation thread.
 * Handles user and agent variants, including thought cards and tool call cards.
 */
export default function MessageBubble({
  message,
  onToolCallClick,
  tc,
}: MessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div className={`mb-1.5 text-[10px] font-mono ${tc.textSecondary}`}>
        {message.timestamp}
      </div>

      {isUser ? (
        <div
          className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed ${tc.userBubble}`}
        >
          {message.text}
        </div>
      ) : (
        <div className="w-full max-w-[92%] space-y-3">
          {message.text && (
            <div
              className={`rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${tc.agentBubble} ${tc.border}`}
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
  );
}
