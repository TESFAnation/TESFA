-- Only approved organizations can submit fundraising applications.
-- Keep drafts available to their owners while organization review is pending.
create unique index if not exists organizations_one_active_per_owner
  on public.organizations(owner_id)
  where status in ('pending', 'approved');

create index if not exists saved_campaigns_campaign_id_idx
  on public.saved_campaigns(campaign_id);

create or replace function public.tesfa_check_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status in ('submitted', 'approved')
    and old.status is distinct from new.status then
    if not exists (
      select 1 from public.organizations o
      where o.owner_id = new.owner_id and o.status = 'approved'
    ) then
      raise exception 'An approved organization is required before submitting a campaign';
    end if;
    if char_length(trim(new.story)) < 80 or nullif(trim(new.location), '') is null
      or char_length(trim(coalesce(new.organizer_name, ''))) < 3
      or char_length(trim(coalesce(new.spending_plan, ''))) < 25 then
      raise exception 'Complete the organizer, campaign story, spending plan, and location';
    end if;
    if not exists (
      select 1 from public.verification_documents d where d.campaign_id = new.id
    ) then
      raise exception 'Upload supporting evidence before submitting';
    end if;
    if not exists (
      select 1 from public.campaign_media m where m.campaign_id = new.id
    ) then
      raise exception 'Add at least one campaign photo before submitting';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.tesfa_check_submission() from public, anon, authenticated;

-- Reviewer status changes and audit notes succeed or fail in one transaction.
-- SECURITY INVOKER preserves the existing staff-only RLS policies.
create function public.tesfa_review_campaign(
  p_campaign_id uuid, p_decision text, p_notes text
) returns void language plpgsql security invoker
set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.staff_members s where s.user_id = (select auth.uid())
  ) then
    raise exception 'TESFA reviewer access required';
  end if;
  if p_decision not in ('approved', 'needs_info', 'rejected') then
    raise exception 'Invalid review decision';
  end if;
  if p_decision <> 'approved' and char_length(trim(coalesce(p_notes, ''))) < 8 then
    raise exception 'Give the organizer a clear reason for this decision';
  end if;

  update public.campaigns
    set status = p_decision, updated_at = now()
    where id = p_campaign_id and status = 'submitted';
  if not found then
    raise exception 'This campaign is not awaiting review';
  end if;

  insert into public.review_events (
    campaign_id, reviewer_id, decision, notes
  ) values (
    p_campaign_id, (select auth.uid()), p_decision,
    nullif(trim(coalesce(p_notes, '')), '')
  );
end;
$$;
revoke all on function public.tesfa_review_campaign(uuid, text, text) from public, anon;
grant execute on function public.tesfa_review_campaign(uuid, text, text) to authenticated;
