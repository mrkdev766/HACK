'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MobileShell } from '@/components/layout/mobile-shell';
import { ProfileView } from '@/components/profile/profile-view';
import { useAuth } from '@/features/auth/auth-context';
import { ClientTripDetail } from '@/types/trip';

export default function TripProfilePage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [tripDetail, setTripDetail] = useState<ClientTripDetail | null>(null);
  const [allTrips, setAllTrips] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const headers = { 'x-wanderly-user-id': user?.id || '' };
        const [tripRes, tripsRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`, { headers }),
          fetch('/api/trips', { headers }),
        ]);

        const tripData = await tripRes.json();
        const tripsData = await tripsRes.json();

        if (tripData.data) {
          setTripDetail(tripData.data);
        }
        if (tripsData.trips) {
          setAllTrips(tripsData.trips);
        }
      } catch {
        // ignore
      }
    }
    if (tripId && user?.id) {
      loadData();
    }
  }, [tripId, user?.id]);

  const tripsToPass = allTrips.length > 0 
    ? allTrips 
    : tripDetail?.trip 
      ? [tripDetail.trip] 
      : [];

  const totalPoints = allTrips.length > 0
    ? allTrips.reduce((sum, t) => sum + (t.total_points || 0), 0)
    : (tripDetail?.totalPoints ?? 0);

  const completedStops = allTrips.length > 0
    ? allTrips.reduce((sum, t) => sum + (t.completed_destinations_count || 0), 0)
    : (tripDetail?.completedDestinationsCount ?? 0);

  return (
    <MobileShell theme="cool">
      <ProfileView
        tripId={tripId}
        trips={tripsToPass}
        totalPoints={totalPoints}
        completedStops={completedStops}
      />
    </MobileShell>
  );
}
