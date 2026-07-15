-- Rookie Vault 2 starter schema
-- Run this in the Supabase SQL Editor on a NEW project.

create extension if not exists pgcrypto;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_members (
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (collection_id, user_id)
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_name text not null,
  sport text not null default 'Other',
  card_year integer check (card_year between 1800 and 2200),
  brand text,
  set_name text,
  card_number text,
  estimated_value numeric(12,2) not null default 0 check (estimated_value >= 0),
  status text not null default 'keep' check (status in ('keep', 'trade', 'duplicate', 'want')),
  storage_location text,
  notes text,
  front_photo_path text,
  back_photo_path text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

-- Every new user receives a personal collection.
create or replace function public.create_personal_collection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_collection_id uuid;
begin
  insert into public.collections (name, created_by)
  values ('My Rookie Vault', new.id)
  returning id into new_collection_id;

  insert into public.collection_members (collection_id, user_id, role)
  values (new_collection_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_personal_collection();

alter table public.collections enable row level security;
alter table public.collection_members enable row level security;
alter table public.cards enable row level security;

create policy "members can read collections"
on public.collections for select
to authenticated
using (
  exists (
    select 1 from public.collection_members cm
    where cm.collection_id = collections.id
      and cm.user_id = auth.uid()
  )
);

create policy "members can read membership"
on public.collection_members for select
to authenticated
using (
  exists (
    select 1 from public.collection_members mine
    where mine.collection_id = collection_members.collection_id
      and mine.user_id = auth.uid()
  )
);

create policy "members can read cards"
on public.cards for select
to authenticated
using (
  exists (
    select 1 from public.collection_members cm
    where cm.collection_id = cards.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "members can add cards"
on public.cards for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.collection_members cm
    where cm.collection_id = cards.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "members can update cards"
on public.cards for update
to authenticated
using (
  exists (
    select 1 from public.collection_members cm
    where cm.collection_id = cards.collection_id
      and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.collection_members cm
    where cm.collection_id = cards.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "owners can delete cards"
on public.cards for delete
to authenticated
using (
  exists (
    select 1 from public.collection_members cm
    where cm.collection_id = cards.collection_id
      and cm.user_id = auth.uid()
      and cm.role = 'owner'
  )
);

-- Automatically choose the signed-in user's first collection when inserting a card.
create or replace function public.assign_default_collection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.collection_id is null then
    select cm.collection_id
    into new.collection_id
    from public.collection_members cm
    where cm.user_id = auth.uid()
    order by cm.created_at
    limit 1;
  end if;

  return new;
end;
$$;

-- collection_id is required by the table, so the browser should still provide it.
-- The starter app will be upgraded next to load the user's collection explicitly.
