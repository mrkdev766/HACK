'use client';

import React, { useEffect, useState } from 'react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { ProfileView } from '@/components/profile/profile-view';
import { useAuth } from '@/features/auth/auth-context';

export default function GlobalProfilePage() {
  const { user, activeTripId } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await fetch('/api/trips', {
          headers: { 'x-wanderly-user-id': user?.id || '' },
        });
        const data = await res.json();
        if (data.trips) {
          setTrips(data.trips);
        }
      } catch {
        // ignore
      }
    }
    if (user?.id) {
      loadTrips();
    }
  }, [user?.id]);

  const totalPoints = trips.reduce((sum, t) => sum + (t.total_points || 0), 0);
  const totalStops = trips.reduce((sum, t) => sum + (t.completed_destinations_count || 0), 0);

  return (
    <MobileShell theme="cool">
      <ProfileView
        tripId={activeTripId || trips[0]?.id}
        trips={trips}
        totalPoints={totalPoints}
        completedStops={totalStops}
      />
    </MobileShell>
  );
}
