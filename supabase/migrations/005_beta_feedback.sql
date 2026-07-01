create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  payload jsonb not null,
  map_id text not null,
  exercise_id text not null,
  rating integer not null,
  feedback_type text not null,
  constraint beta_feedback_rating_range check (rating between 1 and 5),
  constraint beta_feedback_map_id_length check (
    char_length(map_id) between 1 and 160
  ),
  constraint beta_feedback_exercise_id_length check (
    char_length(exercise_id) between 1 and 180
  ),
  constraint beta_feedback_type_length check (
    char_length(feedback_type) between 1 and 80
  )
);

create index if not exists beta_feedback_created_idx
  on public.beta_feedback(created_at desc);

create index if not exists beta_feedback_map_created_idx
  on public.beta_feedback(map_id, created_at desc);

create index if not exists beta_feedback_exercise_created_idx
  on public.beta_feedback(exercise_id, created_at desc);

alter table public.beta_feedback enable row level security;

revoke all on public.beta_feedback from anon;
revoke all on public.beta_feedback from authenticated;
