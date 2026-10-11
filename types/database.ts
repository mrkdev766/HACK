export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DestinationStatus = 'locked' | 'unlocked' | 'completed';
export type TripStatus = 'planning' | 'active' | 'completed';
export type TransportMode = 'walking' | 'public_transit' | 'personal_vehicle';
export type TravelStyle = 'nature' | 'culture' | 'food' | 'mixed' | string;
export type DurationUnit = 'hours' | 'days';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  starting_location_name: string;
  starting_location_latitude: number | null;
  starting_location_longitude: number | null;
  budget_amount: number;
  currency: string;
  duration_value: number;
  duration_unit: DurationUnit;
  transport_mode: TransportMode;
  travel_style: TravelStyle;
  estimated_total_cost: number;
  total_points: number;
  status: TripStatus;
  is_public?: boolean;
  public_title?: string | null;
  public_description?: string | null;
  vibe?: string | null;
  clones_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  trip_id: string;
  sequence_number: number;
  name: string;
  description: string;
  verified_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_cost: number;
  actual_spend?: number | null;
  custom_notes?: string | null;
  estimated_travel_minutes: number;
  image_url: string;
  status: DestinationStatus;
  created_at: string;
}

export interface Mission {
  id: string;
  destination_id: string;
  title: string;
  instructions: string;
  required_photo_count: number;
  points: number;
  requirements_json: {
    explore_prompt: string;
    photo_prompt?: string;
    note_prompt?: string;
    min_spend_recorded?: boolean;
    tags?: string[];
  };
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  trip_id: string;
  destination_id: string;
  mission_id: string;
  note: string;
  actual_spend: number;
  currency: string;
  created_at: string;
  updated_at: string;
  photos?: JournalPhoto[];
  destination_name?: string;
}

export interface JournalPhoto {
  id: string;
  journal_entry_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface MissionCompletion {
  id: string;
  user_id: string;
  trip_id: string;
  destination_id: string;
  mission_id: string;
  points_awarded: number;
  completed_at: string;
}

export type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface TripCompanion {
  id: string;
  trip_id: string;
  user_id: string;
  role: 'leader' | 'co_traveler';
  joined_at: string;
}

export interface ActiveLiveQuest {
  id: string;
  title: string;
  starting_location: string;
  vibe: string;
  current_destination_name: string;
  current_stop_index: number;
  total_stops: number;
  budget_amount: number;
  companions_count: number;
  started_at?: string;
}

export interface TraveledQuest {
  id: string;
  title: string;
  starting_location: string;
  vibe: string;
  stops_count: number;
  cover_image: string;
  total_points: number;
  completed_at: string;
  budget_amount: number;
}

export interface ExplorerProfile extends Profile {
  bio?: string;
  badge?: string;
  coins?: number;
  total_quests_completed?: number;
  friendship_status?: FriendshipStatus;
  active_live_quest?: ActiveLiveQuest | null;
  traveled_quests?: TraveledQuest[];
}

