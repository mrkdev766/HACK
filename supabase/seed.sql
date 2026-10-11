-- Wanderly Seed Data (Kerala Coast Demo Itinerary)
-- Designed to match reference screenshots (Varkala, Alleppey, Kovalam)

-- Sample Profile (Demo user)
insert into public.profiles (id, username, display_name, avatar_url)
values (
  '00000000-0000-0000-0000-000000000001',
  'wanderer_demo',
  'Wanderer',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
) on conflict (id) do nothing;

-- Sample Trip
insert into public.trips (
  id,
  user_id,
  starting_location_name,
  starting_location_latitude,
  starting_location_longitude,
  budget_amount,
  currency,
  duration_value,
  duration_unit,
  transport_mode,
  travel_style,
  estimated_total_cost,
  total_points,
  status
)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Kochi, Kerala',
  9.9312,
  76.2673,
  6000.00,
  'INR',
  2,
  'days',
  'public_transit',
  'nature',
  5500.00,
  100,
  'active'
) on conflict (id) do nothing;

-- Destination 1: Varkala (Completed in seed)
insert into public.destinations (
  id,
  trip_id,
  sequence_number,
  name,
  description,
  verified_place_id,
  latitude,
  longitude,
  estimated_cost,
  estimated_travel_minutes,
  image_url,
  status
)
values (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  1,
  'Varkala',
  'A peaceful beach town with red cliffs, vibrant cafes, and amazing sunsets over the Arabian Sea.',
  'osm_place_varkala',
  8.7379,
  76.7163,
  2000.00,
  90,
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  'completed'
) on conflict (id) do nothing;

-- Destination 2: Alleppey (Currently Unlocked in seed)
insert into public.destinations (
  id,
  trip_id,
  sequence_number,
  name,
  description,
  verified_place_id,
  latitude,
  longitude,
  estimated_cost,
  estimated_travel_minutes,
  image_url,
  status
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2,
  'Alleppey',
  'Famous backwaters canal network, serene houseboats, and authentic coastal village life.',
  'osm_place_alleppey',
  9.4981,
  76.3388,
  2000.00,
  120,
  'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
  'unlocked'
) on conflict (id) do nothing;

-- Destination 3: Kovalam (Locked in seed)
insert into public.destinations (
  id,
  trip_id,
  sequence_number,
  name,
  description,
  verified_place_id,
  latitude,
  longitude,
  estimated_cost,
  estimated_travel_minutes,
  image_url,
  status
)
values (
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  3,
  'Kovalam',
  'Iconic striped lighthouse overlooking crescent beaches and rocky coastal headlands.',
  'osm_place_kovalam',
  8.4004,
  76.9787,
  1500.00,
  105,
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  'locked'
) on conflict (id) do nothing;

-- Missions
insert into public.missions (id, destination_id, title, instructions, required_photo_count, points, requirements_json)
values 
(
  '33333333-3333-3333-3333-333333333331',
  '22222222-2222-2222-2222-222222222221',
  'Cliff Explorer',
  'Walk along the famous north cliff pathway and witness the sun dipping below the ocean.',
  2,
  100,
  '{"explore_prompt": "Explore the beach & cliff", "photo_prompt": "Take 2 scenic photos", "note_prompt": "Write a short note"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333332',
  '22222222-2222-2222-2222-222222222222',
  'Backwater Serenity',
  'Take a ferry or kayak through the serene palm-fringed backwater channels.',
  2,
  150,
  '{"explore_prompt": "Cruise the backwaters canal", "photo_prompt": "Capture a traditional houseboat", "note_prompt": "Describe the water reflections"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222223',
  'Lighthouse Summit',
  'Climb up to the red-and-white lighthouse viewpoint on Kurumkal Hill.',
  2,
  200,
  '{"explore_prompt": "Ascend the lighthouse stairs", "photo_prompt": "Photograph the crescent coastline", "note_prompt": "Note the coastal breeze"}'::jsonb
)
on conflict (id) do nothing;

-- Completion of Destination 1
insert into public.mission_completions (id, user_id, trip_id, destination_id, mission_id, points_awarded)
values (
  '44444444-4444-4444-4444-444444444441',
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '33333333-3333-3333-3333-333333333331',
  100
) on conflict (id) do nothing;

-- Journal Entry for Varkala
insert into public.journal_entries (id, user_id, trip_id, destination_id, mission_id, note, actual_spend, currency)
values (
  '55555555-5555-5555-5555-555555555551',
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '33333333-3333-3333-3333-333333333331',
  'Beautiful sunset at Varkala cliff. The red cliffs meet the Arabian sea with the gentle sound of crashing waves. So peaceful!',
  1850.00,
  'INR'
) on conflict (id) do nothing;

insert into public.journal_photos (id, journal_entry_id, user_id, storage_path, caption)
values 
(
  '66666666-6666-6666-6666-666666666661',
  '55555555-5555-5555-5555-555555555551',
  '00000000-0000-0000-0000-000000000001',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
  'Sunset view from north cliff'
),
(
  '66666666-6666-6666-6666-666666666662',
  '55555555-5555-5555-5555-555555555551',
  '00000000-0000-0000-0000-000000000001',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'Beach shoreline at dusk'
)
on conflict (id) do nothing;
