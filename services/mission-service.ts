import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { CompleteMissionPayload, MissionCompletionResponse } from '@/types/trip';
import { TripService } from './trip-service';

export class MissionService {
  /**
   * Authoritative server-side mission completion
   */
  static async completeMission(
    userId: string,
    missionId: string,
    payload: CompleteMissionPayload
  ): Promise<MissionCompletionResponse> {
    // 1. Validation
    if (!payload.note || payload.note.trim().length < 5) {
      throw new Error('Please enter at least 5 characters in your journal note');
    }

    if (payload.actual_spend < 0) {
      throw new Error('Actual spend cannot be negative');
    }

    // 2. Supabase execution when configured
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { data, error } = await supabase.rpc('complete_destination_mission', {
          p_user_id: userId,
          p_mission_id: missionId,
          p_note: payload.note,
          p_actual_spend: payload.actual_spend,
          p_photo_paths: payload.photo_urls,
        });

        if (error) {
          throw new Error(error.message);
        }

        const nextDest = data.next_destination_id
          ? await TripService.getTripDetail(data.trip_id, userId)
          : null;

        return {
          success: true,
          points_awarded: data.points_awarded,
          new_total_points: data.new_total_points,
          completed_destination_id: data.completed_destination_id,
          next_destination: nextDest?.destinations.find((d) => d.id === data.next_destination_id) || null,
          trip_completed: Boolean(data.trip_completed),
          message: data.message || 'Mission completed successfully',
        };
      }
    }

    // 3. Demo store atomic transaction execution
    const result = demoStore.completeMissionTransaction(
      userId,
      missionId,
      payload.note,
      payload.actual_spend,
      payload.photo_urls,
      payload.location_name
    );

    let nextClientDest = null;
    if (result.next_destination_id) {
      const nextRaw = demoStore.getDestination(result.next_destination_id);
      const nextMission = demoStore.getMissionForDestination(result.next_destination_id);
      if (nextRaw) {
        nextClientDest = TripService.redactDestination(nextRaw, nextMission, true);
      }
    }

    return {
      success: true,
      points_awarded: result.points_awarded,
      new_total_points: result.new_total_points,
      completed_destination_id: result.completed_destination_id,
      next_destination: nextClientDest,
      trip_completed: result.trip_completed,
      message: result.message,
    };
  }
}
