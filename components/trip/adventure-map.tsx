'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, MapPin, Navigation, History } from 'lucide-react';
import { ClientTripDetail } from '@/types/trip';
import { AdventureTrail } from './adventure-trail';
import { AdventureHistoryModal } from './adventure-history-modal';

interface AdventureMapProps {
  tripDetail: ClientTripDetail;
  username: string;
  avatarUrl?: string | null;
}

export function AdventureMap({ tripDetail, username, avatarUrl }: AdventureMapProps) {
  const [viewMode, setViewMode] = useState<'trail' | 'interactive'>('trail');
  const [showHistory, setShowHistory] = useState(false);

  const { trip, destinations, totalPoints } = tripDetail;

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0B0F19] text-white">
      {/* Top Header Bar */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-slate-900/90 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-emerald-500/80 shadow-md bg-slate-800 shrink-0">
            <img
              src={
                avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'adventurer'}`
              }
              alt={username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">
              {username || 'Wanderer'}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Live Itinerary
            </p>
          </div>
        </div>

        {/* Action Controls: Small Tiny History Button + Stop Progress Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-white text-[10px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="View Past Adventures"
          >
            <History className="w-3 h-3 text-emerald-400" />
            <span>History</span>
          </button>

          {/* Stop Progress Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
            {destinations.filter((d) => d.status === 'completed').length} of {destinations.length} stops
          </div>
        </div>
      </div>

      {/* Mode Toggle Pills (Trail View vs Satellite/Coordinates) */}
      <div className="px-5 py-2 flex items-center justify-between bg-slate-900/60 text-xs border-b border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[180px]">{trip.starting_location_name}</span>
        </div>

        <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('trail')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              viewMode === 'trail'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trail
          </button>
          <button
            onClick={() => setViewMode('interactive')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              viewMode === 'interactive'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Route
          </button>
        </div>
      </div>

      {/* Main Map View */}
      {viewMode === 'trail' ? (
        <AdventureTrail
          tripId={trip.id}
          destinations={destinations}
          totalPoints={totalPoints}
        />
      ) : (
        <div className="flex-1 p-5 flex flex-col gap-4 bg-[#0B0F19] overflow-y-auto">
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              Route Stops
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {trip.duration_value} {trip.duration_unit} • {trip.transport_mode.replace('_', ' ')}
            </p>
            <div className="space-y-3">
              {destinations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {d.sequence_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{d.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {d.status === 'locked'
                        ? 'Locked • Unlocks upon reaching this stop'
                        : `Lat: ${d.latitude?.toFixed(4) || '8.7379'}, Long: ${d.longitude?.toFixed(4) || '76.7163'}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Adventures History Modal */}
      <AdventureHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        currentTripId={trip.id}
      />
    </div>
  );
}
