-- Step 3: Supabase database, storage, and row-level security.
-- Run this file in Supabase Studio > SQL Editor, then run supabase/seed.sql.

create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price bigint not null check (price >= 0),
  type text not null check (type in ('rumah', 'apartemen', 'tanah', 'ruko', 'kost', 'villa', 'lainnya')),
  status text not null default 'dijual' check (status in ('dijual', 'disewa', 'terjual')),
  city text not null,
  district text not null,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  land_area integer not null default 0 check (land_area >= 0),
  building_area integer not null default 0 check (building_area >= 0),
  certificate text not null default '',
  description text not null,
  photos text[] not null default '{}',
  agent_name text not null,
  whatsapp text not null,
  is_sold boolean not null default false,
  created_at timestamptz not null default now(),
  is_featured boolean not null default false,

  -- Existing UI fields from PRD FR3/FR4 and seller ownership.
  seller_id uuid references auth.users(id) on delete set null,
  floors integer not null default 0 check (floors >= 0),
  parking integer not null default 0 check (parking >= 0),
  year_built integer not null default 0 check (year_built >= 0),
  furnished boolean not null default false,
  electricity integer not null default 0 check (electricity >= 0),
  agent_photo text not null default '',
  view_count integer not null default 0 check (view_count >= 0)
);

comment on table public.properties is 'Public property listings for properti1.com';

alter table public.properties enable row level security;

drop policy if exists "Properties are publicly readable" on public.properties;
create policy "Properties are publicly readable"
  on public.properties for select
  to anon, authenticated
  using (true);

drop policy if exists "Sellers can insert their own properties" on public.properties;
create policy "Sellers can insert their own properties"
  on public.properties for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their own properties" on public.properties;
create policy "Sellers can update their own properties"
  on public.properties for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete their own properties" on public.properties;
create policy "Sellers can delete their own properties"
  on public.properties for delete
  to authenticated
  using (auth.uid() = seller_id);

-- Sellers must also be able to read their own listings again after signing in.
-- Without this, editing an existing listing fails: PostgREST returns the updated
-- row (UPDATE ... RETURNING) and the public read policy alone does not satisfy it.
drop policy if exists "Sellers can read their own properties" on public.properties;
create policy "Sellers can read their own properties"
  on public.properties for select
  to authenticated
  using (auth.uid() = seller_id);

create index if not exists properties_created_at_idx on public.properties (created_at desc);
create index if not exists properties_seller_id_idx on public.properties (seller_id);
create index if not exists properties_city_type_status_idx on public.properties (city, type, status);

-- The full address is private and must never be part of the public property feed.
create table if not exists public.property_private_details (
  property_id uuid primary key references public.properties(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  private_address text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.property_private_details enable row level security;

drop policy if exists "Sellers can read their own private details" on public.property_private_details;
create policy "Sellers can read their own private details"
  on public.property_private_details for select
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists "Sellers can insert their own private details" on public.property_private_details;
create policy "Sellers can insert their own private details"
  on public.property_private_details for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their own private details" on public.property_private_details;
create policy "Sellers can update their own private details"
  on public.property_private_details for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete their own private details" on public.property_private_details;
create policy "Sellers can delete their own private details"
  on public.property_private_details for delete
  to authenticated
  using (auth.uid() = seller_id);


-- Public photo bucket used by listing galleries.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Property photos are publicly readable" on storage.objects;
create policy "Property photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'property-photos');

drop policy if exists "Sellers can upload property photos" on storage.objects;
create policy "Sellers can upload property photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Sellers can update their own property photos" on storage.objects;
create policy "Sellers can update their own property photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Sellers can delete their own property photos" on storage.objects;
create policy "Sellers can delete their own property photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
