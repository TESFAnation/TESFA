-- Applied to the connected TESFA Project on November 21, 2026
-- following the owner's approval of the release.

-- Review feedback belongs to the organizer. Never put internal-only findings,
-- confidential third-party information, or identity documents in these notes.
create policy reviews_campaign_owner_read on public.review_events
  for select to authenticated using (
    exists (select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid()))
  );

-- An applicant can correct an existing organization application only after
-- staff have explicitly requested more information.
create policy organizations_owner_resubmit on public.organizations
  for update to authenticated
  using (owner_id = (select auth.uid()) and status = 'needs_info')
  with check (owner_id = (select auth.uid()) and status = 'pending');
grant update (name, registration_reference, note) on public.organizations to authenticated;

create table public.organization_review_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved', 'needs_info', 'rejected')),
  notes text not null check (char_length(trim(notes)) between 12 and 2000),
  created_at timestamptz not null default now()
);
create index organization_review_events_org_created
  on public.organization_review_events(organization_id, created_at desc);
alter table public.organization_review_events enable row level security;

create policy organization_reviews_owner_read on public.organization_review_events
  for select to authenticated using (
    exists (select 1 from public.organizations o
      where o.id = organization_id and o.owner_id = (select auth.uid()))
  );
create policy organization_reviews_staff_read on public.organization_review_events
  for select to authenticated using (
    exists (select 1 from public.staff_members s where s.user_id = (select auth.uid()))
  );
create policy organization_reviews_staff_insert on public.organization_review_events
  for insert to authenticated with check (
    reviewer_id = (select auth.uid())
    and exists (select 1 from public.staff_members s where s.user_id = (select auth.uid()))
  );
grant select, insert (organization_id, reviewer_id, decision, notes)
  on public.organization_review_events to authenticated;

-- Status and written feedback are committed together or not at all.
create function public.tesfa_review_organization(
  p_organization_id uuid, p_decision text, p_notes text
) returns void language plpgsql security invoker
set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.staff_members s where s.user_id = (select auth.uid())
  ) then
    raise exception 'TESFA reviewer access required';
  end if;
  if p_decision not in ('approved', 'needs_info', 'rejected') then
    raise exception 'Invalid organization review decision';
  end if;
  if char_length(trim(coalesce(p_notes, ''))) < 12
    or char_length(trim(coalesce(p_notes, ''))) > 2000 then
    raise exception 'Write 12 to 2000 characters of feedback for the applicant';
  end if;

  update public.organizations
    set status = p_decision
    where id = p_organization_id and status = 'pending';
  if not found then
    raise exception 'This organization application is not awaiting review';
  end if;

  insert into public.organization_review_events (
    organization_id, reviewer_id, decision, notes
  ) values (
    p_organization_id, (select auth.uid()), p_decision, trim(p_notes)
  );
end;
$$;
revoke all on function public.tesfa_review_organization(uuid, text, text) from public, anon;
grant execute on function public.tesfa_review_organization(uuid, text, text) to authenticated;
