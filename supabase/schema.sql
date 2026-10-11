-- =============================================================================
-- TRAVELHOLIC / WANDERLY SUPABASE DATABASE SCHEMA
-- Consolidated production schema including Profiles, Trips, Mystery Destinations,
-- Budget Breakdowns, Public Discovery, User Corrections, Friendships, and Live Co-Travelers.
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with public social profiles, coins & badges
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default 'Curious wanderer seeking unmapped trails.',
  badge text default 'Silver Coin Earner',
  coins integer default 150 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. TRIPS TABLE
-- AI-Generated and User-Created Itineraries (Private & Public Quests)
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  starting_location_name text not null,
  starting_location_latitude double precision,
  starting_location_longitude double precision,
  budget_amount numeric(12, 2) not null check (budget_amount >= 0),
  currency text not null default 'INR',
  duration_value integer not null check (duration_value > 0),
  duration_unit text not null check (duration_unit in ('hours', 'days')),
  transport_mode text not null check (transport_mode in ('walking', 'public_transit', 'personal_vehicle')),
  travel_style text not null check (travel_style in ('nature', 'culture', 'food', 'mixed')),
  estimated_total_cost numeric(12, 2) not null default 0,
  total_points integer not null default 0 check (total_points >= 0),
  status text not null default 'active' check (status in ('planning', 'active', 'completed')),
  is_public boolean not null default false,
  public_title text,
  public_description text,
  vibe text default 'Scenic',
  clones_count integer not null default 0 check (clones_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. DESTINATIONS TABLE
-- Individual stops/places along a trip with mystery lock status & user corrections
-- -----------------------------------------------------------------------------
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  name text not null,
  description text not null,
  verified_place_id text,
  latitude double precision,
  longitude double precision,
  estimated_cost numeric(10, 2) not null default 0 check (estimated_cost >= 0),
  actual_spend numeric(10, 2) check (actual_spend >= 0),
  custom_notes text,
  preferred_transport text,
  estimated_travel_minutes integer not null default 0 check (estimated_travel_minutes >= 0),
  image_url text not null,
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'completed')),
  created_at timestamptz not null default now(),
  constraint unique_trip_destination_sequence unique (trip_id, sequence_number)
);

-- -----------------------------------------------------------------------------
-- IDEMPOTENT COLUMN ENHANCEMENTS FOR EXISTING DATABASES
-- Ensures existing tables created from earlier migration versions get the new columns
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists bio text default 'Curious wanderer seeking unmapped trails.',
  add column if not exists badge text default 'Silver Coin Earner',
  add column if not exists coins integer default 150;

alter table public.trips 
  add column if not exists is_public boolean not null default false,
  add column if not exists public_title text,
  add column if not exists public_description text,
  add column if not exists vibe text default 'Scenic',
  add column if not exists clones_count integer not null default 0;

alter table public.destinations
  add column if not exists actual_spend numeric(10,2),
  add column if not exists custom_notes text,
  add column if not exists preferred_transport text default 'walking';

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  title text not null,
  instructions text not null,
  required_photo_count integer not null default 1 check (required_photo_count > 0),
  points integer not null default 100 check (points > 0),
  requirements_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. JOURNAL ENTRIES TABLE
-- Personal memories, notes, and actual spending recorded upon completing stops
-- -----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  note text not null,
  actual_spend numeric(10, 2) not null default 0 check (actual_spend >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 6. JOURNAL PHOTOS TABLE
-- Photo uploads tied to journal entries
-- -----------------------------------------------------------------------------
create table if not exists public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. MISSION COMPLETIONS TABLE
-- Tracks completed missions and awarded coins/points
-- -----------------------------------------------------------------------------
create table if not exists public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  points_awarded integer not null check (points_awarded >= 0),
  completed_at timestamptz not null default now(),
  constraint unique_user_mission_completion unique (user_id, mission_id)
);

-- -----------------------------------------------------------------------------
-- 8. FRIENDSHIPS TABLE
-- Social connections & friend requests between travelers
-- -----------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_friendship_pair unique (user_id, friend_id)
);

-- -----------------------------------------------------------------------------
-- 9. TRIP COMPANIONS TABLE
-- Co-travelers who joined a live active trip
-- -----------------------------------------------------------------------------
create table if not exists public.trip_companions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'co_traveler' check (role in ('leader', 'co_traveler')),
  joined_at timestamptz not null default now(),
  constraint unique_trip_companion unique (trip_id, user_id)
);

-- =============================================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- =============================================================================
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_is_public on public.trips(is_public) where is_public = true;
create index if not exists idx_destinations_trip_id on public.destinations(trip_id);
create index if not exists idx_missions_dest_id on public.missions(destination_id);
create index if not exists idx_journal_entries_trip_id on public.journal_entries(trip_id);
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_mission_completions_user on public.mission_completions(user_id);
create index if not exists idx_mission_completions_trip on public.mission_completions(trip_id);
create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);
create index if not exists idx_trip_companions_trip on public.trip_companions(trip_id);
create index if not exists idx_trip_companions_user on public.trip_companions(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.destinations enable row level security;
alter table public.missions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;
alter table public.mission_completions enable row level security;
alter table public.friendships enable row level security;
alter table public.trip_companions enable row level security;

-- PROFILES: Everyone can view profiles, users can edit their own profile
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- TRIPS: Users can view their own trips OR any public trip
drop policy if exists "Users can view own or public trips" on public.trips;
create policy "Users can view own or public trips" on public.trips for select using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can create trips" on public.trips;
create policy "Users can create trips" on public.trips for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips" on public.trips for update using (auth.uid() = user_id);

-- DESTINATIONS: Viewable if owner of trip or trip is public
drop policy if exists "View destinations of owned or public trips" on public.destinations;
create policy "View destinations of owned or public trips" on public.destinations for select using (
  exists (
    select 1 from public.trips
    where trips.id = destinations.trip_id
    and (trips.user_id = auth.uid() or trips.is_public = true)
  )
);

drop policy if exists "Owners can update destinations" on public.destinations;
create policy "Owners can update destinations" on public.destinations for update using (
  exists (
    select 1 from public.trips
    where trips.id = destinations.trip_id
    and trips.user_id = auth.uid()
  )
);

-- MISSIONS: Viewable if destination's trip is owned or public
drop policy if exists "View missions" on public.missions;
create policy "View missions" on public.missions for select using (
  exists (
    select 1 from public.destinations
    join public.trips on trips.id = destinations.trip_id
    where destinations.id = missions.destination_id
    and (trips.user_id = auth.uid() or trips.is_public = true)
  )
);

-- JOURNAL ENTRIES: Owners only
drop policy if exists "Users can view their own journal entries" on public.journal_entries;
create policy "Users can view their own journal entries" on public.journal_entries for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journal entries" on public.journal_entries;
create policy "Users can insert their own journal entries" on public.journal_entries for insert with check (auth.uid() = user_id);

-- FRIENDSHIPS: Involved users only
drop policy if exists "Users can view their own friendships" on public.friendships;
create policy "Users can view their own friendships" on public.friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can manage their friendships" on public.friendships;
create policy "Users can manage their friendships" on public.friendships for insert with check (auth.uid() = user_id);

-- TRIP COMPANIONS: Trip owner or co-traveler
drop policy if exists "View trip companions" on public.trip_companions;
create policy "View trip companions" on public.trip_companions for select using (
  auth.uid() = user_id or exists (
    select 1 from public.trips where trips.id = trip_companions.trip_id and trips.user_id = auth.uid()
  )
);

drop policy if exists "Join public trips as companion" on public.trip_companions;
create policy "Join public trips as companion" on public.trip_companions for insert with check (auth.uid() = user_id);

-- =============================================================================
-- ATOMIC STORED FUNCTION: MISSION COMPLETION & TRIP PROGRESSION
-- =============================================================================
create or replace function public.complete_destination_mission(
  p_user_id uuid,
  p_mission_id uuid,
  p_note text,
  p_actual_spend numeric,
  p_photo_paths text[]
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_destination record;
  v_mission record;
  v_trip record;
  v_next_destination record;
  v_completion_id uuid;
  v_journal_id uuid;
  v_photo_path text;
  v_is_final boolean := false;
  v_new_total_points integer;
begin
  -- 1. Fetch mission
  select * into v_mission from public.missions where id = p_mission_id;
  if not found then
    raise exception 'Mission not found';
  end if;

  -- 2. Fetch destination
  select * into v_destination from public.destinations where id = v_mission.destination_id;
  if not found then
    raise exception 'Destination not found';
  end if;

  -- 3. Fetch and verify trip ownership
  select * into v_trip from public.trips where id = v_destination.trip_id;
  if not found or v_trip.user_id <> p_user_id then
    raise exception 'Unauthorized trip access';
  end if;

  -- 4. Prevent double completion
  if exists (select 1 from public.mission_completions where user_id = p_user_id and mission_id = p_mission_id) then
    raise exception 'Mission already completed';
  end if;

  -- 5. Verify unlock state
  if v_destination.status <> 'unlocked' then
    raise exception 'Destination is not in unlocked state';
  end if;

  -- 6. Insert completion record
  insert into public.mission_completions (user_id, trip_id, destination_id, mission_id, points_awarded)
  values (p_user_id, v_trip.id, v_destination.id, v_mission.id, v_mission.points)
  returning id into v_completion_id;

  -- 7. Update destination to completed
  update public.destinations
  set status = 'completed'
  where id = v_destination.id;

  -- 8. Update trip points
  update public.trips
  set total_points = total_points + v_mission.points,
      updated_at = now()
  where id = v_trip.id
  returning total_points into v_new_total_points;

  -- 9. Unlock next destination
  select * into v_next_destination
  from public.destinations
  where trip_id = v_trip.id and sequence_number = v_destination.sequence_number + 1;

  if found then
    update public.destinations
    set status = 'unlocked'
    where id = v_next_destination.id;
  else
    v_is_final := true;
    update public.trips
    set status = 'completed',
        updated_at = now()
    where id = v_trip.id;
  end if;

  -- 10. Record journal entry
  insert into public.journal_entries (user_id, trip_id, destination_id, mission_id, note, actual_spend, currency)
  values (p_user_id, v_trip.id, v_destination.id, v_mission.id, p_note, coalesce(p_actual_spend, 0), v_trip.currency)
  returning id into v_journal_id;

  -- 11. Insert journal photos
  if p_photo_paths is not null then
    foreach v_photo_path in array p_photo_paths
    loop
      insert into public.journal_photos (journal_entry_id, user_id, storage_path)
      values (v_journal_id, p_user_id, v_photo_path);
    end loop;
  end if;

  return jsonb_build_object(
    'success', true,
    'points_awarded', v_mission.points,
    'new_total_points', v_new_total_points,
    'completed_destination_id', v_destination.id,
    'next_destination_id', v_next_destination.id,
    'trip_completed', v_is_final,
    'message', 'Mission completed successfully'
  );
end;
$$;
