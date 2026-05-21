import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedSystemPrompt: string | null = null;

function readPromptFile(): string {
  const promptPath = join(process.cwd(), "src", "prompts", "assistant-persona.md");
  const prompt = readFileSync(promptPath, "utf8").trim();

  if (!prompt) {
    throw new Error("[chat] src/prompts/assistant-persona.md is empty.");
  }

  return prompt;
}

export function buildSystemPrompt(): string {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const prompt = readPromptFile();

  cachedSystemPrompt = [
    prompt,
    "## Workspace behavior",
    "When a workspace is available, your first action for orientation must be to call list_workspace_artifacts.",
    "Use global_workspace_search to find documents or concepts across the active workspace.",
    "Use locate_keyword_instances to find exact line numbers and snippets in a target file before reading ranges.",
    "Use read_file_segments for narrow line-range inspection, and keep ranges under 250 lines.",
    "Never guess file contents when a tool can inspect them directly.",
  ].join("\n\n");

  return cachedSystemPrompt;
}
