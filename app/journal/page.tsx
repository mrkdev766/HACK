'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Wallet,
  Globe,
  Sparkles,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Compass,
  Loader2,
} from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAuth } from '@/features/auth/auth-context';
import { PublishQuestModal } from '@/components/discovery/publish-quest-modal';
import { PullToRefresh } from '@/components/layout/pull-to-refresh';
import { Trip } from '@/types/database';

interface EnrichedTrip extends Trip {
  destinations_count: number;
  completed_destinations_count: number;
  progress_percent: number;
  cover_image: string;
  current_destination_name?: string;
  is_public?: boolean;
  public_title?: string | null;
  public_description?: string | null;
  vibe?: string | null;
  clones_count?: number;
}

export default function GlobalJournalPage() {
  const router = useRouter();
  const { user, activeTripId } = useAuth();

  const [trips, setTrips] = useState<EnrichedTrip[]>([]);
  const [filter, setFilter] = useState<'completed' | 'all'>('completed');
  const [isLoading, setIsLoading] = useState(true);

  // Modal publish state
  const [selectedTripToPublish, setSelectedTripToPublish] = useState<EnrichedTrip | null>(null);
  const [publishDestinations, setPublishDestinations] = useState<any[]>([]);
  const [isPreparingPublish, setIsPreparingPublish] = useState(false);

  const loadTrips = useCallback(async () => {
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
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleOpenPublish = async (trip: EnrichedTrip) => {
    setIsPreparingPublish(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        headers: { 'x-wanderly-user-id': user?.id || '' },
      });
      const data = await res.json();
      if (data.data?.destinations) {
        setPublishDestinations(
          data.data.destinations.map((d: any) => ({
            id: d.id,
            name: d.name,
            actual_spend: d.actual_spend ?? d.estimated_cost,
            estimated_cost: d.estimated_cost,
            image_url: d.image_url,
            custom_notes: d.custom_notes,
          }))
        );
        setSelectedTripToPublish(trip);
      }
    } catch {
      setSelectedTripToPublish(trip);
    } finally {
      setIsPreparingPublish(false);
    }
  };

  const completedTrips = trips.filter(
    (t) => t.status === 'completed' || t.completed_destinations_count >= t.destinations_count
  );
  const displayedTrips = filter === 'completed' ? completedTrips : trips;

  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
        {/* Pull To Refresh Scrollable Body */}
        <PullToRefresh onRefresh={loadTrips} className="flex-1 overflow-y-auto">
          {/* Clean Header Bar */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                Travel Journals
              </h1>

              <button
                onClick={() => router.push('/discover')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Discover</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Relive your completed trails, photo archives, and published quests.
            </p>

            {/* Filter Toggle Pills */}
            <div className="flex justify-between items-center gap-2 mt-4">
              <div className="bg-slate-200/80 border border-slate-300/50 p-1 rounded-full flex flex-1 max-w-[240px] shadow-inner items-center">
                <button
                  onClick={() => setFilter('completed')}
                  className={`flex-1 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    filter === 'completed'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                  }`}
                >
                  Completed ({completedTrips.length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                  }`}
                >
                  All ({trips.length})
                </button>
              </div>

              <button
                onClick={() => router.push('/plan')}
                className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer"
                title="Start New Adventure"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="px-5 pt-1 pb-24 space-y-4">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs font-semibold">Opening journal vaults...</span>
              </div>
            ) : displayedTrips.length === 0 ? (
              /* Minimalist Empty State */
              <div className="py-12 bg-white/70 rounded-[26px] border border-slate-200/80 p-6 text-center text-slate-500 flex flex-col items-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                  <BookOpen className="w-7 h-7 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {filter === 'completed' ? 'No Completed Journeys Yet' : 'No Adventures Planned'}
                </h3>
                <p className="text-xs text-slate-400 max-w-[240px] mt-1 mb-5 leading-relaxed">
                  {filter === 'completed'
                    ? 'Finish your destination missions along the mystery trail to unlock memories and photo albums!'
                    : 'Embark on an expedition to begin capturing memories at every hidden stop!'}
                </p>

                <div className="flex flex-col gap-2 w-full max-w-[210px]">
                  <button
                    onClick={() => router.push('/plan')}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Plan New Route</span>
                  </button>
                  <button
                    onClick={() => router.push('/discover')}
                    className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Explore Community Quests</span>
                  </button>
                </div>
              </div>
            ) : (
              displayedTrips.map((trip) => {
                const isCompleted =
                  trip.status === 'completed' ||
                  trip.completed_destinations_count >= trip.destinations_count;

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-[26px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80 group flex flex-col"
                  >
                    {/* Cover Banner */}
                    <div className="relative w-full h-40 bg-slate-900 overflow-hidden">
                      <Image
                        src={trip.cover_image}
                        alt={trip.starting_location_name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 text-emerald-300 backdrop-blur-md border border-white/10 shadow-xs">
                          {trip.vibe || '🌴 Mystery Trail'}
                        </span>

                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                            <Clock className="w-3 h-3 stroke-[3]" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Title & Stops Overlay */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="text-base font-extrabold leading-snug tracking-tight drop-shadow-sm truncate">
                          {trip.public_title || `${trip.starting_location_name} Mystery Trail`}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-300 text-[11px]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {trip.starting_location_name}
                          </span>
                          <span>•</span>
                          <span>
                            {trip.completed_destinations_count}/{trip.destinations_count} Stops Visited
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trip Metadata & Actions */}
                    <div className="p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                        <div className="flex items-center gap-1 font-semibold">
                          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Budget: ₹{trip.budget_amount?.toLocaleString() || '3,500'}</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 font-mono">
                          {trip.duration_value} {trip.duration_unit || 'Days'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => router.push(`/trip/${trip.id}/journal`)}
                          className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Journal</span>
                        </button>

                        {isCompleted ? (
                          <button
                            onClick={() => handleOpenPublish(trip)}
                            disabled={isPreparingPublish}
                            className="h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-xs disabled:opacity-75"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{trip.is_public ? 'Update Public' : 'Publish Quest'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/trip/${trip.id}`)}
                            className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                          >
                            <span>Resume Trail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PullToRefresh>

        {/* Publish Quest Modal */}
        {selectedTripToPublish && (
          <PublishQuestModal
            isOpen={Boolean(selectedTripToPublish)}
            onClose={() => setSelectedTripToPublish(null)}
            tripId={selectedTripToPublish.id}
            tripTitle={
              selectedTripToPublish.public_title ||
              `${selectedTripToPublish.starting_location_name} Mystery Trail`
            }
            destinations={publishDestinations}
            defaultVibe={selectedTripToPublish.vibe || '🌴 Coastal Mist'}
            onPublished={(newTitle) => {
              setTrips((prev) =>
                prev.map((t) =>
                  t.id === selectedTripToPublish.id
                    ? { ...t, is_public: true, public_title: newTitle }
                    : t
                )
              );
              router.push('/discover');
            }}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav tripId={activeTripId || undefined} />
      </div>
    </MobileShell>
  );
}
