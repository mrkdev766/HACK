import { describe, it, expect, beforeEach } from 'vitest';
import { MissionService } from '@/services/mission-service';
import { demoStore } from '@/lib/storage/demo-store';
import fs from 'fs';
import path from 'path';

describe('Server Authoritative Points Awarding', () => {
  it('awards points atomically for current unlocked destination and rejects duplicates', async () => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const testUserId = `user_${runId}`;
    const testTripId = `trip_${runId}`;
    const testDestId1 = `dest1_${runId}`;
    const testDestId2 = `dest2_${runId}`;
    const testMissionId1 = `mission1_${runId}`;

    demoStore.upsertProfile({
      id: testUserId,
      username: `tester_${runId}`,
      display_name: 'Tester',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    demoStore.saveTrip(
      {
        id: testTripId,
        user_id: testUserId,
        starting_location_name: 'Kochi',
        starting_location_latitude: 9.93,
        starting_location_longitude: 76.26,
        budget_amount: 5000,
        currency: 'INR',
        duration_value: 2,
        duration_unit: 'days',
        transport_mode: 'public_transit',
        travel_style: 'nature',
        estimated_total_cost: 4500,
        total_points: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      [
        {
          id: testDestId1,
          trip_id: testTripId,
          sequence_number: 1,
          name: 'Varkala Beach',
          description: 'Cliffs & Sunset',
          verified_place_id: null,
          latitude: 8.73,
          longitude: 76.71,
          estimated_cost: 2000,
          estimated_travel_minutes: 90,
          image_url: 'https://images.unsplash.com/photo-1',
          status: 'unlocked',
          created_at: new Date().toISOString(),
        },
        {
          id: testDestId2,
          trip_id: testTripId,
          sequence_number: 2,
          name: 'Alleppey Backwaters',
          description: 'Canal network',
          verified_place_id: null,
          latitude: 9.49,
          longitude: 76.33,
          estimated_cost: 2000,
          estimated_travel_minutes: 120,
          image_url: 'https://images.unsplash.com/photo-2',
          status: 'locked',
          created_at: new Date().toISOString(),
        },
      ],
      [
        {
          id: testMissionId1,
          destination_id: testDestId1,
          title: 'Cliff Walk',
          instructions: 'Explore the cliff',
          required_photo_count: 1,
          points: 100,
          requirements_json: { explore_prompt: 'Explore cliff' },
          created_at: new Date().toISOString(),
        },
      ]
    );

    // 1. Initial completion
    const result = await MissionService.completeMission(testUserId, testMissionId1, {
      note: 'Varkala cliff sunset was unreal!',
      actual_spend: 1850,
      photo_urls: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944'],
    });

    expect(result.success).toBe(true);
    expect(result.points_awarded).toBe(100);
    expect(result.new_total_points).toBe(100);

    // 2. Verify next destination was unlocked
    const dest2 = demoStore.getDestination(testDestId2);
    expect(dest2?.status).toBe('unlocked');

    // 3. Attempt duplicate completion: MUST throw and NOT award duplicate points
    await expect(
      MissionService.completeMission(testUserId, testMissionId1, {
        note: 'Trying to claim points again!',
        actual_spend: 1850,
        photo_urls: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944'],
      })
    ).rejects.toThrow(/already completed/i);

    // 4. Verify trip points remain 100, not 200
    const trip = demoStore.getTrip(testTripId);
    expect(trip?.total_points).toBe(100);
  });
});
