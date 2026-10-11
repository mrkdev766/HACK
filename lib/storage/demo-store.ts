import fs from 'fs';
import path from 'path';
import {
  Destination,
  JournalEntry,
  JournalPhoto,
  Mission,
  MissionCompletion,
  Profile,
  Trip,
  Friendship,
  TripCompanion,
  ExplorerProfile,
} from '@/types/database';

interface StoreData {
  profiles: Profile[];
  trips: Trip[];
  destinations: Destination[];
  missions: Mission[];
  journal_entries: JournalEntry[];
  journal_photos: JournalPhoto[];
  mission_completions: MissionCompletion[];
  friendships: Friendship[];
  trip_companions: TripCompanion[];
}

const DATA_FILE_PATH = path.join(process.cwd(), '.wanderly_demo_store.json');

const INITIAL_PROFILES: Profile[] = [];

const INITIAL_TRIPS: Trip[] = [];

const INITIAL_DESTINATIONS: Destination[] = [];
const INITIAL_MISSIONS: Mission[] = [];

function readData(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        profiles: parsed.profiles || [],
        trips: parsed.trips || [],
        destinations: parsed.destinations || [],
        missions: parsed.missions || [],
        journal_entries: parsed.journal_entries || [],
        journal_photos: parsed.journal_photos || [],
        mission_completions: parsed.mission_completions || [],
        friendships: parsed.friendships || [],
        trip_companions: parsed.trip_companions || [],
      };
    }
  } catch (err) {
    console.error('Error reading demo store file:', err);
  }
  const initial: StoreData = {
    profiles: [],
    trips: [],
    destinations: [],
    missions: [],
    journal_entries: [],
    journal_photos: [],
    mission_completions: [],
    friendships: [],
    trip_companions: [],
  };
  saveData(initial);
  return initial;
}

function saveData(data: StoreData): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing demo store file:', err);
  }
}

export const demoStore = {
  getProfile: (userId: string): Profile | null => {
    const data = readData();
    return data.profiles.find((p) => p.id === userId) || null;
  },

  getProfileByUsername: (username: string): Profile | null => {
    const data = readData();
    return data.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) || null;
  },

  upsertProfile: (profile: Profile): Profile => {
    const data = readData();
    const idx = data.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      data.profiles[idx] = { ...data.profiles[idx], ...profile, updated_at: new Date().toISOString() };
    } else {
      data.profiles.push(profile);
    }
    saveData(data);
    return profile;
  },

  getTrip: (tripId: string): Trip | null => {
    const data = readData();
    return data.trips.find((t) => t.id === tripId) || null;
  },

  getUserActiveTrip: (userId: string): Trip | null => {
    const data = readData();
    return data.trips.find((t) => t.user_id === userId && t.status === 'active') || null;
  },

  getUserTrips: (userId: string): Trip[] => {
    const data = readData();
    return data.trips
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  saveTrip: (trip: Trip, destinations: Destination[], missions: Mission[]): void => {
    const data = readData();
    data.trips.push(trip);
    data.destinations.push(...destinations);
    data.missions.push(...missions);
    saveData(data);
  },

  getDestinations: (tripId: string): Destination[] => {
    const data = readData();
    return data.destinations
      .filter((d) => d.trip_id === tripId)
      .sort((a, b) => a.sequence_number - b.sequence_number);
  },

  getDestination: (destinationId: string): Destination | null => {
    const data = readData();
    return data.destinations.find((d) => d.id === destinationId) || null;
  },

  getMissionForDestination: (destinationId: string): Mission | null => {
    const data = readData();
    return data.missions.find((m) => m.destination_id === destinationId) || null;
  },

  getMission: (missionId: string): Mission | null => {
    const data = readData();
    return data.missions.find((m) => m.id === missionId) || null;
  },

  getJournalEntries: (tripId: string): JournalEntry[] => {
    const data = readData();
    return data.journal_entries
      .filter((e) => e.trip_id === tripId)
      .map((entry) => {
        const photos = data.journal_photos.filter((p) => p.journal_entry_id === entry.id);
        const destination = data.destinations.find((d) => d.id === entry.destination_id);
        return {
          ...entry,
          photos,
          destination_name: destination?.name,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Atomic server-side mission completion
   */
  completeMissionTransaction: (
    userId: string,
    missionId: string,
    note: string,
    actualSpend: number,
    photoUrls: string[],
    customLocationName?: string
  ): {
    success: boolean;
    points_awarded: number;
    new_total_points: number;
    completed_destination_id: string;
    next_destination_id: string | null;
    trip_completed: boolean;
    message: string;
  } => {
    const data = readData();
    const mission = data.missions.find((m) => m.id === missionId);
    if (!mission) throw new Error('Mission not found');

    const destination = data.destinations.find((d) => d.id === mission.destination_id);
    if (!destination) throw new Error('Destination not found');

    const trip = data.trips.find((t) => t.id === destination.trip_id);
    if (!trip || trip.user_id !== userId) throw new Error('Unauthorized trip access');

    const existingCompletion = data.mission_completions.find(
      (c) => c.user_id === userId && c.mission_id === missionId
    );
    if (existingCompletion) {
      throw new Error('Mission already completed');
    }

    if (destination.status !== 'unlocked') {
      throw new Error('Destination is not in unlocked state');
    }

    // 1. Insert completion
    const completion: MissionCompletion = {
      id: `comp-${Date.now()}`,
      user_id: userId,
      trip_id: trip.id,
      destination_id: destination.id,
      mission_id: mission.id,
      points_awarded: mission.points,
      completed_at: new Date().toISOString(),
    };
    data.mission_completions.push(completion);

    // 2. Update destination to completed and record actual spend and custom location name
    destination.status = 'completed';
    destination.actual_spend = actualSpend;
    if (customLocationName && customLocationName.trim()) {
      destination.name = customLocationName.trim();
    }

    // 3. Update trip points
    trip.total_points = (trip.total_points || 0) + mission.points;
    trip.updated_at = new Date().toISOString();

    // 4. Unlock next destination
    const nextDestination = data.destinations.find(
      (d) => d.trip_id === trip.id && d.sequence_number === destination.sequence_number + 1
    );

    let isTripCompleted = false;
    if (nextDestination) {
      nextDestination.status = 'unlocked';
    } else {
      isTripCompleted = true;
      trip.status = 'completed';
    }

    // 5. Insert journal entry
    const journalEntryId = `journal-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: journalEntryId,
      user_id: userId,
      trip_id: trip.id,
      destination_id: destination.id,
      mission_id: mission.id,
      note,
      actual_spend: actualSpend,
      currency: trip.currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.journal_entries.push(newEntry);

    // 6. Insert journal photos
    if (photoUrls && photoUrls.length > 0) {
      for (const url of photoUrls) {
        data.journal_photos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          journal_entry_id: journalEntryId,
          user_id: userId,
          storage_path: url,
          caption: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveData(data);

    return {
      success: true,
      points_awarded: mission.points,
      new_total_points: trip.total_points,
      completed_destination_id: destination.id,
      next_destination_id: nextDestination ? nextDestination.id : null,
      trip_completed: isTripCompleted,
      message: 'Mission completed successfully',
    };
  },

  publishTrip: (
    tripId: string,
    payload: {
      publicTitle: string;
      publicDescription: string;
      vibe: string;
      destinations?: { id: string; name: string; actual_spend?: number; custom_notes?: string }[];
    }
  ): Trip | null => {
    const data = readData();
    const trip = data.trips.find((t) => t.id === tripId);
    if (!trip) return null;

    trip.is_public = true;
    trip.public_title = payload.publicTitle;
    trip.public_description = payload.publicDescription;
    trip.vibe = payload.vibe || trip.travel_style;
    trip.updated_at = new Date().toISOString();

    if (payload.destinations) {
      for (const dPatch of payload.destinations) {
        const dest = data.destinations.find((d) => d.id === dPatch.id && d.trip_id === tripId);
        if (dest) {
          if (dPatch.name) dest.name = dPatch.name;
          if (typeof dPatch.actual_spend === 'number') dest.actual_spend = dPatch.actual_spend;
          if (dPatch.custom_notes) dest.custom_notes = dPatch.custom_notes;
        }
      }
    }

    saveData(data);
    return trip;
  },

  getPublicTrips: (): any[] => {
    const data = readData();
    const publicTrips = data.trips.filter((t) => t.is_public === true);

    return publicTrips.map((trip) => {
      const author = data.profiles.find((p) => p.id === trip.user_id);
      const destinations = data.destinations
        .filter((d) => d.trip_id === trip.id)
        .sort((a, b) => a.sequence_number - b.sequence_number);
      const entries = data.journal_entries.filter((e) => e.trip_id === trip.id);
      const photos = data.journal_photos.filter((p) => entries.some((e) => e.id === p.journal_entry_id));

      return {
        ...trip,
        author: {
          username: author?.username || 'wanderer',
          display_name: author?.display_name || author?.username || 'Cosmic Nomad',
          avatar_url: author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${author?.username || 'wanderer'}`,
        },
        destinations,
        photos_count: photos.length,
        preview_photos: photos.slice(0, 4).map((p) => p.storage_path),
      };
    });
  },

  cloneTrip: (originalTripId: string, targetUserId: string): { trip: Trip; destinations: Destination[] } | null => {
    const data = readData();
    const originalTrip = data.trips.find((t) => t.id === originalTripId);
    if (!originalTrip) return null;

    originalTrip.clones_count = (originalTrip.clones_count || 0) + 1;

    const newTripId = `trip-${Date.now()}`;
    const newTrip: Trip = {
      ...originalTrip,
      id: newTripId,
      user_id: targetUserId,
      status: 'active',
      is_public: false,
      clones_count: 0,
      total_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const originalDests = data.destinations.filter((d) => d.trip_id === originalTripId);
    const newDestinations: Destination[] = [];
    const newMissions: Mission[] = [];

    originalDests.forEach((od, idx) => {
      const newDestId = `dest-${Date.now()}-${idx}`;
      newDestinations.push({
        ...od,
        id: newDestId,
        trip_id: newTripId,
        status: idx === 0 ? 'unlocked' : 'locked',
        actual_spend: null,
        created_at: new Date().toISOString(),
      });

      const origMission = data.missions.find((m) => m.destination_id === od.id);
      if (origMission) {
        newMissions.push({
          ...origMission,
          id: `mission-${Date.now()}-${idx}`,
          destination_id: newDestId,
          created_at: new Date().toISOString(),
        });
      }
    });

    data.trips.push(newTrip);
    data.destinations.push(...newDestinations);
    data.missions.push(...newMissions);

    saveData(data);
    return { trip: newTrip, destinations: newDestinations };
  },

  /**
   * Get Explorers with their traveled quests, live quest status, and friendship status
   */
  getExplorers: (query?: string, currentUserId?: string): ExplorerProfile[] => {
    const data = readData();

    const SEEDED_EXPLORERS: ExplorerProfile[] = [
      {
        id: 'exp_aria_01',
        username: 'aria_nomad',
        display_name: 'Aria Vance',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=aria_nomad',
        bio: 'Coastal backpacker & tea scout. Mapping Kerala backwaters and silent cliffs.',
        badge: '💎 Cosmic Nomad',
        coins: 480,
        total_quests_completed: 4,
        created_at: '2026-08-10T12:00:00Z',
        updated_at: '2026-10-10T12:00:00Z',
        active_live_quest: {
          id: 'quest_malabar_01',
          title: 'Unmapped Malabar Drift: Canals & Red Cliffs',
          starting_location: 'Kochi to Varkala Corridor',
          vibe: '🌴 Coastal Mist',
          current_destination_name: 'Punnamada Canoe Village',
          current_stop_index: 2,
          total_stops: 3,
          budget_amount: 5500,
          companions_count: 2,
          started_at: '2026-10-10T08:30:00Z',
        },
        traveled_quests: [
          {
            id: 'tq_1',
            title: 'Fort Kochi Spice Wharfs & Bastions',
            starting_location: 'Fort Kochi, Kerala',
            vibe: 'Heritage Drift',
            stops_count: 3,
            cover_image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
            total_points: 350,
            completed_at: '2026-09-18T16:00:00Z',
            budget_amount: 3800,
          },
          {
            id: 'tq_2',
            title: 'Varkala Cliff Sunset Run',
            starting_location: 'North Cliff, Varkala',
            vibe: 'Ocean Serenity',
            stops_count: 2,
            cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
            total_points: 200,
            completed_at: '2026-08-25T19:30:00Z',
            budget_amount: 2400,
          },
        ],
      },
      {
        id: 'exp_meera_03',
        username: 'meera_wanders',
        display_name: 'Meera Sen',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=meera_wanders',
        bio: 'Mountain ridge trekker & wild elephant watcher in the Western Ghats.',
        badge: '🥇 Gold Explorer',
        coins: 340,
        total_quests_completed: 6,
        created_at: '2026-07-15T10:00:00Z',
        updated_at: '2026-10-10T14:00:00Z',
        active_live_quest: {
          id: 'quest_ghats_02',
          title: 'Misty Tea Highlands & Periyar River Canopy',
          starting_location: 'Western Ghats Ridge',
          vibe: '⛰️ Mountain Ridge',
          current_destination_name: 'Kolukkumalai High Ridge',
          current_stop_index: 1,
          total_stops: 3,
          budget_amount: 6200,
          companions_count: 1,
          started_at: '2026-10-11T02:00:00Z',
        },
        traveled_quests: [
          {
            id: 'tq_3',
            title: 'Silent Valley Rainforest Walk',
            starting_location: 'Palakkad, Kerala',
            vibe: 'Nature Sanctuary',
            stops_count: 4,
            cover_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            total_points: 480,
            completed_at: '2026-09-02T14:00:00Z',
            budget_amount: 4500,
          },
        ],
      },
      {
        id: 'exp_julian_05',
        username: 'julian_astro',
        display_name: 'Julian Ray',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=julian_astro',
        bio: 'Astronomer nomad. Stargazing ancient boulder empires and ruins.',
        badge: '🥈 Silver Earner',
        coins: 220,
        total_quests_completed: 3,
        created_at: '2026-09-01T08:00:00Z',
        updated_at: '2026-10-09T18:00:00Z',
        active_live_quest: {
          id: 'quest_hampi_03',
          title: 'Forgotten Vijayanagara & Boulder Sunsets',
          starting_location: 'Tungabhadra Boulder Basin',
          vibe: '🏛️ Ancient Ruins',
          current_destination_name: 'Matanga Hill Sunrise Peak',
          current_stop_index: 1,
          total_stops: 2,
          budget_amount: 4800,
          companions_count: 3,
          started_at: '2026-10-10T18:00:00Z',
        },
        traveled_quests: [
          {
            id: 'tq_4',
            title: 'Sanapur Coracle Crossing',
            starting_location: 'Sanapur Lake, Hampi',
            vibe: 'Granite Labyrinth',
            stops_count: 2,
            cover_image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
            total_points: 250,
            completed_at: '2026-08-11T17:00:00Z',
            budget_amount: 2200,
          },
        ],
      },
      {
        id: 'exp_kabir_07',
        username: 'kabir_expeditions',
        display_name: 'Kabir Das',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kabir_expeditions',
        bio: 'Budget solo nomad. Traveling on state buses, night trains & homestays.',
        badge: '🥇 Gold Explorer',
        coins: 390,
        total_quests_completed: 8,
        created_at: '2026-06-20T09:00:00Z',
        updated_at: '2026-10-08T11:00:00Z',
        active_live_quest: null,
        traveled_quests: [
          {
            id: 'tq_5',
            title: 'Gokarna Beach Trail Over Rocks',
            starting_location: 'Kudle to Paradise Beach',
            vibe: 'Coastal Hike',
            stops_count: 4,
            cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
            total_points: 400,
            completed_at: '2026-09-29T18:00:00Z',
            budget_amount: 3100,
          },
        ],
      },
    ];

    // Combine with real users in profiles
    const registeredExplorers: ExplorerProfile[] = data.profiles
      .filter((p) => p.id !== currentUserId)
      .map((p) => {
        const userTrips = data.trips.filter((t) => t.user_id === p.id);
        const activeTrip = userTrips.find((t) => t.status === 'active');
        const activeDests = activeTrip ? data.destinations.filter((d) => d.trip_id === activeTrip.id) : [];
        const currentDest = activeDests.find((d) => d.status === 'unlocked') || activeDests[0];

        const completedTrips = userTrips.filter((t) => t.status === 'completed');

        return {
          id: p.id,
          username: p.username,
          display_name: p.display_name || p.username,
          avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`,
          bio: 'Curious adventurer traveling real-world paths.',
          badge: '🥈 Silver Earner',
          coins: 150,
          total_quests_completed: completedTrips.length,
          created_at: p.created_at,
          updated_at: p.updated_at,
          active_live_quest: activeTrip && currentDest ? {
            id: activeTrip.id,
            title: activeTrip.public_title || activeTrip.starting_location_name,
            starting_location: activeTrip.starting_location_name,
            vibe: activeTrip.vibe || 'Adventure',
            current_destination_name: currentDest.name,
            current_stop_index: currentDest.sequence_number || 1,
            total_stops: activeDests.length || 3,
            budget_amount: activeTrip.budget_amount,
            companions_count: data.trip_companions.filter((tc) => tc.trip_id === activeTrip.id).length,
          } : null,
          traveled_quests: completedTrips.map((ct) => {
            const dests = data.destinations.filter((d) => d.trip_id === ct.id);
            return {
              id: ct.id,
              title: ct.public_title || ct.starting_location_name,
              starting_location: ct.starting_location_name,
              vibe: ct.vibe || 'Expedition',
              stops_count: dests.length,
              cover_image: dests[0]?.image_url || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
              total_points: ct.total_points || 300,
              completed_at: ct.updated_at,
              budget_amount: ct.budget_amount,
            };
          }),
        };
      });

    const allExplorers = [...SEEDED_EXPLORERS, ...registeredExplorers];

    // Compute friendship status for current user
    const withFriendStatus = allExplorers.map((exp) => {
      if (!currentUserId) return { ...exp, friendship_status: 'none' as const };
      const friendship = data.friendships.find(
        (f) =>
          (f.user_id === currentUserId && f.friend_id === exp.id) ||
          (f.user_id === exp.id && f.friend_id === currentUserId)
      );
      return {
        ...exp,
        friendship_status: (friendship ? friendship.status : 'none') as any,
      };
    });

    if (!query || !query.trim()) {
      return withFriendStatus;
    }

    const q = query.trim().toLowerCase();
    return withFriendStatus.filter(
      (e) =>
        e.username.toLowerCase().includes(q) ||
        (e.display_name && e.display_name.toLowerCase().includes(q)) ||
        (e.bio && e.bio.toLowerCase().includes(q))
    );
  },

  /**
   * Get single explorer profile
   */
  getExplorerProfile: (explorerId: string, currentUserId?: string): ExplorerProfile | null => {
    const list = demoStore.getExplorers(undefined, currentUserId);
    return list.find((e) => e.id === explorerId || e.username.toLowerCase() === explorerId.toLowerCase()) || null;
  },

  /**
   * Toggle or send friend request
   */
  sendFriendRequest: (userId: string, targetUserId: string): { status: string; message: string } => {
    if (userId === targetUserId) {
      throw new Error('Cannot send friend request to yourself');
    }
    const data = readData();
    const existingIndex = data.friendships.findIndex(
      (f) =>
        (f.user_id === userId && f.friend_id === targetUserId) ||
        (f.user_id === targetUserId && f.friend_id === userId)
    );

    if (existingIndex >= 0) {
      const existing = data.friendships[existingIndex];
      if (existing.status === 'pending') {
        // Toggle cancel
        data.friendships.splice(existingIndex, 1);
        saveData(data);
        return { status: 'none', message: 'Friend request cancelled' };
      }
      return { status: existing.status, message: 'Already connected' };
    }

    const newFriendship: Friendship = {
      id: `fr_${Date.now()}`,
      user_id: userId,
      friend_id: targetUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    data.friendships.push(newFriendship);
    saveData(data);
    return { status: 'pending', message: 'Friend request sent!' };
  },

  /**
   * Accept friend request
   */
  acceptFriendRequest: (userId: string, targetUserId: string): { status: string; message: string } => {
    const data = readData();
    const friendship = data.friendships.find(
      (f) =>
        (f.user_id === targetUserId && f.friend_id === userId) ||
        (f.user_id === userId && f.friend_id === targetUserId)
    );
    if (!friendship) {
      throw new Error('Friend request not found');
    }
    friendship.status = 'accepted';
    saveData(data);
    return { status: 'accepted', message: 'Friend request accepted!' };
  },

  /**
   * Join a live ongoing quest as co-traveler
   */
  joinLiveQuest: (userId: string, targetTripId: string): { success: boolean; tripId: string; message: string } => {
    const data = readData();

    // 1. Record companion
    const existingComp = data.trip_companions.find(
      (c) => c.trip_id === targetTripId && c.user_id === userId
    );
    if (!existingComp) {
      data.trip_companions.push({
        id: `comp_${Date.now()}`,
        trip_id: targetTripId,
        user_id: userId,
        role: 'co_traveler',
        joined_at: new Date().toISOString(),
      });
      saveData(data);
    }

    // 2. If it's a seeded trip or another user's trip, create a companion clone for the current user
    // so they have it directly interactive in their own dashboard & adventure trail
    const existingUserTrip = data.trips.find((t) => t.id === targetTripId && t.user_id === userId);
    if (existingUserTrip) {
      return {
        success: true,
        tripId: targetTripId,
        message: 'Resuming your active trail!',
      };
    }

    // Clone target trip for live co-traveling
    const cloned = demoStore.cloneTrip(targetTripId, userId);
    const activeTripId = cloned ? cloned.trip.id : targetTripId;

    return {
      success: true,
      tripId: activeTripId,
      message: 'Joined live quest! Synchronized to active checkpoints.',
    };
  },
};
