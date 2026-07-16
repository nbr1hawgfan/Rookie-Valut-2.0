-- Rookie Vault Set Tracker v1
-- Run once in Supabase SQL Editor.

create table if not exists public.set_goals (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  card_year integer not null check (card_year between 1900 and 2200),
  brand text not null,
  set_name text not null,
  total_cards integer not null check (total_cards between 1 and 5000),
  start_number integer not null default 1 check (start_number between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_goals_set_updated_at on public.set_goals;
create trigger set_goals_set_updated_at
before update on public.set_goals
for each row execute function public.set_updated_at();

alter table public.set_goals enable row level security;

drop policy if exists "members can read set goals" on public.set_goals;
drop policy if exists "members can add set goals" on public.set_goals;
drop policy if exists "members can update set goals" on public.set_goals;
drop policy if exists "members can delete set goals" on public.set_goals;

create policy "members can read set goals"
on public.set_goals for select
to authenticated
using (
  exists (
    select 1
    from public.collection_members cm
    where cm.collection_id = set_goals.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "members can add set goals"
on public.set_goals for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.collection_members cm
    where cm.collection_id = set_goals.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "members can update set goals"
on public.set_goals for update
to authenticated
using (
  exists (
    select 1
    from public.collection_members cm
    where cm.collection_id = set_goals.collection_id
      and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.collection_members cm
    where cm.collection_id = set_goals.collection_id
      and cm.user_id = auth.uid()
  )
);

create policy "members can delete set goals"
on public.set_goals for delete
to authenticated
using (
  exists (
    select 1
    from public.collection_members cm
    where cm.collection_id = set_goals.collection_id
      and cm.user_id = auth.uid()
  )
);
