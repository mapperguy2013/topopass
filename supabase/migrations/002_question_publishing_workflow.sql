-- Phase 3 Stage 31: question publishing workflow.
-- Align question_bank_items with draft/published/archived statuses and
-- manage content through profile-backed admin access.

create or replace function public.has_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

grant execute on function public.has_admin_role() to anon, authenticated;

update public.question_bank_items
set
  status = 'published',
  published_at = coalesce(published_at, now())
where status = 'active';

alter table public.question_bank_items
drop constraint if exists question_bank_items_status_check;

alter table public.question_bank_items
add constraint question_bank_items_status_check
check (status in ('draft', 'published', 'archived'));

alter table public.question_bank_items
alter column status set default 'draft';

drop policy if exists "question_bank_items_active_read" on public.question_bank_items;
drop policy if exists "question_bank_items_published_read" on public.question_bank_items;
create policy "question_bank_items_published_read"
on public.question_bank_items for select
using (status = 'published' or public.has_admin_role());

drop policy if exists "question_bank_items_admin_manage" on public.question_bank_items;
create policy "question_bank_items_admin_manage"
on public.question_bank_items for all
using (public.has_admin_role())
with check (public.has_admin_role());
