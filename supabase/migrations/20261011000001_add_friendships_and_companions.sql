-- Migration: 20261011000001_add_friendships_and_companions.sql
-- Enables traveler discovery, friendships, and joining live ongoing quests

-- 1. Extend profiles with bio and badge
alter table public.profiles
  add column if not exists bio text default 'Curious wanderer seeking unmapped trails.',
  add column if not exists badge text default 'Silver Coin Earner',
  add column if not exists coins integer default 150;

-- 2. Friendships table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_friendship_pair unique (user_id, friend_id)
);

create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);

-- 3. Trip Companions (Co-Travelers joining live quests)
create table if not exists public.trip_companions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'co_traveler' check (role in ('leader', 'co_traveler')),
  joined_at timestamptz not null default now(),
  constraint unique_trip_companion unique (trip_id, user_id)
);

create index if not exists idx_trip_companions_trip on public.trip_companions(trip_id);
create index if not exists idx_trip_companions_user on public.trip_companions(user_id);
