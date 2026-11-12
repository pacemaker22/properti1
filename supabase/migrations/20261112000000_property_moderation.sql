-- Listing moderation: a listing only shows up on the buyer pages once an admin
-- approves it. Sellers insert `pending`; only the admin panel may approve.
-- Run in Supabase Studio > SQL Editor after the step 3 migration.

-- Add the column first (no default) so no visibility is changed yet, then
-- backfill, then enforce NOT NULL + DEFAULT 'pending' in one step. Existing rows
-- are marked approved because they were seeded before moderation existed.
alter table public.properties
  add column if not exists admin_status text;

update public.properties
  set admin_status = 'pending'
  where admin_status is null
    and created_at >= now() - interval '1 day';

update public.properties
  set admin_status = 'approved'
  where admin_status is null;

alter table public.properties
  alter column admin_status set default 'pending';

alter table public.properties
  alter column admin_status set not null;

alter table public.properties
  drop constraint if exists properties_admin_status_check;

alter table public.properties
  add constraint properties_admin_status_check
  check (admin_status in ('pending', 'approved', 'rejected'));

-- Remove the "everything is readable" policy from step 3 and replace it with a
-- moderation-aware one.
drop policy if exists "Properties are publicly readable" on public.properties;

drop policy if exists "Approved properties are publicly readable" on public.properties;
create policy "Approved properties are publicly readable"
  on public.properties for select
  to anon, authenticated
  using (admin_status = 'approved');

drop policy if exists "Sellers can read their own properties" on public.properties;
create policy "Sellers can read their own properties"
  on public.properties for select
  to authenticated
  using (auth.uid() = seller_id);

-- A seller may always create a listing, but never approve it themselves.
drop policy if exists "Sellers can insert their own properties" on public.properties;
create policy "Sellers can insert their own properties"
  on public.properties for insert
  to authenticated
  with check (auth.uid() = seller_id and admin_status = 'pending');

drop policy if exists "Sellers can update their own properties" on public.properties;
create policy "Sellers can update their own properties"
  on public.properties for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Admin panel is not built yet: admins are flagged in a separate table so the
-- moderation policy can be added later without touching seller policies.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "Admins can moderate properties" on public.properties;
create policy "Admins can moderate properties"
  on public.properties for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists properties_admin_status_idx
  on public.properties (admin_status, created_at desc);
