'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  UserPlus,
  UserCheck,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Zap,
  CheckCircle2,
  Share2,
  Users,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { ExplorerProfile, TraveledQuest } from '@/types/database';
import { useAuth } from '@/features/auth/auth-context';

interface ExplorerProfileModalProps {
  explorer: ExplorerProfile | null;
  onClose: () => void;
  onFriendStatusChange?: (explorerId: string, newStatus: string) => void;
}

export function ExplorerProfileModal({
  explorer,
  onClose,
  onFriendStatusChange,
}: ExplorerProfileModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [friendStatus, setFriendStatus] = useState<string>(
    explorer?.friendship_status || 'none'
  );
  const [isUpdatingFriend, setIsUpdatingFriend] = useState(false);
  const [isJoiningQuest, setIsJoiningQuest] = useState(false);
  const [activeTab, setActiveTab] = useState<'traveled' | 'live'>('traveled');

  if (!explorer) return null;

  const handleToggleFriend = async () => {
    try {
      setIsUpdatingFriend(true);
      const res = await fetch('/api/explorers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
        body: JSON.stringify({
          action: 'friend_request',
          targetUserId: explorer.id,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setFriendStatus(data.status);
        if (onFriendStatusChange) {
          onFriendStatusChange(explorer.id, data.status);
        }
      }
    } catch (err) {
      console.error('Failed to update friend status:', err);
    } finally {
      setIsUpdatingFriend(false);
    }
  };

  const handleJoinLiveQuest = async () => {
    if (!explorer.active_live_quest) return;
    try {
      setIsJoiningQuest(true);
      const res = await fetch('/api/explorers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
        body: JSON.stringify({
          action: 'join_live_quest',
          targetTripId: explorer.active_live_quest.id,
        }),
      });
      const data = await res.json();
      if (data.tripId) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('wanderly_active_trip_id', data.tripId);
        }
        onClose();
        router.push(`/trip/${data.tripId}`);
      }
    } catch (err) {
      console.error('Failed to join live quest:', err);
    } finally {
      setIsJoiningQuest(false);
    }
  };

  const isLive = Boolean(explorer.active_live_quest);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#F8FAFC] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-900 border border-slate-200/90">
        {/* Header Cover Bar */}
        <div className="relative h-28 bg-gradient-to-r from-slate-900 via-[#103025] to-[#0A1A14] p-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live on Trail
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
                <span>Idle / Basecamp</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 pb-5 -mt-12 flex flex-col flex-1 overflow-y-auto">
          {/* Avatar and Top Actions */}
          <div className="flex items-end justify-between">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-4 border-white shadow-lg shrink-0">
              <Image
                src={explorer.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${explorer.username}`}
                alt={explorer.display_name || explorer.username}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            {/* Friend Request Button */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handleToggleFriend}
                disabled={isUpdatingFriend}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                  friendStatus === 'accepted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : friendStatus === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {friendStatus === 'accepted' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Friends</span>
                  </>
                ) : friendStatus === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Request Sent</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mt-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                {explorer.display_name || explorer.username}
              </h2>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                {explorer.badge || 'Silver Coin Earner'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">@{explorer.username}</p>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {explorer.bio || 'Curious wanderer exploring real-world mystery trails.'}
            </p>
          </div>

          {/* Explorer Stats Strip */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="text-center">
              <p className="text-sm font-extrabold text-slate-900">
                {explorer.total_quests_completed || (explorer.traveled_quests?.length || 0)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                Traveled
              </p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-0.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{explorer.coins || 150}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                Coins
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-extrabold text-slate-900">
                {isLive ? '1 Live' : '0 Live'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                Status
              </p>
            </div>
          </div>

          {/* LIVE QUEST BANNER (If Active) */}
          {explorer.active_live_quest && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#0F1E19] to-[#0A1612] text-white border border-emerald-500/30 shadow-md relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Expedition Active
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Stop {explorer.active_live_quest.current_stop_index} of {explorer.active_live_quest.total_stops}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight">
                {explorer.active_live_quest.title}
              </h4>
              <p className="text-[11px] text-emerald-300/90 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Currently at: <strong className="text-white font-medium">{explorer.active_live_quest.current_destination_name}</strong></span>
              </p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>{explorer.active_live_quest.companions_count || 1} Co-Travelers</span>
                </span>

                <button
                  onClick={handleJoinLiveQuest}
                  disabled={isJoiningQuest}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isJoiningQuest ? 'Joining Trail...' : 'Join Live Quest'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Traveled Quests */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Traveled Quests</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {explorer.traveled_quests?.length || 0} Routes Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {(!explorer.traveled_quests || explorer.traveled_quests.length === 0) ? (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                  No completed quests recorded yet.
                </div>
              ) : (
                explorer.traveled_quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3 group"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <Image
                        src={quest.cover_image}
                        alt={quest.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {quest.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {quest.starting_location}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-medium">
                        <span>{quest.stops_count} stops</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold font-mono">₹{quest.budget_amount?.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/discover`);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="View Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
