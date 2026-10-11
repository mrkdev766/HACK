-- Wanderly PostgreSQL Schema & Row Level Security Migration
-- Version: 20261010000000

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TRIPS TABLE
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. DESTINATIONS TABLE
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
  estimated_travel_minutes integer not null default 0 check (estimated_travel_minutes >= 0),
  image_url text not null,
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'completed')),
  created_at timestamptz not null default now(),
  constraint unique_trip_destination_sequence unique (trip_id, sequence_number)
);

-- 4. MISSIONS TABLE
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

-- 5. JOURNAL ENTRIES TABLE
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

-- 6. JOURNAL PHOTOS TABLE
create table if not exists public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- 7. MISSION COMPLETIONS TABLE
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

-- INDEXES FOR PERFORMANCE
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_destinations_trip_id on public.destinations(trip_id);
create index if not exists idx_missions_dest_id on public.missions(destination_id);
create index if not exists idx_journal_entries_trip_id on public.journal_entries(trip_id);
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_mission_completions_user on public.mission_completions(user_id);
create index if not exists idx_mission_completions_trip on public.mission_completions(trip_id);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.destinations enable row level security;
alter table public.missions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;
alter table public.mission_completions enable row level security;

-- PROFILES POLICIES
drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- TRIPS POLICIES
drop policy if exists "Users can view their own trips" on public.trips;
create policy "Users can view their own trips"
  on public.trips for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create trips" on public.trips;
create policy "Users can create trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips"
  on public.trips for update
  using (auth.uid() = user_id);

-- DESTINATIONS POLICIES
drop policy if exists "Users can view destinations of their trips" on public.destinations;
create policy "Users can view destinations of their trips"
  on public.destinations for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- MISSIONS POLICIES
drop policy if exists "Users can view missions of their destinations" on public.missions;
create policy "Users can view missions of their destinations"
  on public.missions for select
  using (
    exists (
      select 1 from public.destinations
      join public.trips on trips.id = destinations.trip_id
      where destinations.id = missions.destination_id
      and trips.user_id = auth.uid()
    )
  );

-- JOURNAL POLICIES
drop policy if exists "Users can view their own journal entries" on public.journal_entries;
create policy "Users can view their own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journal entries" on public.journal_entries;
create policy "Users can insert their own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own journal photos" on public.journal_photos;
create policy "Users can view their own journal photos"
  on public.journal_photos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journal photos" on public.journal_photos;
create policy "Users can insert their own journal photos"
  on public.journal_photos for insert
  with check (auth.uid() = user_id);

-- MISSION COMPLETION POLICIES
drop policy if exists "Users can view their own completions" on public.mission_completions;
create policy "Users can view their own completions"
  on public.mission_completions for select
  using (auth.uid() = user_id);

-- 8. ATOMIC MISSION COMPLETION DATABASE FUNCTION
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
    -- Final destination completed!
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

  -- Return authoritative result
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
