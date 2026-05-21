/**
 * Server-side environment variable validation.
 * Import this module only in server code (API routes, server components).
 * All values are validated at module-load time so misconfigurations fail fast.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
        "Check your .env file against .env.example.",
    );
  }
  return value.trim();
}

function optionalEnv(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).trim();
}

export const env = {
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    secret: requireEnv("SUPABASE_SECRET"),
  },
  openai: {
    apiKey: requireEnv("OPENAI_API_KEY"),
    model: optionalEnv("OPENAI_MODEL", "gpt-4o-mini"),
    /** Optional custom base URL — leave blank to use the default OpenAI API. */
    baseUrl: optionalEnv("OPENAI_BASE_URL", ""),
  },
  canvas: {
    defaultWorkspaceId: optionalEnv("CANVAS_DEFAULT_WORKSPACE_ID"),
  },
} as const;
