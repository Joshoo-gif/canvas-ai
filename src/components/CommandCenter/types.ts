/**
 * Shared types for the CommandCenter feature module.
 */
export interface ToolCall {
  name: string;
  target: string;
  range?: { startLine: number; endLine: number };
  status: "running" | "completed" | "failed";
}

export interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  thoughts?: string[];
  toolCall?: ToolCall;
}
