-- =====================================================================
-- STEP 1 (backend design): admin role, moderation & security
-- =====================================================================
-- Run AFTER:
--   20261110000000_step3_supabase.sql       (properties, private details, bucket)
--   20261112000000_property_moderation.sql  (admin_status, admin_users)
--
-- STATUS: DESIGN ONLY. Cline has not executed this. Paste it into
-- Supabase Studio > SQL Editor when you approve the plan.
--
-- Model
--   * profiles.is_admin is the SINGLE source of truth for the admin role.
--   * No app role (anon / authenticated) can write is_admin:
--       - column privileges omit it      -> 42501 before RLS runs
--       - no INSERT/UPDATE policy grants it to non-admins
--       - a guard trigger raises on any change made outside the dashboard
--   * Buyers read admin_status = 'approved' rows only (RLS, in addition to the
--     .eq('admin_status','approved') the app already sends).
--   * New listings are pending by DEFAULT; a seller can never insert/update a
--     row to 'approved'. Only is_admin() may change admin_status.
--   * Admins read / moderate / delete every listing.
--   * public.is_admin() is the only sanctioned admin predicate:
--     security definer + pinned search_path (no recursion, no shadowing).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. PROFILES  (one row per auth user)
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text        not null default '',
  full_name   text        not null default '',
  phone       text        not null default '',
  -- Admin role flag. DEFAULT false. Dashboard-only: no app role holds
  -- INSERT/UPDATE privilege on this column (see section 2).
  is_admin    boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_phone_format
    check (phone = '' or phone ~ '^(08|628)[0-9]{8,12}$')
);

comment on table  public.profiles is 'App profile per auth user: buyer/seller metadata.';
comment on column public.profiles.is_admin is
  'Admin role flag. Dashboard-only: no app role holds INSERT/UPDATE privilege on this column.';

alter table public.profiles enable row level security;

-- Shared updated_at helper, reused by other tables later.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create the profile on signup, keep email in sync on later changes.
-- security definer is required: this runs from the auth.users trigger as
-- supabase_auth_admin, not as the end user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email      = excluded.email,
        updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. ADMIN PREDICATE + PROFILES SECURITY
-- ---------------------------------------------------------------------

-- The one sanctioned "is this request an admin?" predicate used by every
-- admin policy. security definer + pinned search_path:
--   * avoids recursion through the profiles SELECT policies,
--   * auth.uid() is null for anon -> exists(...) is false -> no leak.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Profile rows are created by the auth trigger, never by the client, so no
-- INSERT policy exists for anyone. Reads: owner or admin.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Users may edit their own full_name / phone (the only grantable columns).
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- COLUMN PRIVILEGES: this is what makes is_admin unwritable from the app.
-- PostgREST hits Postgres directly; a column the role lacks privilege on is
-- rejected (42501) before RLS or a trigger is even consulted.
-- (Applied below; see "revoke all on table public.profiles".)

-- Guard trigger: belt-and-braces on top of the column privileges. Even if a
-- future grant exposes the column, a request made by the app roles cannot
-- flip is_admin.
create or replace function public.protect_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and current_user in ('anon', 'authenticated') then
    raise exception 'profiles.is_admin hanya dapat diubah dari Supabase dashboard.'
      using errcode = '42501';  -- insufficient_privilege
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_profile_admin_flag();

-- The moderation queue must always have someone able to empty it, so the LAST
-- admin can never be demoted or deleted - not even from the dashboard.
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  if (tg_op = 'DELETE' and old.is_admin)
     or (tg_op = 'UPDATE' and old.is_admin and not new.is_admin) then

    select count(*) into remaining
      from public.profiles p
     where p.is_admin
       and (tg_op = 'DELETE' or p.id <> old.id);

    if remaining = 0 then
      raise exception 'Tidak dapat menghapus admin terakhir. Angkat admin baru terlebih dahulu.'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_last_admin on public.profiles;
create trigger profiles_protect_last_admin
  before update or delete on public.profiles
  for each row execute function public.protect_last_admin();

-- All app roles lose table-wide privileges; the column grants below are the
-- only writable surface, and is_admin is not among them.
revoke all on table public.profiles from anon, authenticated;

grant select (id, email, full_name, phone, is_admin, created_at, updated_at)
  on public.profiles to authenticated;

grant update (full_name, phone)
  on public.profiles to authenticated;

drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. PROPERTIES: moderation defaults + server-side validation
-- ---------------------------------------------------------------------

-- New listings start pending. Default and policy agree on purpose.
alter table public.properties
  alter column admin_status set default 'pending';
alter table public.properties
  alter column admin_status set not null;

-- WhatsApp: Indonesian mobile, 10-13 digits, "08..." or "628..." form (Q3).
alter table public.properties
  drop constraint if exists properties_whatsapp_format;
alter table public.properties
  add constraint properties_whatsapp_format
  check (whatsapp ~ '^(08|628)[0-9]{8,12}$') not valid;

-- Photos: 1-8 per listing, never null.
alter table public.properties
  alter column photos set not null,
  alter column photos set default '{}';

alter table public.properties
  drop constraint if exists properties_photos_max;
alter table public.properties
  add constraint properties_photos_max
  check (cardinality(photos) between 1 and 8) not valid;

-- Photos: only JPG / PNG / WebP.
-- A URL's bytes cannot be inspected from SQL, so this validates the path
-- extension. The 5 MB per-file limit is enforced by
-- The 5 MB per-file limit is enforced by
--   * the client (PhotoUploader: file.size <= 5 * 1024 * 1024) and
--   * the storage bucket (property-photos.file_size_limit = 5242880).
-- NOTE: Postgres forbids SELECT inside a CHECK, so this is a trigger.
-- Do not convert it back to a check constraint.
create or replace function public.validate_photos_extension()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from unnest(new.photos) as p(url)
    where lower(p.url) !~ '\.(jpe?g|png|webp)(\?.*)?$'
  ) then
    raise exception 'Foto harus JPG, PNG, atau WebP'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists properties_validate_photos_extension on public.properties;
create trigger properties_validate_photos_extension
  before insert or update on public.properties
  for each row execute function public.validate_photos_extension();

-- PRD FR4 limits, previously client-only.
alter table public.properties
  drop constraint if exists properties_title_length;
alter table public.properties
  add constraint properties_title_length
  check (char_length(btrim(title)) between 10 and 120) not valid;

alter table public.properties
  drop constraint if exists properties_description_length;
alter table public.properties
  add constraint properties_description_length
  check (char_length(btrim(description)) >= 100) not valid;

alter table public.properties
  drop constraint if exists properties_price_range;
alter table public.properties
  add constraint properties_price_range
  check (price > 0 and price <= 1000000000000) not valid;

-- ---------------------------------------------------------------------
-- 4. PROPERTIES: RLS policies (buyer visibility + seller ownership)
-- ---------------------------------------------------------------------
-- Drop the step-3 / moderation policies. Note: "Sellers can update their own
-- properties" from step 3 had no admin_status guard - a seller could approve
-- his own listing, which is exactly the hole this step closes.
drop policy if exists "Properties are publicly readable"          on public.properties;
drop policy if exists "Approved properties are publicly readable" on public.properties;
drop policy if exists "Sellers can read their own properties"      on public.properties;
drop policy if exists "Sellers can insert their own properties"    on public.properties;
drop policy if exists "Sellers can update their own properties"    on public.properties;
drop policy if exists "Sellers can delete their own properties"    on public.properties;
drop policy if exists "Admins can moderate properties"             on public.properties;

-- SELECT: buyers see approved listings only.
create policy "Buyers read approved listings"
  on public.properties for select
  to anon, authenticated
  using (admin_status = 'approved');

-- SELECT: a seller also sees his own pending / rejected drafts.
create policy "Sellers read their own listings"
  on public.properties for select
  to authenticated
  using (auth.uid() = seller_id);

-- SELECT: admins see everything.
create policy "Admins read all listings"
  on public.properties for select
  to authenticated
  using (public.is_admin());

-- INSERT: a signed-in user may publish as himself, always as pending.
-- Approving on insert (admin_status = 'approved') fails this WITH CHECK.
create policy "Sellers insert their own pending listings"
  on public.properties for insert
  to authenticated
  with check (auth.uid() = seller_id and admin_status = 'pending');

-- UPDATE (seller): own row, while the row is still pending, and it stays
-- pending. Editing cannot promote a listing to approved.
create policy "Sellers update their own pending listings"
  on public.properties for update
  to authenticated
  using (auth.uid() = seller_id and admin_status = 'pending')
  with check (auth.uid() = seller_id and admin_status = 'pending');

-- UPDATE (admin): any row, for both USING and WITH CHECK.
create policy "Admins update all listings"
  on public.properties for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE (owner): own listing.
drop policy if exists "Sellers delete their own listings" on public.properties;
create policy "Sellers delete their own listings"
  on public.properties for delete
  to authenticated
  using (auth.uid() = seller_id);

-- DELETE (admin): any listing. Placed here (before section 5) so the
-- stamp_admin_review trigger is the last thing on the table in this migration.
drop policy if exists "Admins delete any listing" on public.properties;
create policy "Admins delete any listing"
  on public.properties for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. PROPERTIES: admin_status write guard
-- ---------------------------------------------------------------------
-- RLS WITH CHECK already pins the seller's UPDATE to pending -> pending. This
-- trigger adds the missing half (a row can never become 'approved' / 'rejected'
-- except by is_admin()) and makes the intent explicit at the table level, so a
-- future permissive policy cannot silently reopen self-approval.
create or replace function public.guard_admin_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.admin_status is distinct from old.admin_status
     and not public.is_admin() then
    raise exception 'Status moderasi hanya dapat diubah oleh admin.'
      using errcode = '42501';
  end if;

  if new.admin_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Status moderasi tidak valid: %', new.admin_status
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists properties_guard_admin_status on public.properties;
create trigger properties_guard_admin_status
  before update on public.properties
  for each row execute function public.guard_admin_status();

-- Review trail: who moderated, when, and why (note is shown to the seller).
alter table public.properties
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text not null default '';

create or replace function public.stamp_admin_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.admin_status is distinct from old.admin_status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists properties_stamp_admin_review on public.properties;
create trigger properties_stamp_admin_review
  before update on public.properties
  for each row execute function public.stamp_admin_review();

-- ---------------------------------------------------------------------
-- 6. FAVORITES  (buyer hearts, moved out of localStorage; login required, Q5)
-- ---------------------------------------------------------------------
-- One row per (signed-in buyer, listing). The foreign key to auth.users gives
-- the hard "require login": anon is simply not a grantee on INSERT/DELETE. No
-- anonymous fallback here - when not signed in, the heart asks the buyer to log
-- in instead of silently saving to this browser.

create table if not exists public.favorites (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid        not null references public.properties (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint favorites_user_property_key unique (user_id, property_id)
);

comment on table public.favorites is 'Saved listings (heart) per signed-in user.';

alter table public.favorites enable row level security;

create index if not exists favorites_property_id_idx on public.favorites (property_id);

-- Buyer manages his own hearts. There is deliberately no anon policy: saving a
-- favorite requires a session (Q5). And no admin write policy: admins may read
-- (analytics / support) but never create hearts for someone else.
drop policy if exists "Users read their own favorites"   on public.favorites;
create policy "Users read their own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins read all favorites" on public.favorites;
create policy "Admins read all favorites"
  on public.favorites for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Users add their own favorites"   on public.favorites;
create policy "Users add their own favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users remove their own favorites" on public.favorites;
create policy "Users remove their own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 7. REPORTS  (a buyer flags a suspicious listing for the admin)
-- ---------------------------------------------------------------------

create table if not exists public.reports (
  id             uuid        primary key default gen_random_uuid(),
  property_id    uuid        not null references public.properties (id) on delete cascade,
  -- Signed-in only (Q4). Signed-in reporter; no guest reports.
  reporter_id    uuid        not null default auth.uid()
                   references auth.users (id) on delete cascade,
  reporter_email text        not null default '',
  reason         text        not null check (
                   reason in ('spam', 'foto_meniru', 'data_palsu',
                              'sudah_terjual', 'tidak_sesuai_iklan', 'lainnya')
                 ),
  reason_note    text        not null default '',
  -- Admin triage.
  status         text        not null default 'baru'
                   check (status in ('baru', 'diterima', 'ditolak')),
  reviewed_by    uuid        references auth.users (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

comment on table public.reports is 'Buyer reports flagging a listing for admin review.';

alter table public.reports enable row level security;

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_property_id_idx    on public.reports (property_id);

-- Duplicate guard: a signed-in reporter can flag the same listing for the same
-- reason only once. reporter_id is NOT NULL now, so no coalesce placeholder.
create unique index if not exists reports_unique_report_idx
  on public.reports (property_id, reporter_id, reason);

-- INSERT: signed-in users only (Q4). A guest report would be anonymous and hard
-- to rate-limit, so anon is deliberately NOT a grantee. The reporter can only
-- report as himself.
drop policy if exists "Anyone can report a listing" on public.reports;
drop policy if exists "Signed-in users can report a listing" on public.reports;
create policy "Signed-in users can report a listing"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "Reporters read their own reports" on public.reports;
create policy "Reporters read their own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "Admins read all reports" on public.reports;
create policy "Admins read all reports"
  on public.reports for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins triage reports" on public.reports;
create policy "Admins triage reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete reports" on public.reports;
create policy "Admins delete reports"
  on public.reports for delete
  to authenticated
  using (public.is_admin());



-- ---------------------------------------------------------------------
-- 8. STORAGE: keep the photo bucket in the documented shape
-- ---------------------------------------------------------------------
-- The bucket is created by the step-3 migration. Re-assert the limits here so
-- they cannot drift. 5 MB per-file and the type allow-list live at the bucket,
-- because a JSON column cannot carry file bytes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 9. CLEAN-UP: retired objects from earlier steps
-- ---------------------------------------------------------------------

-- Left over from 20261112000000_property_moderation.sql; replaced by
-- profiles.is_admin. Drop only if you agreed in review (see design doc).
drop table if exists public.admin_users;

-- ---------------------------------------------------------------------
-- 10. PROPERTIES: review metadata protection
-- ---------------------------------------------------------------------
-- A seller must not be able to stamp himself as "reviewed by me, note: OK".
-- The review trail is written only by the guards above (which run as the
-- requester) or by an admin, so any non-admin change is rejected.
create or replace function public.protect_review_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin() and (
       new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.review_note is distinct from old.review_note
  ) then
    raise exception 'Catatan moderasi hanya dapat diubah oleh admin.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists properties_protect_review_metadata on public.properties;
create trigger properties_protect_review_metadata
  before update on public.properties
  for each row execute function public.protect_review_metadata();

-- ---------------------------------------------------------------------
-- 11. INDEXES
-- ---------------------------------------------------------------------

create index if not exists properties_seller_status_idx
  on public.properties (seller_id, admin_status);

create index if not exists properties_approved_created_idx
  on public.properties (created_at desc)
  where admin_status = 'approved';

commit;
