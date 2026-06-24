create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'footer',
  consent_text text not null,
  consent_version text not null default '2026-beta',
  created_at timestamptz not null default now(),
  constraint newsletter_signups_email_format check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint newsletter_signups_source_length check (
    char_length(source) between 1 and 80
  )
);

create unique index if not exists newsletter_signups_email_lower_idx
  on public.newsletter_signups (lower(email));

alter table public.newsletter_signups enable row level security;

drop policy if exists "newsletter_signups_public_insert" on public.newsletter_signups;
create policy "newsletter_signups_public_insert"
  on public.newsletter_signups for insert
  to anon, authenticated
  with check (
    email is not null
    and consent_text is not null
    and consent_version = '2026-beta'
  );
