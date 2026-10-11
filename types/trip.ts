import { Destination, DestinationStatus, JournalEntry, Mission, Trip } from './database';

export interface ClientDestinationView {
  id: string;
  sequence_number: number;
  status: DestinationStatus;
  // If locked, these details are redacted by backend
  name: string;
  description: string;
  estimated_cost?: number;
  actual_spend?: number | null;
  custom_notes?: string | null;
  estimated_travel_minutes?: number;
  image_url: string;
  latitude?: number | null;
  longitude?: number | null;
  mission?: ClientMissionView | null;
  isCurrent: boolean;
}

export interface ClientMissionView {
  id: string;
  title: string;
  instructions: string;
  required_photo_count: number;
  points: number;
  requirements: {
    explore_prompt: string;
    photo_prompt?: string;
    note_prompt?: string;
  };
  isCompleted?: boolean;
}

export interface ClientTripDetail {
  trip: Trip;
  destinations: ClientDestinationView[];
  currentDestination: ClientDestinationView | null;
  completedDestinationsCount: number;
  totalDestinationsCount: number;
  totalPoints: number;
  progressPercent: number;
  isAllCompleted: boolean;
}

export interface CompleteMissionPayload {
  note: string;
  actual_spend: number;
  photo_urls: string[];
  location_name?: string;
}

export interface MissionCompletionResponse {
  success: boolean;
  points_awarded: number;
  new_total_points: number;
  completed_destination_id: string;
  next_destination: ClientDestinationView | null;
  trip_completed: boolean;
  message: string;
}

export interface TripSummaryStats {
  trip_id: string;
  starting_location: string;
  completed_destinations_count: number;
  total_destinations_count: number;
  total_points: number;
  budget_amount: number;
  actual_spend_total: number;
  currency: string;
  duration_value: number;
  duration_unit: string;
  journal_entries: JournalEntry[];
  all_photos: string[];
}
