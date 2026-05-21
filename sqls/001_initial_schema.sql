-- =============================================================================
-- Canvas AI — Initial Schema
-- Run this migration in your Supabase SQL editor (or via supabase db push).
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Workspaces
-- -----------------------------------------------------------------------
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table workspaces is 'Named workspaces that group conversations.';

-- -----------------------------------------------------------------------
-- 2. Conversations
-- -----------------------------------------------------------------------
create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title        text not null default 'New conversation',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table conversations is 'A single chat thread within a workspace.';

create index if not exists conversations_workspace_id_idx
  on conversations(workspace_id);

-- -----------------------------------------------------------------------
-- 3. Messages
-- -----------------------------------------------------------------------
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  -- Optional: store raw finish_reason / token counts for observability
  finish_reason   text,
  prompt_tokens   integer,
  completion_tokens integer,
  created_at      timestamptz not null default now()
);

comment on table messages is 'Individual messages belonging to a conversation.';

create index if not exists messages_conversation_id_idx
  on messages(conversation_id);
create index if not exists messages_created_at_idx
  on messages(created_at);

-- -----------------------------------------------------------------------
-- 4. Auto-update updated_at trigger helper
-- -----------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at_column();

create or replace trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at_column();

-- -----------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- NOTE: Canvas uses the secret key server-side only, so RLS is an optional
-- safeguard. Enable and configure policies below if you also expose a
-- client-side authenticated path.
-- -----------------------------------------------------------------------
alter table workspaces    enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;

-- Example: allow service-role bypass (Supabase secret key already bypasses RLS).
-- Add per-user policies here when you add authentication:
--
-- create policy "users can read own workspace" on workspaces
--   for select using (auth.uid() = owner_id);
