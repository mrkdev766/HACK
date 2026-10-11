'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  Map,
  Share2,
  BookOpen,
  CheckCircle,
  Clock,
  Wallet,
  Trophy,
  Home,
  Globe,
} from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { ClientTripDetail, MissionCompletionResponse } from '@/types/trip';
import { useAuth } from '@/features/auth/auth-context';
import { PublishQuestModal } from '@/components/discovery/publish-quest-modal';

export default function MissionCompletePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [completionResult, setCompletionResult] = useState<MissionCompletionResponse | null>(null);
  const [tripDetail, setTripDetail] = useState<ClientTripDetail | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#087F5B', '#E8B85A', '#D5E5D8', '#FFFFFF'],
      });
    } catch {
      // ignore
    }

    // Read stored completion payload
    const stored = sessionStorage.getItem('wanderly_completion_result');
    if (stored) {
      try {
        setCompletionResult(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    // Fetch refreshed trip detail
    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          headers: { 'x-wanderly-user-id': user?.id || '' },
        });
        const data = await res.json();
        if (data.data) {
          setTripDetail(data.data);
        }
      } catch {
        // ignore
      }
    }
    if (tripId) loadTrip();
  }, [tripId, user?.id]);

  const isFinalTripComplete = completionResult?.trip_completed || tripDetail?.isAllCompleted;
  const pointsAwarded = completionResult?.points_awarded || 100;
  const nextDest = completionResult?.next_destination || tripDetail?.destinations.find((d) => d.status === 'unlocked');

  // If this was the final destination, show Screen 10 (Trip Completed!)
  if (isFinalTripComplete) {
    return (
      <MobileShell theme="cream">
        <div className="flex-1 flex flex-col bg-[#F8FAFC] relative overflow-y-auto">
          {/* Scenic Full Background with Sunset */}
          <div className="relative w-full h-80 shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
              alt="Trip Completed"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8FAFC]" />

            <div className="absolute top-12 left-6 right-6 text-center text-white">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                Itinerary Complete
              </span>
              <h2 className="text-2xl font-bold font-display mt-0.5">
                Journey Finished
              </h2>
            </div>
          </div>

          {/* Completion Summary Card */}
          <div className="px-5 -mt-20 z-10 flex flex-col gap-5 pb-8">
            <div className="bg-white rounded-[26px] p-6 shadow-2xl border border-slate-200/80 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200/60">
                <CheckCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h1 className="text-xl font-bold text-ink font-display">
                All Stops Completed
              </h1>
              <p className="text-xs text-muted mt-0.5">
                All itinerary destinations reached and documented.
              </p>

              {/* Stats 3 Columns */}
              <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-black/5">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-ink">
                    {tripDetail?.completedDestinationsCount || 3}
                  </span>
                  <span className="text-[10px] font-semibold text-muted uppercase mt-0.5">Stops</span>
                </div>
                <div className="flex flex-col items-center border-x border-black/5">
                  <span className="text-xl font-bold text-action">
                    {tripDetail?.totalPoints || 450}
                  </span>
                  <span className="text-[10px] font-semibold text-muted uppercase mt-0.5">Points</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-ink">
                    {tripDetail?.trip.duration_value || 2}
                  </span>
                  <span className="text-[10px] font-semibold text-muted uppercase mt-0.5">Days</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 mt-5">
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-full text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Publish Quest to Discovery</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/trip/${tripId}/journal`)}
                    className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Journal</span>
                  </button>

                  <button
                    onClick={() => router.push('/dashboard')}
                    className="h-11 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MobileShell>
    );
  }

  // Intermediate Mission Complete Screen
  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col bg-[#F8FAFC] px-6 py-8 overflow-y-auto items-center justify-between text-center">
        {/* Celebration Top Area */}
        <div className="flex flex-col items-center w-full pt-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
            <CheckCircle className="w-8 h-8 stroke-[2]" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">
            Stop Completed
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Milestone verified. Next stop unlocked.
          </p>

          <div className="mt-3 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-600">+{pointsAwarded} points</span>
          </div>
        </div>

        {/* Next Destination Unlocked Card */}
        {nextDest && (
          <div className="w-full my-6 bg-white rounded-[22px] p-4 shadow-card border border-slate-200/80 text-left flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next Stop Unlocked</span>
            </div>

            <div
              onClick={() => router.push(`/trip/${tripId}/place/${nextDest.id}`)}
              className="flex items-center gap-3.5 cursor-pointer group"
            >
              <div className="relative w-14 h-14 rounded-[14px] overflow-hidden shrink-0 border border-slate-200/80 shadow-xs">
                <Image
                  src={nextDest.image_url}
                  alt={nextDest.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                  {nextDest.sequence_number}. {nextDest.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {nextDest.estimated_travel_minutes
                    ? `${Math.round(nextDest.estimated_travel_minutes / 60 * 10) / 10 || 2} hrs`
                    : '2 days'}{' '}
                  • ₹{nextDest.estimated_cost?.toLocaleString() || '2,000'}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="w-full pb-4">
          <button
            onClick={() => router.push(`/trip/${tripId}`)}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all rounded-full text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Map className="w-4 h-4" />
            <span>View Map</span>
          </button>
        </div>

        {tripDetail && (
          <PublishQuestModal
            isOpen={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            tripId={tripId}
            tripTitle={
              tripDetail.trip.public_title ||
              `${tripDetail.trip.starting_location_name || 'Mystery'} Expedition`
            }
            destinations={tripDetail.destinations.map((d) => ({
              id: d.id,
              name: d.name,
              actual_spend: d.actual_spend ?? d.estimated_cost,
              estimated_cost: d.estimated_cost,
              image_url: d.image_url,
              custom_notes: d.custom_notes,
            }))}
            defaultVibe={tripDetail.trip.vibe || '🌴 Coastal Mist'}
            onPublished={() => {
              router.push('/discover');
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}
