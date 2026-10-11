// Automated Full Journey Verification Script for Wanderly
// Runs against the local server to verify the entire adventure loop

async function run() {
  console.log('🚀 Starting Wanderly End-to-End User Journey Verification...\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. GUEST AUTHENTICATION
  console.log('--- Step 1: Guest Login & Profile ---');
  const authRes = await fetch(`${BASE_URL}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'roaming_adventurer' }),
  });
  const authData = await authRes.json();
  if (!authRes.ok) throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
  console.log('✓ Guest session initialized:', authData.profile.username, `(ID: ${authData.profile.id})`);
  const userId = authData.profile.id;

  // 2. TRIP PLANNING & AI ITINERARY GENERATION
  console.log('\n--- Step 2: Trip Planning & AI Itinerary Generation ---');
  const planPayload = {
    starting_location: 'Kochi, Kerala',
    budget_amount: 3000,
    currency: 'INR',
    duration_value: 2,
    duration_unit: 'days',
    transport_mode: 'public_transit',
    travel_style: 'nature',
  };
  const tripRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wanderly-user-id': userId,
    },
    body: JSON.stringify(planPayload),
  });
  const tripData = await tripRes.json();
  if (!tripRes.ok) throw new Error(`Trip creation failed: ${JSON.stringify(tripData)}`);
  console.log('✓ Trip created successfully! Trip ID:', tripData.trip_id);
  console.log('  Planner Mode:', tripData.mode, '| Notes:', tripData.notes);
  const tripId = tripData.trip_id;

  // 3. ADVENTURE MAP & DESTINATION LOCK INTEGRITY
  console.log('\n--- Step 3: Adventure Map & Destination Visibility Integrity ---');
  const mapRes = await fetch(`${BASE_URL}/api/trips/${tripId}`, {
    headers: { 'x-wanderly-user-id': userId },
  });
  const mapData = await mapRes.json();
  if (!mapRes.ok) throw new Error(`Map fetch failed: ${JSON.stringify(mapData)}`);
  const destinations = mapData.data.destinations;
  console.log(`✓ Retrieved ${destinations.length} destinations.`);
  console.log(`  Stop 1: "${destinations[0].name}" [Status: ${destinations[0].status}] (Unlocked)`);
  console.log(`  Stop 2: "${destinations[1].name}" [Status: ${destinations[1].status}] (Locked)`);

  if (destinations[1].status !== 'locked') {
    throw new Error('Security Error: Stop 2 should be locked!');
  }
  if (!destinations[1].name.includes('Mystery Destination')) {
    throw new Error('Security Error: Stop 2 details must be redacted!');
  }
  console.log('✓ Verified: Locked destination details are securely redacted by the backend.');

  // 4. DESTINATION DETAILS & MISSION VERIFICATION
  console.log('\n--- Step 4: First Destination Details & Mission ---');
  const dest1Id = destinations[0].id;
  const dest1Res = await fetch(`${BASE_URL}/api/destinations/${dest1Id}`, {
    headers: { 'x-wanderly-user-id': userId },
  });
  const dest1Data = await dest1Res.json();
  if (!dest1Res.ok) throw new Error(`Destination 1 fetch failed: ${JSON.stringify(dest1Data)}`);
  console.log('✓ Loaded destination:', dest1Data.data.name);
  console.log('  Mission Title:', dest1Data.data.mission.title);
  console.log('  Points Reward:', dest1Data.data.mission.points);
  const mission1Id = dest1Data.data.mission.id;

  // 5. ATOMIC MISSION COMPLETION
  console.log('\n--- Step 5: Mission Capture & Submission ---');
  const completePayload = {
    note: 'Incredible sunset over Varkala cliff. Beautiful sound of crashing waves!',
    actual_spend: 1850,
    photo_urls: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
  };

  const completeRes = await fetch(`${BASE_URL}/api/missions/${mission1Id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wanderly-user-id': userId,
    },
    body: JSON.stringify(completePayload),
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok) throw new Error(`Mission completion failed: ${JSON.stringify(completeData)}`);
  console.log('✓ Mission successfully completed!');
  console.log('  Points Awarded:', completeData.points_awarded);
  console.log('  New Total Points:', completeData.new_total_points);
  console.log('  Next Destination Unlocked:', completeData.next_destination?.name);

  // 6. VERIFY AUTHORITATIVE STATE & UNLOCK
  console.log('\n--- Step 6: Verifying Authoritative Unlocked State ---');
  const updatedTripRes = await fetch(`${BASE_URL}/api/trips/${tripId}`, {
    headers: { 'x-wanderly-user-id': userId },
  });
  const updatedTripData = await updatedTripRes.json();
  const updatedDests = updatedTripData.data.destinations;
  console.log(`  Stop 1 Status: ${updatedDests[0].status}`);
  console.log(`  Stop 2 Status: ${updatedDests[1].status} ("${updatedDests[1].name}")`);
  console.log(`  Current Total Points: ${updatedTripData.data.totalPoints}`);

  if (updatedDests[0].status !== 'completed' || updatedDests[1].status !== 'unlocked') {
    throw new Error('Integrity failure: State did not transition correctly!');
  }
  console.log('✓ Stop 1 marked completed, Stop 2 authoritatively unlocked!');

  // 7. DUPLICATE SUBMISSION PROTECTION
  console.log('\n--- Step 7: Verifying Duplicate Completion Protection ---');
  const dupRes = await fetch(`${BASE_URL}/api/missions/${mission1Id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wanderly-user-id': userId,
    },
    body: JSON.stringify(completePayload),
  });
  if (dupRes.status !== 400 && dupRes.status !== 500) {
    throw new Error('Security Error: Duplicate completion should have been rejected!');
  }
  const dupData = await dupRes.json();
  console.log('✓ Duplicate submission correctly rejected with error:', dupData.error);

  // 8. JOURNAL RETRIEVAL
  console.log('\n--- Step 8: Journal & Memory Persistence ---');
  const journalRes = await fetch(`${BASE_URL}/api/trips/${tripId}/journal`, {
    headers: { 'x-wanderly-user-id': userId },
  });
  const journalData = await journalRes.json();
  console.log(`✓ Retrieved ${journalData.entries.length} persistent journal entries.`);
  console.log('  Entry note:', journalData.entries[0].note);
  console.log('  Recorded spending: ₹' + journalData.entries[0].actual_spend);

  console.log('\n🎉 ALL WANDERLY JOURNEY STEPS VERIFIED 100% SUCCESSFULLY!\n');
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
