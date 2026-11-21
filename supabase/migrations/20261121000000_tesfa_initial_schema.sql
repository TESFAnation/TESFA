-- Reproducible baseline for a new Supabase project.
-- The connected TESFA development database already has this schema.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  account_type text not null default 'individual'
    check (account_type in ('individual', 'organization')),
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null check (char_length(title) between 8 and 140),
  category text not null check (category in ('medical', 'education', 'emergency')),
  location text,
  story text not null,
  goal_etb numeric not null check (goal_etb > 0),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'needs_info', 'approved', 'rejected', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  uploader_id uuid not null references auth.users(id),
  storage_path text not null,
  document_type text not null,
  created_at timestamptz not null default now()
);

create table public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.verification_documents enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.review_events enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy campaigns_read on public.campaigns for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()));
create policy campaigns_create on public.campaigns for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'draft');
create policy campaigns_edit on public.campaigns for update to authenticated
  using (owner_id = (select auth.uid()) and status in ('draft', 'needs_info'))
  with check (owner_id = (select auth.uid()) and status in ('draft', 'submitted'));

create policy documents_read on public.verification_documents for select to authenticated
  using (uploader_id = (select auth.uid()));
create policy documents_create on public.verification_documents for insert to authenticated
  with check (
    uploader_id = (select auth.uid()) and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid())
        and c.status in ('draft', 'needs_info')
    )
  );

create policy updates_read on public.campaign_updates for select to anon, authenticated
  using (status = 'approved' or author_id = (select auth.uid()));
create policy updates_create on public.campaign_updates for insert to authenticated
  with check (
    author_id = (select auth.uid()) and status = 'pending' and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.owner_id = (select auth.uid())
    )
  );

grant select on public.campaigns, public.campaign_updates to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.campaigns to authenticated;
grant select, insert on public.verification_documents, public.campaign_updates to authenticated;
-- Review events remain inaccessible until the staff policy in the next migration.
