-- =============================================================================
-- Canvas AI — Workspace File Ingestion
-- Adds workspace-scoped uploaded files with extracted text + line storage.
-- =============================================================================

create table if not exists workspace_files (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  original_name    text not null,
  mime_type        text not null,
  extension        text not null,
  byte_size        integer not null,
  extracted_text   text not null default '',
  extracted_lines  text[] not null default '{}'::text[],
  line_count       integer not null default 0,
  processing_status text not null default 'ready'
    check (processing_status in ('ready', 'error')),
  error_message    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table workspace_files is 'Uploaded files ingested for a workspace, stored as normalized text lines.';

create index if not exists workspace_files_workspace_id_idx
  on workspace_files(workspace_id);

create index if not exists workspace_files_created_at_idx
  on workspace_files(created_at);

create or replace trigger workspace_files_updated_at
  before update on workspace_files
  for each row execute function update_updated_at_column();

alter table workspace_files enable row level security;
