"use client";

import { ArrowUp, Loader2, Paperclip, Mic } from "lucide-react";
import type React from "react";
import type { ThemeClasses } from "@/components/ui";

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  tc: ThemeClasses;
  isDark: boolean;
  /** Disable the input while the assistant is streaming a response. */
  isStreaming?: boolean;
}

/**
 * Sleek floating chat input with:
 *   - Auto-grow textarea
 *   - Subtle focus ring
 *   - Animated send button
 *   - Attachment + mic hints
 *
 * While streaming: send button shows a spinner and is disabled.
 */
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  tc,
  isDark,
  isStreaming = false,
}: ChatInputProps) {
  const hasText = value.trim().length > 0;
  const canSubmit = hasText && !isStreaming;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit(e);
    }
  };

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      {/* Hint text */}
      <p className={`mb-2 text-center text-[10px] ${tc.textSecondary}`}>
        {isStreaming ? "Agent is responding…" : "↵ to send · Shift+↵ for new line"}
      </p>

      <form
        onSubmit={onSubmit}
        className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
          isDark
            ? "border-[#303030] bg-[#161616] focus-within:border-[#505050]"
            : "border-[#DDDBD9] bg-white focus-within:border-[#B0AEA8]"
        }`}
      >
        {/* Textarea */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Waiting for agent…"
                : "Ask anything, run tools, or describe a task…"
            }
            disabled={isStreaming}
            rows={3}
            className={`w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none disabled:opacity-50 ${tc.textarea}`}
          />
        </div>

        {/* Divider */}
        <div className={`mx-4 h-px ${isDark ? "bg-[#282828]" : "bg-[#EDEBE9]"}`} />

        {/* Actions bar */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Attach file"
              title="Attach file"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                isDark
                  ? "text-[#606060] hover:bg-[#242424] hover:text-[#A8A29E]"
                  : "text-[#B0AEA8] hover:bg-[#F2F0EE] hover:text-[#737373]"
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Voice input"
              title="Voice input"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                isDark
                  ? "text-[#606060] hover:bg-[#242424] hover:text-[#A8A29E]"
                  : "text-[#B0AEA8] hover:bg-[#F2F0EE] hover:text-[#737373]"
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isStreaming ? "Waiting for response" : "Send message"}
            title={isStreaming ? "Agent is responding…" : "Send prompt"}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
              canSubmit
                ? isDark
                  ? "bg-[#FAFAF9] text-[#171717] hover:bg-[#E7E5E4] hover:scale-105 active:scale-95"
                  : "bg-[#0A0A0A] text-white hover:bg-[#404040] hover:scale-105 active:scale-95"
                : isDark
                  ? "bg-[#242424] text-[#484848] cursor-not-allowed"
                  : "bg-[#F0EEEC] text-[#C0BEB8] cursor-not-allowed"
            }`}
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
