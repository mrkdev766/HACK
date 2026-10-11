'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AdventureMap } from '@/components/trip/adventure-map';
import { ClientTripDetail } from '@/types/trip';
import { useAuth } from '@/features/auth/auth-context';
import { AppCache } from '@/lib/cache/app-cache';
import { PullToRefresh } from '@/components/layout/pull-to-refresh';

export default function TripAdventurePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  // Instant 0ms cache retrieval
  const [tripDetail, setTripDetail] = useState<ClientTripDetail | null>(() => {
    return AppCache.get<ClientTripDetail>(`trip_detail_${tripId}`) || null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = AppCache.get<ClientTripDetail>(`trip_detail_${tripId}`);
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(
    async (isManualRefresh = false) => {
      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          headers: {
            'x-wanderly-user-id': user?.id || '',
          },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load trip');
        }

        setTripDetail(data.data);
        AppCache.set(`trip_detail_${tripId}`, data.data);
        setError(null);
      } catch (err: unknown) {
        if (!tripDetail) {
          const msg = err instanceof Error ? err.message : 'Error loading adventure';
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [tripId, user?.id, tripDetail]
  );

  useEffect(() => {
    if (tripId) {
      // Revalidate in background without blocking UI
      fetchTrip();
    }
  }, [tripId, fetchTrip]);

  if (isLoading) {
    return (
      <MobileShell theme="dark">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white bg-[#0B0F19]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-400">Loading Adventure Map...</p>
        </div>
      </MobileShell>
    );
  }

  if (error || !tripDetail) {
    return (
      <MobileShell theme="dark">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white bg-[#0B0F19]">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          <h2 className="text-base font-bold text-white mb-1">Trip Not Found</h2>
          <p className="text-xs text-slate-400 mb-5 max-w-xs">{error || 'Could not locate trip.'}</p>
          <button
            onClick={() => router.push('/plan')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-full"
          >
            Create New Trip
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell theme="dark">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0F19]">
        <PullToRefresh onRefresh={() => fetchTrip(true)}>
          <AdventureMap
            tripDetail={tripDetail}
            username={user?.display_name || user?.username || 'Wanderer'}
            avatarUrl={user?.avatar_url}
          />
        </PullToRefresh>
        <BottomNav tripId={tripId} />
      </div>
    </MobileShell>
  );
}
