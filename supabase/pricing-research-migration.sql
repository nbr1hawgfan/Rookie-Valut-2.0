-- Rookie Vault pricing research migration
-- Run once in Supabase SQL Editor.

alter table public.cards
  add column if not exists price_source text,
  add column if not exists price_notes text,
  add column if not exists price_checked_at timestamptz;

comment on column public.cards.price_source is
  'Source used for the latest estimated value, such as eBay sold or SportsCardsPro.';

comment on column public.cards.price_notes is
  'Collector notes about comparable sales and pricing research.';

comment on column public.cards.price_checked_at is
  'Date and time the estimated value was most recently researched.';
