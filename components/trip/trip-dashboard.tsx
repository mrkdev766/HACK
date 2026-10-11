'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Plus,
  Loader2,
  LogOut,
  Coins,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AppCache } from '@/lib/cache/app-cache';
import { PullToRefresh } from '@/components/layout/pull-to-refresh';
import { TravelMinimalDrawing } from '@/components/trip/travel-minimal-drawing';
import { CoinVaultModal } from '@/components/rewards/coin-vault-modal';

interface TripSummaryItem {
  id: string;
  starting_location_name: string;
  budget_amount: number;
  currency: string;
  duration_value: number;
  duration_unit: string;
  total_points: number;
  status: 'active' | 'completed' | 'planning';
  created_at: string;
  destinations_count: number;
  completed_destinations_count: number;
  progress_percent: number;
  cover_image: string;
  current_destination_name?: string;
}

export function TripDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Coins & Badge Tier State
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wanderly_coins');
        return saved ? parseInt(saved, 10) : 250;
      } catch {
        return 250;
      }
    }
    return 250;
  });

  const [activeBadge, setActiveBadge] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wanderly_active_badge');
        return saved || 'Silver Coin Earner';
      } catch {
        return 'Silver Coin Earner';
      }
    }
    return 'Silver Coin Earner';
  });

  const [showCoinVault, setShowCoinVault] = useState(false);

  const handleCoinsChange = (newCoins: number) => {
    setCoins(newCoins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wanderly_coins', newCoins.toString());
    }
  };

  const handleBadgeChange = (newBadge: string) => {
    setActiveBadge(newBadge);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wanderly_active_badge', newBadge);
    }
  };

  // Instant 0ms cache retrieval
  const [trips, setTrips] = useState<TripSummaryItem[]>(() => {
    return AppCache.get<TripSummaryItem[]>(`user_trips_${user?.id || 'guest'}`) || [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = AppCache.get<TripSummaryItem[]>(`user_trips_${user?.id || 'guest'}`);
    return !cached || cached.length === 0;
  });

  const loadTrips = useCallback(async (isManualRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        headers: {
          'x-wanderly-user-id': user?.id || '',
        },
      });
      const data = await res.json();
      if (data.trips) {
        setTrips(data.trips);
        AppCache.set(`user_trips_${user.id}`, data.trips);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadTrips();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, loadTrips]);

  const DEFAULT_COVERS = [
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80', // Kerala / South India
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Mountains
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Coast
  ];
  const [brokenCovers, setBrokenCovers] = useState<Record<string, boolean>>({});

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Pull-to-Refresh Container */}
      <PullToRefresh onRefresh={() => loadTrips(true)} className="pb-6">
        {/* Clean Header Bar */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 shadow-xs">
              <img
                src={
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'wanderer'}`
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Hello,</p>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">
                {user?.display_name || user?.username || 'Wanderer'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Coins & Badge Tier Pill */}
            <button
              onClick={() => setShowCoinVault(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all shadow-xs cursor-pointer group active:scale-95"
              title="Open Coin Vault & Claim Rewards"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black text-slate-800 font-mono">
                {coins}
              </span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded-full">
                {activeBadge.includes('Silver') ? '🥈 Silver' : activeBadge.includes('Gold') ? '🥇 Gold' : activeBadge.includes('Cosmic') || activeBadge.includes('Diamond') ? '💎 Cosmic' : '🥉 Bronze'}
              </span>
            </button>

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              title="Log Out"
              className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cool Minimal Hero Banner Card */}
        <div className="px-5 pt-3">
          <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] text-white rounded-[26px] p-6 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.35)] relative overflow-hidden border border-white/10 group">
            {/* Minimal Ambient Glows */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight text-white leading-tight">
                  Where to next?
                </h2>
                <p className="text-xs font-sans text-slate-300/90 mt-1.5 leading-relaxed max-w-[300px]">
                  Explore curated mystery stops tailored to your vibe and pace.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/plan"
                  className="w-full h-11 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(52,211,153,0.3)] hover:shadow-[0_8px_25px_rgba(52,211,153,0.4)] active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Plan Route</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trips List */}
        <div className="px-5 pt-7">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-[0.18em]">
              Your Expeditions
            </h3>
            {trips.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {trips.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs">Loading trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white rounded-[22px] p-8 text-center shadow-sm border border-slate-200/70 flex flex-col items-center">
              <Compass className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-800">No trips yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                Plan a route to start exploring.
              </p>
              <Link
                href="/plan"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Start</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {trips.map((trip) => {
                const isBroken = brokenCovers[trip.id];
                const coverSrc = isBroken || !trip.cover_image || !trip.cover_image.startsWith('http')
                  ? DEFAULT_COVERS[0]
                  : trip.cover_image;

                return (
                  <div
                    key={trip.id}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="group bg-white rounded-[22px] overflow-hidden shadow-sm border border-slate-200/80 cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/40 active:scale-98"
                  >
                    <div className="relative w-full h-36 bg-slate-900">
                      <Image
                        src={coverSrc}
                        alt={trip.starting_location_name}
                        fill
                        unoptimized
                        onError={() => setBrokenCovers((prev) => ({ ...prev, [trip.id]: true }))}
                        className="object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                      <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between text-white">
                        <div>
                          <h4 className="text-base font-serif font-medium truncate tracking-tight text-white drop-shadow-xs">
                            {trip.starting_location_name}
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5 font-medium">
                            {trip.duration_value} {trip.duration_unit} • {trip.destinations_count} stops
                          </p>
                        </div>

                        <span className="text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25">
                          {trip.status === 'completed' ? 'Finished' : `${trip.completed_destinations_count}/${trip.destinations_count} stops`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stunning Minimalist Travel Drawing on Canvas */}
          <TravelMinimalDrawing />
        </div>
      </PullToRefresh>

      {/* Floating Bottom Navigation */}
      <BottomNav tripId={trips[0]?.id} />

      {/* Coin Vault & Badges Claim Modal */}
      <CoinVaultModal
        isOpen={showCoinVault}
        onClose={() => setShowCoinVault(false)}
        coins={coins}
        onCoinsChange={handleCoinsChange}
        activeBadge={activeBadge}
        onBadgeChange={handleBadgeChange}
      />
    </div>
  );
}
