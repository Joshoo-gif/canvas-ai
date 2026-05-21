-- =============================================================================
-- Canvas AI — Authentication & Workspace Scoping
-- Custom authentication tables and assigning workspaces to users.
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table users is 'Stores registered users for custom authentication.';

create or replace trigger users_updated_at
  before update on users
  for each row execute function update_updated_at_column();

-- -----------------------------------------------------------------------
-- 2. Sessions Table
-- -----------------------------------------------------------------------
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  token_hash    text unique not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

comment on table sessions is 'Stores active login sessions (hashed opaque tokens).';

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_token_hash_idx on sessions(token_hash);

-- -----------------------------------------------------------------------
-- 3. Scope Workspaces to Users
-- -----------------------------------------------------------------------
alter table workspaces
  add column if not exists user_id uuid references users(id) on delete cascade;

create index if not exists workspaces_user_id_idx on workspaces(user_id);

-- Optional RLS updates if you plan to enable RLS:
-- create policy "Users can view own workspaces" on workspaces for select using (auth.uid() = user_id);
