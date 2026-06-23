-- Stage 15: Supabase persistence foundation for TopoPass.
-- This migration defines the product data model only. Existing app flows still
-- fall back to static/local data until later stages deliberately connect them.

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
  full_name text,
  role text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_banks (
  id text primary key,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  bank_id text references public.question_banks(id) on delete set null,
  question_type text not null check (question_type in ('knowledge', 'map-click', 'route-drawing')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  category text,
  prompt text not null,
  explanation text,
  tags text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  source_note text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'abandoned', 'expired')),
  question_ids text[] not null default '{}',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz,
  score integer,
  max_score integer,
  percentage integer,
  passed boolean,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.mock_test_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  question_type text not null check (question_type in ('knowledge', 'map-click', 'route-drawing')),
  answer jsonb not null default '{}'::jsonb,
  score integer,
  max_score integer,
  passed boolean,
  details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_mode text not null check (practice_mode in ('knowledge', 'map-click', 'route-drawing', 'mixed')),
  question_id text not null,
  question_type text not null check (question_type in ('knowledge', 'map-click', 'route-drawing')),
  answer jsonb,
  result jsonb,
  score integer,
  max_score integer,
  passed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scoring_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('mock-test', 'practice')),
  source_id uuid not null,
  score integer not null,
  max_score integer not null,
  percentage integer not null,
  passed boolean not null,
  breakdown jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_question_drafts (
  id uuid primary key default gen_random_uuid(),
  question_type text not null check (question_type in ('knowledge', 'map-click', 'route-drawing')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  draft_payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists question_banks_status_idx on public.question_banks(status);
create index if not exists questions_type_status_idx on public.questions(question_type, status);
create index if not exists questions_bank_status_idx on public.questions(bank_id, status);
create index if not exists questions_tags_idx on public.questions using gin(tags);
create index if not exists mock_attempts_user_status_idx on public.mock_test_attempts(user_id, status, created_at desc);
create index if not exists mock_answers_attempt_idx on public.mock_test_answers(attempt_id);
create index if not exists practice_attempts_user_idx on public.practice_attempts(user_id, created_at desc);
create index if not exists scoring_results_user_idx on public.scoring_results(user_id, created_at desc);
create index if not exists admin_question_drafts_creator_idx on public.admin_question_drafts(created_by, updated_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists question_banks_set_updated_at on public.question_banks;
create trigger question_banks_set_updated_at
before update on public.question_banks
for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists mock_attempts_set_updated_at on public.mock_test_attempts;
create trigger mock_attempts_set_updated_at
before update on public.mock_test_attempts
for each row execute function public.set_updated_at();

drop trigger if exists mock_answers_set_updated_at on public.mock_test_answers;
create trigger mock_answers_set_updated_at
before update on public.mock_test_answers
for each row execute function public.set_updated_at();

drop trigger if exists practice_attempts_set_updated_at on public.practice_attempts;
create trigger practice_attempts_set_updated_at
before update on public.practice_attempts
for each row execute function public.set_updated_at();

drop trigger if exists admin_question_drafts_set_updated_at on public.admin_question_drafts;
create trigger admin_question_drafts_set_updated_at
before update on public.admin_question_drafts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.question_banks enable row level security;
alter table public.questions enable row level security;
alter table public.mock_test_attempts enable row level security;
alter table public.mock_test_answers enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.scoring_results enable row level security;
alter table public.admin_question_drafts enable row level security;

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

drop policy if exists "active_question_banks_public_read" on public.question_banks;
create policy "active_question_banks_public_read"
on public.question_banks for select
using (status = 'active' or public.is_admin());

drop policy if exists "question_banks_admin_manage" on public.question_banks;
create policy "question_banks_admin_manage"
on public.question_banks for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_questions_public_read" on public.questions;
create policy "active_questions_public_read"
on public.questions for select
using (
  status = 'active'
  or public.is_admin()
);

drop policy if exists "questions_admin_manage" on public.questions;
create policy "questions_admin_manage"
on public.questions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "mock_attempts_own" on public.mock_test_attempts;
create policy "mock_attempts_own"
on public.mock_test_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "mock_attempts_admin_read" on public.mock_test_attempts;
create policy "mock_attempts_admin_read"
on public.mock_test_attempts for select
using (public.is_admin());

drop policy if exists "mock_answers_own" on public.mock_test_answers;
create policy "mock_answers_own"
on public.mock_test_answers for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "mock_answers_admin_read" on public.mock_test_answers;
create policy "mock_answers_admin_read"
on public.mock_test_answers for select
using (public.is_admin());

drop policy if exists "practice_attempts_own" on public.practice_attempts;
create policy "practice_attempts_own"
on public.practice_attempts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "practice_attempts_admin_read" on public.practice_attempts;
create policy "practice_attempts_admin_read"
on public.practice_attempts for select
using (public.is_admin());

drop policy if exists "scoring_results_own" on public.scoring_results;
create policy "scoring_results_own"
on public.scoring_results for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "scoring_results_owner_insert" on public.scoring_results;
create policy "scoring_results_owner_insert"
on public.scoring_results for insert
with check (user_id = auth.uid());

drop policy if exists "admin_question_drafts_admin_manage" on public.admin_question_drafts;
create policy "admin_question_drafts_admin_manage"
on public.admin_question_drafts for all
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;

grant select on public.question_banks to anon;
grant select on public.questions to anon;

grant select, insert, update, delete on public.question_banks to authenticated;
grant select, insert, update, delete on public.questions to authenticated;

grant select, insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.mock_test_attempts to authenticated;
grant select, insert, update, delete on public.mock_test_answers to authenticated;
grant select, insert, update, delete on public.practice_attempts to authenticated;
grant select, insert, update, delete on public.scoring_results to authenticated;
grant select, insert, update, delete on public.admin_question_drafts to authenticated;

-- Future hardening notes:
-- 1. Move admin detection to a stricter role-claims strategy before production.
-- 2. Add audit tables before enabling production admin publishing.
-- 3. Consider using service-role server actions for publishing reviewed drafts.
-- 4. Keep public reads limited to active questions and active question banks.
