/**
 * Database type definitions derived from the Supabase schema.
 * Keep this file in sync with sqls/001_initial_schema.sql and sqls/002_workspace_files.sql.
 *
 * When using the Supabase CLI you can auto-generate this file with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/types.ts
 *
 * The shape here follows the exact GenericSchema contract that @supabase/supabase-js v2
 * expects so that createClient<Database> resolves table types correctly.
 */

export type MessageRole = "user" | "assistant" | "system";

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export interface WorkspaceRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceFileRow {
  id: string;
  workspace_id: string;
  original_name: string;
  mime_type: string;
  extension: string;
  byte_size: number;
  extracted_text: string;
  extracted_lines: string[];
  line_count: number;
  processing_status: "ready" | "error";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  workspace_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  finish_reason: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Insert shapes (fields with DB defaults are optional)
// ---------------------------------------------------------------------------

export type WorkspaceInsert = {
  id?: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkspaceFileInsert = {
  id?: string;
  workspace_id: string;
  original_name: string;
  mime_type: string;
  extension: string;
  byte_size: number;
  extracted_text?: string;
  extracted_lines?: string[];
  line_count?: number;
  processing_status?: "ready" | "error";
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ConversationInsert = {
  id?: string;
  workspace_id?: string | null;
  title?: string;
  created_at?: string;
  updated_at?: string;
};

export type MessageInsert = {
  id?: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  finish_reason?: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Typed database schema — must satisfy GenericSchema from supabase-js v2
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: WorkspaceRow;
        Insert: WorkspaceInsert;
        Update: Partial<WorkspaceInsert>;
        Relationships: [];
      };
      workspace_files: {
        Row: WorkspaceFileRow;
        Insert: WorkspaceFileInsert;
        Update: Partial<WorkspaceFileInsert>;
        Relationships: [
          {
            foreignKeyName: "workspace_files_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: ConversationRow;
        Insert: ConversationInsert;
        Update: Partial<ConversationInsert>;
        Relationships: [
          {
            foreignKeyName: "conversations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: MessageRow;
        Insert: MessageInsert;
        Update: Partial<MessageInsert>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
