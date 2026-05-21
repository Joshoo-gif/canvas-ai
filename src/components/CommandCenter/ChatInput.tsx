"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import type React from "react";
import type { ThemeClasses } from "@/components/ui";
import IconButton from "@/components/ui/IconButton";

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  tc: ThemeClasses;
}

/**
 * Two-row chat input:
 *   Row 1 — text area
 *   Row 2 — paperclip (attach) on the left, circular send button on the right
 */
export default function ChatInput({ value, onChange, onSubmit, tc }: ChatInputProps) {
  const hasText = value.trim().length > 0;

  const sendClass = hasText
    ? `${tc.btnPrimary} shadow-sm`
    : `${tc.textSecondary} bg-[#E7E5E4] cursor-not-allowed`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="shrink-0 px-4 pb-4 pt-4">
      <form
        onSubmit={onSubmit}
        className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${tc.inputShell} ${tc.border} ${tc.inputFocus}`}
      >
        {/* Row 1: text input */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message, or ask to run tools..."
            rows={2}
            className={`w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none ${tc.textarea}`}
          />
        </div>

        {/* Row 2: actions bar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <IconButton
            label="Attach file"
            colorClass={tc.btnGhost}
            shapeClass="rounded-lg"
          >
            <Paperclip className="h-4 w-4" />
          </IconButton>

          <button
            type="submit"
            disabled={!hasText}
            aria-label="Send message"
            title="Send prompt"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${sendClass}`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
