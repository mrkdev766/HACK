import { describe, it, expect, beforeEach } from 'vitest';
import { TripService } from '@/services/trip-service';
import { demoStore } from '@/lib/storage/demo-store';
import { MissionService } from '@/services/mission-service';
import { Destination, Mission } from '@/types/database';

describe('Destination Unlocking & Redaction Rules', () => {
  const dummyDest: Destination = {
    id: 'test-dest-secret',
    trip_id: 'test-trip-1',
    sequence_number: 2,
    name: 'Top Secret Kovalam Bay',
    description: 'Secret cove hidden from public view',
    verified_place_id: 'osm_secret',
    latitude: 8.4004,
    longitude: 76.9787,
    estimated_cost: 1500,
    estimated_travel_minutes: 60,
    image_url: 'https://images.unsplash.com/secret',
    status: 'locked',
    created_at: new Date().toISOString(),
  };

  const dummyMission: Mission = {
    id: 'test-mission-secret',
    destination_id: 'test-dest-secret',
    title: 'Secret Mission',
    instructions: 'Find the hidden lagoon',
    required_photo_count: 2,
    points: 200,
    requirements_json: { explore_prompt: 'Search the cove' },
    created_at: new Date().toISOString(),
  };

  it('redacts destination name, coordinates, and mission details when locked', () => {
    const redacted = TripService.redactDestination(dummyDest, dummyMission, false);

    expect(redacted.status).toBe('locked');
    expect(redacted.name).toContain('Mystery Destination #2');
    expect(redacted.name).not.toContain('Top Secret Kovalam Bay');
    expect(redacted.latitude).toBeNull();
    expect(redacted.longitude).toBeNull();
    expect(redacted.mission).toBeNull();
  });

  it('reveals full details once destination is unlocked', () => {
    const unlockedDest: Destination = { ...dummyDest, status: 'unlocked' };
    const revealed = TripService.redactDestination(unlockedDest, dummyMission, true);

    expect(revealed.status).toBe('unlocked');
    expect(revealed.name).toBe('Top Secret Kovalam Bay');
    expect(revealed.latitude).toBe(8.4004);
    expect(revealed.longitude).toBe(76.9787);
    expect(revealed.mission).not.toBeNull();
    expect(revealed.mission?.title).toBe('Secret Mission');
  });

  it('prevents completing a destination that is locked', async () => {
    const lockedUserId = 'test_user_locked';
    const lockedTripId = 'test_trip_locked';
    const lockedDestId = 'test_dest_locked';
    const lockedMissionId = 'test_mission_locked';

    demoStore.upsertProfile({
      id: lockedUserId,
      username: 'locked_tester',
      display_name: 'Locked Tester',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    demoStore.saveTrip(
      {
        id: lockedTripId,
        user_id: lockedUserId,
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
          id: lockedDestId,
          trip_id: lockedTripId,
          sequence_number: 2,
          name: 'Locked Fortress',
          description: 'Cannot be completed yet',
          verified_place_id: null,
          latitude: 8.73,
          longitude: 76.71,
          estimated_cost: 2000,
          estimated_travel_minutes: 90,
          image_url: 'https://images.unsplash.com/photo-1',
          status: 'locked',
          created_at: new Date().toISOString(),
        },
      ],
      [
        {
          id: lockedMissionId,
          destination_id: lockedDestId,
          title: 'Locked Mission',
          instructions: 'Should fail',
          required_photo_count: 1,
          points: 100,
          requirements_json: { explore_prompt: 'Explore fortress' },
          created_at: new Date().toISOString(),
        },
      ]
    );

    // Attempting to complete locked mission must fail
    await expect(
      MissionService.completeMission(lockedUserId, lockedMissionId, {
        note: 'Attempting to skip to locked destination',
        actual_spend: 1000,
        photo_urls: ['https://example.com/photo.jpg'],
      })
    ).rejects.toThrow(/Destination is not in unlocked state/i);
  });
});
