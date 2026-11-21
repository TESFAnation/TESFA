-- TESFA v1.1. Public campaigns are real approved submissions only.
-- The fundraising balance remains read-only until a licensed payment integration exists.

alter table public.campaigns
  add column organizer_name text,
  add column spending_plan text;

grant insert (organizer_name, spending_plan), update (organizer_name, spending_plan)
  on public.campaigns to authenticated;

create table public.campaign_media (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  uploader_id uuid not null references auth.users(id),
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 140),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);
create index campaign_media_campaign_order on public.campaign_media(campaign_id, display_order, created_at);
alter table public.campaign_media enable row level security;
create policy campaign_media_read on public.campaign_media for select to anon, authenticated
  using (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'approved')
    or uploader_id = (select auth.uid())
    or exists (select 1 from public.staff_members s where s.user_id = (select auth.uid()))
  );
create policy campaign_media_insert on public.campaign_media for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and exists (select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );
create policy campaign_media_delete on public.campaign_media for delete to authenticated
  using (
    uploader_id = (select auth.uid())
    and exists (select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );
grant select on public.campaign_media to anon;
grant select, insert, delete on public.campaign_media to authenticated;

create table public.saved_campaigns (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);
alter table public.saved_campaigns enable row level security;
create policy saved_campaigns_read on public.saved_campaigns for select to authenticated
  using (user_id = (select auth.uid()));
create policy saved_campaigns_insert on public.saved_campaigns for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'approved')
  );
create policy saved_campaigns_delete on public.saved_campaigns for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, delete on public.saved_campaigns to authenticated;

create table public.campaign_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('misleading', 'privacy', 'spam', 'other')),
  details text not null default '' check (char_length(details) <= 800),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (campaign_id, reporter_id)
);
create index campaign_reports_status_created on public.campaign_reports(status, created_at desc);
create index campaign_reports_reporter on public.campaign_reports(reporter_id);
alter table public.campaign_reports enable row level security;
create policy reports_submit on public.campaign_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'approved')
  );
create policy reports_read_own on public.campaign_reports for select to authenticated
  using (reporter_id = (select auth.uid()));
create policy reports_read_staff on public.campaign_reports for select to authenticated
  using (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
create policy reports_update_staff on public.campaign_reports for update to authenticated
  using (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())));
grant select, insert (campaign_id, reporter_id, reason, details, status), update (status)
  on public.campaign_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('tesfa-campaign-photos', 'tesfa-campaign-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('tesfa-private-evidence', 'tesfa-private-evidence', false, 8388608, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

-- Keys have ownerId/campaignId/randomFileName so Storage can check ownership.
create policy tesfa_photos_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tesfa-campaign-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.campaigns c
      where c.id::text = split_part(name, '/', 2) and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );
create policy tesfa_photos_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'tesfa-campaign-photos' and split_part(name, '/', 1) = (select auth.uid())::text);
create policy tesfa_photos_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'tesfa-campaign-photos' and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.campaigns c
      where c.id::text = split_part(name, '/', 2) and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );

create policy tesfa_evidence_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tesfa-private-evidence'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.campaigns c
      where c.id::text = split_part(name, '/', 2) and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );
create policy tesfa_evidence_read on storage.objects for select to authenticated
  using (
    bucket_id = 'tesfa-private-evidence'
    and (split_part(name, '/', 1) = (select auth.uid())::text
      or exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))
  );
create policy tesfa_evidence_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'tesfa-private-evidence' and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public.campaigns c
      where c.id::text = split_part(name, '/', 2) and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );

-- Do not accept invented metadata paths. A record must refer to an uploaded file.
create function public.tesfa_uploaded_file_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare target_bucket text;
begin
  if tg_table_name = 'campaign_media' then
    target_bucket := 'tesfa-campaign-photos';
  else
    target_bucket := 'tesfa-private-evidence';
  end if;
  if not exists (select 1 from storage.objects o
    where o.bucket_id = target_bucket and o.name = new.storage_path) then
    raise exception 'Upload the file before saving its record';
  end if;
  return new;
end;
$$;
revoke execute on function public.tesfa_uploaded_file_guard() from public, anon, authenticated;
create trigger tesfa_campaign_media_file_guard before insert on public.campaign_media
  for each row execute function public.tesfa_uploaded_file_guard();
create trigger tesfa_evidence_file_guard before insert on public.verification_documents
  for each row execute function public.tesfa_uploaded_file_guard();

-- A submitted campaign must have both a photo and an actual evidence object.
create or replace function public.tesfa_check_submission() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.status in ('submitted', 'approved')
    and old.status is distinct from new.status then
    if char_length(trim(new.story)) < 80 or nullif(trim(new.location), '') is null
      or char_length(trim(coalesce(new.organizer_name, ''))) < 3
      or char_length(trim(coalesce(new.spending_plan, ''))) < 25 then
      raise exception 'Complete the organizer, campaign story, spending plan, and location';
    end if;
    if not exists (select 1 from public.verification_documents d where d.campaign_id = new.id) then
      raise exception 'Upload supporting evidence before submitting';
    end if;
    if not exists (select 1 from public.campaign_media m where m.campaign_id = new.id) then
      raise exception 'Add at least one campaign photo before submitting';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.tesfa_check_submission() from public, anon, authenticated;

-- Organizers can add progress reports only to approved campaigns.
drop policy updates_read on public.campaign_updates;
create policy updates_read on public.campaign_updates for select to anon, authenticated
  using (
    author_id = (select auth.uid())
    or (status = 'approved' and exists
      (select 1 from public.campaigns c where c.id = campaign_id and c.status = 'approved'))
  );
drop policy updates_create on public.campaign_updates;
create policy updates_create on public.campaign_updates for insert to authenticated
  with check (
    author_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid()) and c.status = 'approved')
  );

create policy documents_owner_delete on public.verification_documents for delete to authenticated
  using (
    uploader_id = (select auth.uid())
    and exists (select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info'))
  );
grant delete on public.verification_documents to authenticated;

create index campaign_media_uploader on public.campaign_media(uploader_id);
create index campaign_updates_campaign on public.campaign_updates(campaign_id);
create index campaign_updates_author on public.campaign_updates(author_id);
create index verification_documents_uploader on public.verification_documents(uploader_id);
create index review_events_campaign on public.review_events(campaign_id);
create index review_events_reviewer on public.review_events(reviewer_id);
