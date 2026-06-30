create table if not exists public.route_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  exercise_id text not null,
  map_id text,
  map_version text,
  exercise_version text,
  score numeric(7, 2),
  passed boolean,
  is_legal boolean,
  failure_reason text,
  user_distance_m numeric(12, 2),
  shortest_distance_m numeric(12, 2),
  extra_distance_m numeric(12, 2),
  violations jsonb not null default '[]'::jsonb,
  missed_restrictions jsonb not null default '[]'::jsonb,
  correction_hints jsonb not null default '[]'::jsonb,
  practice_recommendations jsonb not null default '[]'::jsonb,
  matched_route jsonb,
  per_leg_breakdown jsonb not null default '[]'::jsonb,
  review_payload jsonb not null,
  review_schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  constraint route_attempts_exercise_id_length check (
    char_length(exercise_id) between 1 and 160
  ),
  constraint route_attempts_schema_version_positive check (
    review_schema_version > 0
  )
);

alter table public.route_attempts
  add column if not exists map_id text,
  add column if not exists map_version text,
  add column if not exists exercise_version text,
  add column if not exists is_legal boolean,
  add column if not exists per_leg_breakdown jsonb not null default '[]'::jsonb;

create index if not exists route_attempts_user_created_idx
  on public.route_attempts(user_id, created_at desc);

create index if not exists route_attempts_exercise_created_idx
  on public.route_attempts(exercise_id, created_at desc);

create index if not exists route_attempts_map_created_idx
  on public.route_attempts(map_id, created_at desc);

alter table public.route_attempts enable row level security;

drop policy if exists "route_attempts_insert_dev_or_own" on public.route_attempts;
create policy "route_attempts_insert_dev_or_own"
  on public.route_attempts for insert
  to anon, authenticated
  with check (
    user_id is null
    or user_id = auth.uid()
  );

drop policy if exists "route_attempts_select_own_or_admin" on public.route_attempts;
create policy "route_attempts_select_own_or_admin"
  on public.route_attempts for select
  to anon, authenticated
  using (
    user_id is null
    or user_id = auth.uid()
    or public.has_admin_role()
  );

grant select, insert on public.route_attempts to anon;
grant select, insert on public.route_attempts to authenticated;
