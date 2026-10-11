'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  History,
  X,
  Compass,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { AppCache } from '@/lib/cache/app-cache';

interface TripItem {
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
  cover_image: string;
}

interface AdventureHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTripId: string;
}

export function AdventureHistoryModal({
  isOpen,
  onClose,
  currentTripId,
}: AdventureHistoryModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [trips, setTrips] = useState<TripItem[]>(() => {
    return AppCache.get<TripItem[]>(`user_trips_${user?.id || 'guest'}`) || [];
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    async function loadTrips() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/trips', {
          headers: {
            'x-wanderly-user-id': user?.id || '',
          },
        });
        const data = await res.json();
        if (data.trips) {
          setTrips(data.trips);
          AppCache.set(`user_trips_${user?.id}`, data.trips);
        }
      } catch (err) {
        console.error('Failed to load past adventures:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTrips();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleSelectTrip = (tripId: string) => {
    onClose();
    if (tripId !== currentTripId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wanderly_active_trip_id', tripId);
      }
      router.push(`/trip/${tripId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-[440px] bg-[#0F172A] border border-slate-800 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Adventure History
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {trips.length} {trips.length === 1 ? 'Expedition' : 'Expeditions'} recorded
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trips List Area */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {isLoading && trips.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs">Fetching past trails...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center px-4">
              <Compass className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-300">No Past Adventures Found</p>
              <p className="text-[11px] text-slate-500 mt-1 mb-4">
                You are currently exploring your first quest!
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/plan');
                }}
                className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-emerald-400"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Plan Another Trip</span>
              </button>
            </div>
          ) : (
            trips.map((trip) => {
              const isCurrent = trip.id === currentTripId;
              const isCompleted = trip.status === 'completed';

              return (
                <div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60">
                      <Image
                        src={
                          trip.cover_image ||
                          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={trip.starting_location_name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[0.5px]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {trip.starting_location_name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                          {trip.completed_destinations_count || 0}/{trip.destinations_count || 0} stops
                        </span>
                        <span>•</span>
                        <span>{trip.duration_value} {trip.duration_unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action / Status */}
                  <div className="shrink-0 flex items-center gap-1 text-xs">
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-emerald-400">
                        Viewing
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 flex items-center gap-0.5">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400">
            Wanderly Archive • Stored in cloud
          </p>
          <button
            onClick={() => {
              onClose();
              router.push('/plan');
            }}
            className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>New Route</span>
          </button>
        </div>
      </div>
    </div>
  );
}
