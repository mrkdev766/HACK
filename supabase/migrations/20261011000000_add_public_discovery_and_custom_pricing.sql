-- Migration: 20261011000000_add_public_discovery_and_custom_pricing.sql
-- Enables publishing mystery quests to public discovery with custom locations, corrected prices, and AI enhancement

alter table public.trips 
  add column if not exists is_public boolean default false,
  add column if not exists public_title text,
  add column if not exists public_description text,
  add column if not exists vibe text default 'Scenic',
  add column if not exists clones_count integer default 0;

alter table public.destinations
  add column if not exists actual_spend numeric(10,2),
  add column if not exists custom_notes text;

-- Create index for quick discovery feed queries
create index if not exists idx_trips_is_public on public.trips(is_public) where is_public = true;
