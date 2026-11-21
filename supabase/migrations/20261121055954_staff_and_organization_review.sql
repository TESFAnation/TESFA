-- Apply only after tesfa_initial_schema, already present on the development project.
-- No client can grant itself staff access.
create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('reviewer', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;
create policy staff_members_read_self on public.staff_members
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.staff_members to authenticated;
revoke insert, update, delete on public.staff_members from anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 150),
  registration_reference text not null,
  note text not null,
  status text not null default 'pending'
    check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index organizations_owner on public.organizations(owner_id);
alter table public.organizations enable row level security;
create policy organizations_owner_read on public.organizations
  for select to authenticated using (owner_id = (select auth.uid()));
create policy organizations_owner_insert on public.organizations
  for insert to authenticated with check
  (owner_id = (select auth.uid()) and status = 'pending');
create policy organizations_staff_read on public.organizations
  for select to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
create policy organizations_staff_update on public.organizations
  for update to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))
  with check
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
grant select, insert (owner_id, name, registration_reference, note, status), update (status)
  on public.organizations to authenticated;

alter table public.campaigns
  add column raised_etb numeric(14,2) not null default 0
  check (raised_etb >= 0);
create index campaigns_status_created on public.campaigns(status, created_at desc);
create index campaigns_owner_created on public.campaigns(owner_id, created_at desc);
create index verification_documents_campaign on public.verification_documents(campaign_id);

create policy campaigns_staff_read on public.campaigns
  for select to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
create policy campaigns_staff_update on public.campaigns
  for update to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))
  with check
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));

create policy documents_staff_read on public.verification_documents
  for select to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));

create policy updates_staff_read on public.campaign_updates
  for select to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
create policy updates_staff_review on public.campaign_updates
  for update to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))
  with check
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
grant update (status) on public.campaign_updates to authenticated;

create policy reviews_staff_read on public.review_events
  for select to authenticated using
  (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
create policy reviews_staff_create on public.review_events
  for insert to authenticated with check (
    reviewer_id = (select auth.uid()) and
    exists (select 1 from public.staff_members s where s.user_id = (select auth.uid()))
  );
grant select, insert (campaign_id, reviewer_id, decision, notes)
  on public.review_events to authenticated;

-- Financial figures are never editable by ordinary authenticated clients.
revoke insert, update on public.campaigns from authenticated;
grant insert (owner_id, title, category, location, story, goal_etb, status)
  on public.campaigns to authenticated;
grant update (title, category, location, story, goal_etb, status)
  on public.campaigns to authenticated;

-- A submitted application must include meaningful text and demo evidence.
-- Evidence is metadata only; no live ID or document authentication is claimed.
create function public.tesfa_check_submission()
returns trigger language plpgsql security invoker
set search_path = ''
as $$
begin
  if new.status in ('submitted','approved')
    and (old.status is distinct from new.status) then
    if char_length(trim(new.story)) < 80 or nullif(trim(new.location), '') is null then
      raise exception 'Complete the campaign story and location before submitting';
    end if;
    if not exists (select 1 from public.verification_documents d where d.campaign_id = new.id) then
      raise exception 'A sample evidence record is required for review';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.tesfa_check_submission() from public, anon, authenticated;
create trigger tesfa_submission_guard
  before update of status on public.campaigns
  for each row execute function public.tesfa_check_submission();
