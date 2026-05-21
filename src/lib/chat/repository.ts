/**
 * Conversation repository — server-side data access for conversations and messages.
 * All queries use the server Supabase client (secret key, bypasses RLS).
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { ConversationRow, MessageRow, MessageRole } from "@/lib/supabase/types";

export type { ConversationRow, MessageRow };

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * Create a new conversation in the given workspace.
 */
export async function createConversation(
  workspaceId: string,
  title = "New conversation",
): Promise<ConversationRow> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("conversations")
    .insert({ workspace_id: workspaceId, title })
    .select()
    .single();

  if (error || !data)
    throw new Error(
      `[conversation] createConversation failed: ${error?.message}`,
    );
  return data as ConversationRow;
}

/**
 * List all conversations for a workspace newest-first.
 */
export async function listConversationsByWorkspace(
  workspaceId: string,
): Promise<ConversationRow[]> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[conversation] listConversationsByWorkspace failed: ${error.message}`,
    );
  }

  return (data as ConversationRow[]) ?? [];
}

/**
 * Find the most recently updated conversation for a workspace.
 */
export async function findLatestConversationByWorkspace(
  workspaceId: string,
): Promise<ConversationRow | null> {
  const conversations = await listConversationsByWorkspace(workspaceId);
  return conversations[0] ?? null;
}

/**
 * Find a conversation by ID.
 */
export async function findConversationById(
  id: string,
): Promise<ConversationRow | null> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error)
    throw new Error(
      `[conversation] findConversationById failed: ${error.message}`,
    );
  return (data as ConversationRow) ?? null;
}

/**
 * Update conversation title.
 */
export async function updateConversationTitle(
  id: string,
  title: string,
): Promise<void> {
  const db = getSupabaseServer();
  const { error } = await db
    .from("conversations")
    .update({ title })
    .eq("id", id);

  if (error)
    throw new Error(
      `[conversation] updateConversationTitle failed: ${error.message}`,
    );
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * Load all messages for a conversation ordered by creation time.
 */
export async function listMessages(
  conversationId: string,
): Promise<MessageRow[]> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error)
    throw new Error(`[conversation] listMessages failed: ${error.message}`);
  return (data as MessageRow[]) ?? [];
}

export interface InsertMessageParams {
  conversationId: string;
  role: MessageRole;
  content: string;
  finishReason?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
}

/**
 * Persist a single message and return the saved row.
 */
export async function insertMessage(
  params: InsertMessageParams,
): Promise<MessageRow> {
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      finish_reason: params.finishReason ?? null,
      prompt_tokens: params.promptTokens ?? null,
      completion_tokens: params.completionTokens ?? null,
    })
    .select()
    .single();

  if (error || !data)
    throw new Error(`[conversation] insertMessage failed: ${error?.message}`);
  return data as MessageRow;
}
