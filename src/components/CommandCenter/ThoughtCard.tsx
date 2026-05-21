"use client";

import { BrainCircuit } from "lucide-react";
import type { ThemeClasses } from "@/components/ui";

interface ThoughtCardProps {
  thoughts: string[];
  messageId: string;
  tc: ThemeClasses;
}

/**
 * Displays the agent's internal reasoning steps as a collapsible card
 * under an agent message bubble.
 */
export default function ThoughtCard({ thoughts, messageId, tc }: ThoughtCardProps) {
  return (
    <div
      className={`space-y-1.5 rounded-xl border p-3 text-xs ${tc.thoughtCard} ${tc.border}`}
    >
      <div
        className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${tc.textSecondary}`}
      >
        <BrainCircuit className="h-3 w-3" />
        Thinking
      </div>
      <ul className="list-none space-y-1 font-mono">
        {thoughts.map((thought, idx) => (
          <li
            key={`${messageId}-thought-${idx}`}
            className="flex items-start gap-1.5"
          >
            <span className="mt-0.5 shrink-0 text-[#D6D3D1]">›</span>
            {thought}
          </li>
        ))}
      </ul>
    </div>
  );
}
