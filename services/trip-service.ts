import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { Destination, Mission, Trip } from '@/types/database';
import { ClientDestinationView, ClientTripDetail, TripSummaryStats } from '@/types/trip';

export class TripService {
  /**
   * Redacts secret information from locked destinations before returning to client
   */
  static redactDestination(
    dest: Destination,
    mission: Mission | null,
    isCurrent: boolean
  ): ClientDestinationView {
    if (dest.status === 'locked') {
      return {
        id: dest.id,
        sequence_number: dest.sequence_number,
        status: 'locked',
        name: `Mystery Destination #${dest.sequence_number}`,
        description: 'Unlock after completing previous destination',
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        latitude: null,
        longitude: null,
        mission: null,
        isCurrent: false,
      };
    }

    return {
      id: dest.id,
      sequence_number: dest.sequence_number,
      status: dest.status,
      name: dest.name,
      description: dest.description,
      estimated_cost: Number(dest.estimated_cost),
      actual_spend: dest.actual_spend != null ? Number(dest.actual_spend) : null,
      custom_notes: dest.custom_notes || null,
      estimated_travel_minutes: dest.estimated_travel_minutes,
      image_url: dest.image_url,
      latitude: dest.latitude,
      longitude: dest.longitude,
      isCurrent,
      mission: mission
        ? {
            id: mission.id,
            title: mission.title,
            instructions: mission.instructions,
            required_photo_count: mission.required_photo_count,
            points: mission.points,
            requirements: {
              explore_prompt: mission.requirements_json?.explore_prompt || 'Explore location',
              photo_prompt: mission.requirements_json?.photo_prompt,
              note_prompt: mission.requirements_json?.note_prompt,
            },
            isCompleted: dest.status === 'completed',
          }
        : null,
    };
  }

  /**
   * Retrieves trip with authoritatively redacted destination details
   */
  static async getTripDetail(tripId: string, userId: string): Promise<ClientTripDetail | null> {
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { data: trip } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (trip) {
          const { data: destinations } = await supabase
            .from('destinations')
            .select('*, missions(*)')
            .eq('trip_id', tripId)
            .order('sequence_number', { ascending: true });

          const rawDests = (destinations || []) as (Destination & { missions: Mission[] })[];

          const currentUnlocked = rawDests.find((d) => d.status === 'unlocked') || null;

          const clientDests: ClientDestinationView[] = rawDests.map((d) => {
            const m = d.missions?.[0] || null;
            const isCurrent = currentUnlocked ? currentUnlocked.id === d.id : false;
            return this.redactDestination(d, m, isCurrent);
          });

          const completedCount = rawDests.filter((d) => d.status === 'completed').length;
          const totalCount = rawDests.length;

          return {
            trip,
            destinations: clientDests,
            currentDestination: clientDests.find((d) => d.isCurrent) || null,
            completedDestinationsCount: completedCount,
            totalDestinationsCount: totalCount,
            totalPoints: trip.total_points || 0,
            progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
            isAllCompleted: completedCount === totalCount && totalCount > 0,
          };
        }
      }
    }

    // Demo store fallback
    const trip = demoStore.getTrip(tripId);
    if (!trip) return null;

    const rawDests = demoStore.getDestinations(tripId);
    const currentUnlocked = rawDests.find((d) => d.status === 'unlocked') || null;

    const clientDests: ClientDestinationView[] = rawDests.map((d) => {
      const mission = demoStore.getMissionForDestination(d.id);
      const isCurrent = currentUnlocked ? currentUnlocked.id === d.id : false;
      return this.redactDestination(d, mission, isCurrent);
    });

    const completedCount = rawDests.filter((d) => d.status === 'completed').length;
    const totalCount = rawDests.length;

    return {
      trip,
      destinations: clientDests,
      currentDestination: clientDests.find((d) => d.isCurrent) || null,
      completedDestinationsCount: completedCount,
      totalDestinationsCount: totalCount,
      totalPoints: trip.total_points || 0,
      progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      isAllCompleted: completedCount === totalCount && totalCount > 0,
    };
  }

  /**
   * Compiles final trip summary statistics
   */
  static async getTripSummary(tripId: string, userId: string): Promise<TripSummaryStats | null> {
    const detail = await this.getTripDetail(tripId, userId);
    if (!detail) return null;

    const journalEntries = isSupabaseServerConfigured()
      ? [] // Will fetch via Supabase if configured
      : demoStore.getJournalEntries(tripId);

    const actualSpendTotal = journalEntries.reduce((sum, e) => sum + Number(e.actual_spend || 0), 0);
    const allPhotos: string[] = [];

    journalEntries.forEach((entry) => {
      if (entry.photos) {
        entry.photos.forEach((p) => {
          if (p.storage_path) allPhotos.push(p.storage_path);
        });
      }
    });

    return {
      trip_id: tripId,
      starting_location: detail.trip.starting_location_name,
      completed_destinations_count: detail.completedDestinationsCount,
      total_destinations_count: detail.totalDestinationsCount,
      total_points: detail.totalPoints,
      budget_amount: Number(detail.trip.budget_amount),
      actual_spend_total: actualSpendTotal,
      currency: detail.trip.currency,
      duration_value: detail.trip.duration_value,
      duration_unit: detail.trip.duration_unit,
      journal_entries: journalEntries,
      all_photos: allPhotos,
    };
  }
}
