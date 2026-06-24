-- Phase 3 Stage 27: initial Supabase backend foundation for TopoPass.
-- This migration prepares the future account-backed data model only.
-- Existing app flows continue to use local/demo data until later stages.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_mode text not null check (
    practice_mode in ('knowledge', 'map-click', 'route-drawing', 'mixed')
  ),
  status text not null default 'submitted' check (
    status in ('in_progress', 'submitted', 'abandoned', 'expired')
  ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  max_score integer,
  percentage numeric(5, 2),
  passed boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_attempt_id uuid references public.practice_attempts(id) on delete cascade,
  question_id text not null,
  question_type text not null check (
    question_type in ('knowledge', 'map-click', 'route-drawing')
  ),
  answer jsonb,
  result jsonb,
  score integer,
  max_score integer,
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'practice' check (
    mode in ('practice', 'exam', 'weak-areas', 'mistakes')
  ),
  status text not null default 'in_progress' check (
    status in ('in_progress', 'submitted', 'abandoned', 'expired')
  ),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz,
  duration_seconds integer,
  score integer,
  max_score integer,
  percentage numeric(5, 2),
  passed boolean,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_attempt_id uuid not null references public.mock_attempts(id) on delete cascade,
  question_id text not null,
  question_type text not null check (
    question_type in ('knowledge', 'map-click', 'route-drawing')
  ),
  question_index integer not null check (question_index >= 0),
  answer jsonb,
  result jsonb,
  score integer,
  max_score integer,
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mock_attempt_id, question_id)
);

create table if not exists public.saved_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  mistake_state jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_bank_items (
  id text primary key,
  question_type text not null check (
    question_type in ('knowledge', 'map-click', 'route-drawing')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'active', 'archived')
  ),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  category text,
  prompt text not null,
  explanation text,
  tip text,
  tags text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  source text not null default 'static',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx
on public.profiles(role);

create index if not exists practice_attempts_user_created_idx
on public.practice_attempts(user_id, created_at desc);

create index if not exists practice_attempts_user_mode_idx
on public.practice_attempts(user_id, practice_mode, created_at desc);

create index if not exists question_attempts_user_created_idx
on public.question_attempts(user_id, created_at desc);

create index if not exists question_attempts_practice_attempt_idx
on public.question_attempts(practice_attempt_id);

create index if not exists mock_attempts_user_created_idx
on public.mock_attempts(user_id, created_at desc);

create index if not exists mock_attempts_user_mode_idx
on public.mock_attempts(user_id, mode, created_at desc);

create index if not exists mock_question_attempts_mock_attempt_idx
on public.mock_question_attempts(mock_attempt_id, question_index);

create index if not exists mock_question_attempts_user_created_idx
on public.mock_question_attempts(user_id, created_at desc);

create index if not exists saved_progress_user_idx
on public.saved_progress(user_id);

create index if not exists question_bank_items_type_status_idx
on public.question_bank_items(question_type, status);

create index if not exists question_bank_items_tags_idx
on public.question_bank_items using gin(tags);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists practice_attempts_set_updated_at on public.practice_attempts;
create trigger practice_attempts_set_updated_at
before update on public.practice_attempts
for each row execute function public.set_updated_at();

drop trigger if exists question_attempts_set_updated_at on public.question_attempts;
create trigger question_attempts_set_updated_at
before update on public.question_attempts
for each row execute function public.set_updated_at();

drop trigger if exists mock_attempts_set_updated_at on public.mock_attempts;
create trigger mock_attempts_set_updated_at
before update on public.mock_attempts
for each row execute function public.set_updated_at();

drop trigger if exists mock_question_attempts_set_updated_at on public.mock_question_attempts;
create trigger mock_question_attempts_set_updated_at
before update on public.mock_question_attempts
for each row execute function public.set_updated_at();

drop trigger if exists saved_progress_set_updated_at on public.saved_progress;
create trigger saved_progress_set_updated_at
before update on public.saved_progress
for each row execute function public.set_updated_at();

drop trigger if exists question_bank_items_set_updated_at on public.question_bank_items;
create trigger question_bank_items_set_updated_at
before update on public.question_bank_items
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.question_attempts enable row level security;
alter table public.mock_attempts enable row level security;
alter table public.mock_question_attempts enable row level security;
alter table public.saved_progress enable row level security;
alter table public.question_bank_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "practice_attempts_own_access" on public.practice_attempts;
create policy "practice_attempts_own_access"
on public.practice_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "practice_attempts_admin_read" on public.practice_attempts;
create policy "practice_attempts_admin_read"
on public.practice_attempts for select
using (public.is_admin());

drop policy if exists "question_attempts_own_access" on public.question_attempts;
create policy "question_attempts_own_access"
on public.question_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "question_attempts_admin_read" on public.question_attempts;
create policy "question_attempts_admin_read"
on public.question_attempts for select
using (public.is_admin());

drop policy if exists "mock_attempts_own_access" on public.mock_attempts;
create policy "mock_attempts_own_access"
on public.mock_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "mock_attempts_admin_read" on public.mock_attempts;
create policy "mock_attempts_admin_read"
on public.mock_attempts for select
using (public.is_admin());

drop policy if exists "mock_question_attempts_own_access" on public.mock_question_attempts;
create policy "mock_question_attempts_own_access"
on public.mock_question_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "mock_question_attempts_admin_read" on public.mock_question_attempts;
create policy "mock_question_attempts_admin_read"
on public.mock_question_attempts for select
using (public.is_admin());

drop policy if exists "saved_progress_own_access" on public.saved_progress;
create policy "saved_progress_own_access"
on public.saved_progress for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "saved_progress_admin_read" on public.saved_progress;
create policy "saved_progress_admin_read"
on public.saved_progress for select
using (public.is_admin());

drop policy if exists "question_bank_items_active_read" on public.question_bank_items;
create policy "question_bank_items_active_read"
on public.question_bank_items for select
using (status = 'active' or public.is_admin());

drop policy if exists "question_bank_items_admin_manage" on public.question_bank_items;
create policy "question_bank_items_admin_manage"
on public.question_bank_items for all
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;

grant select on public.question_bank_items to anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.practice_attempts to authenticated;
grant select, insert, update, delete on public.question_attempts to authenticated;
grant select, insert, update, delete on public.mock_attempts to authenticated;
grant select, insert, update, delete on public.mock_question_attempts to authenticated;
grant select, insert, update, delete on public.saved_progress to authenticated;
grant select, insert, update, delete on public.question_bank_items to authenticated;

-- Future stages:
-- 1. Add auth UI and profile creation hooks.
-- 2. Add admin role management and stricter publishing workflows.
-- 3. Move local practice persistence to these user-owned tables.
-- 4. Add audit/event logging before production admin publishing.
