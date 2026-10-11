'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Sparkles,
  MapPin,
  Clock,
  Wallet,
  ArrowRight,
  Loader2,
  Flame,
  CheckCircle2,
  Share2,
  Tag,
  RefreshCw,
  Users,
  Search,
  UserPlus,
  UserCheck,
  Zap,
  Coins,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { PullToRefresh } from '@/components/layout/pull-to-refresh';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ExplorerProfile } from '@/types/database';
import { ExplorerProfileModal } from './explorer-profile-modal';

interface QuestDestination {
  id: string;
  name: string;
  actual_spend?: number | null;
  estimated_cost?: number;
  image_url: string;
  description: string;
}

interface PublicQuest {
  id: string;
  user_id: string;
  starting_location_name: string;
  public_title?: string;
  public_description?: string;
  budget_amount: number;
  currency: string;
  duration_value: number;
  duration_unit: string;
  vibe?: string;
  clones_count?: number;
  total_points?: number;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  destinations?: QuestDestination[];
  preview_photos?: string[];
}

const FILTER_VIBES = ['All', 'Coastal', 'Mountain', 'Backwaters', 'Heritage', 'Tea Highlands'];

export function DiscoveryFeed() {
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<'quests' | 'explorers'>('quests');

  // Quests State
  const [quests, setQuests] = useState<PublicQuest[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [cloningQuestId, setCloningQuestId] = useState<string | null>(null);

  // Explorers State
  const [explorers, setExplorers] = useState<ExplorerProfile[]>([]);
  const [isLoadingExplorers, setIsLoadingExplorers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [explorerFilter, setExplorerFilter] = useState<'all' | 'live' | 'friends'>('all');
  const [selectedExplorer, setSelectedExplorer] = useState<ExplorerProfile | null>(null);
  const [joiningQuestId, setJoiningQuestId] = useState<string | null>(null);

  const loadQuests = useCallback(async () => {
    try {
      const res = await fetch('/api/discover');
      const data = await res.json();
      if (data.quests) {
        setQuests(data.quests);
      }
    } catch (err) {
      console.error('Failed to load discovery quests:', err);
    } finally {
      setIsLoadingQuests(false);
    }
  }, []);

  const loadExplorers = useCallback(async (query = '') => {
    try {
      const url = query ? `/api/explorers?q=${encodeURIComponent(query)}` : '/api/explorers';
      const res = await fetch(url, {
        headers: {
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
      });
      const data = await res.json();
      if (data.explorers) {
        setExplorers(data.explorers);
      }
    } catch (err) {
      console.error('Failed to load explorers:', err);
    } finally {
      setIsLoadingExplorers(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadQuests();
    loadExplorers();
  }, [loadQuests, loadExplorers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadExplorers(val);
  };

  const handleStartQuest = async (questId: string) => {
    setCloningQuestId(questId);
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
        body: JSON.stringify({ action: 'clone', questId }),
      });
      const data = await res.json();
      if (data.trip_id) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('wanderly_active_trip_id', data.trip_id);
        }
        router.push(`/trip/${data.trip_id}`);
      }
    } catch (err) {
      console.error('Failed to clone quest:', err);
    } finally {
      setCloningQuestId(null);
    }
  };

  const handleToggleFriend = async (explorerId: string) => {
    try {
      const res = await fetch('/api/explorers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
        body: JSON.stringify({ action: 'friend_request', targetUserId: explorerId }),
      });
      const data = await res.json();
      if (data.status) {
        setExplorers((prev) =>
          prev.map((exp) =>
            exp.id === explorerId ? { ...exp, friendship_status: data.status } : exp
          )
        );
        if (selectedExplorer && selectedExplorer.id === explorerId) {
          setSelectedExplorer({ ...selectedExplorer, friendship_status: data.status });
        }
      }
    } catch (err) {
      console.error('Failed to toggle friendship:', err);
    }
  };

  const handleJoinLiveQuest = async (targetTripId: string) => {
    setJoiningQuestId(targetTripId);
    try {
      const res = await fetch('/api/explorers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || 'guest_user',
        },
        body: JSON.stringify({ action: 'join_live_quest', targetTripId }),
      });
      const data = await res.json();
      if (data.tripId) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('wanderly_active_trip_id', data.tripId);
        }
        router.push(`/trip/${data.tripId}`);
      }
    } catch (err) {
      console.error('Failed to join live quest:', err);
    } finally {
      setJoiningQuestId(null);
    }
  };

  const openAuthorModal = (authorUsername: string, authorDisplayName: string) => {
    const found = explorers.find(
      (e) =>
        e.username.toLowerCase() === authorUsername.toLowerCase() ||
        (e.display_name && e.display_name.toLowerCase() === authorDisplayName.toLowerCase())
    );
    if (found) {
      setSelectedExplorer(found);
    } else {
      // Fallback
      setSelectedExplorer({
        id: `exp_${authorUsername}`,
        username: authorUsername,
        display_name: authorDisplayName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${authorUsername}`,
        bio: 'Explorer sharing mystery routes on Wanderly.',
        badge: '🥈 Silver Earner',
        coins: 150,
        total_quests_completed: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        traveled_quests: [],
      });
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (selectedVibe === 'All') return true;
    const qVibe = (q.vibe || '').toLowerCase();
    const qTitle = (q.public_title || '').toLowerCase();
    return qVibe.includes(selectedVibe.toLowerCase()) || qTitle.includes(selectedVibe.toLowerCase());
  });

  const filteredExplorers = explorers.filter((e) => {
    if (explorerFilter === 'live') return Boolean(e.active_live_quest);
    if (explorerFilter === 'friends') return e.friendship_status === 'accepted';
    return true;
  });

  const liveExplorersCount = explorers.filter((e) => Boolean(e.active_live_quest)).length;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
      <PullToRefresh
        onRefresh={() => (mode === 'quests' ? loadQuests() : loadExplorers(searchQuery))}
        className="flex-1 overflow-y-auto"
      >
        {/* Header Bar */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
              {mode === 'quests' ? 'Discover Mystery Quests' : 'Community Explorers'}
            </h1>

            {mode === 'quests' && quests.length > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                {quests.length} live
              </span>
            )}

            {mode === 'explorers' && liveExplorersCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {liveExplorersCount} on trail
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {mode === 'quests'
              ? 'Curated community routes with verified stops & secret spots.'
              : 'Search profiles, view traveled quests, add friends & join live trails.'}
          </p>

          {/* Clean Mode Switcher: Quests vs Explorers (Perfect parent container alignment) */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300/50 mt-3.5 w-full max-w-[270px] shadow-inner">
            <button
              onClick={() => setMode('quests')}
              className={`flex-1 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'quests'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Quests</span>
            </button>

            <button
              onClick={() => setMode('explorers')}
              className={`flex-1 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'explorers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Explorers</span>
              {liveExplorersCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Quests Mode: Minimal Vibe Filter Chips */}
          {mode === 'quests' && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3.5 pb-1 -mx-5 px-5">
              {FILTER_VIBES.map((vibe) => {
                const isActive = selectedVibe === vibe;
                return (
                  <button
                    key={vibe}
                    onClick={() => setSelectedVibe(vibe)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          )}

          {/* Explorers Mode: Search Bar & Filter Chips */}
          {mode === 'explorers' && (
            <div className="mt-3.5 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search explorers (@username, name)..."
                  className="w-full bg-white border border-slate-200/90 rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
                <button
                  onClick={() => setExplorerFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    explorerFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Explorers
                </button>
                <button
                  onClick={() => setExplorerFilter('live')}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    explorerFilter === 'live'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-emerald-700 hover:border-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live on Trail
                </button>
                <button
                  onClick={() => setExplorerFilter('friends')}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    explorerFilter === 'friends'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Friends
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FEED BODY */}
        <div className="px-5 pt-2 pb-24 space-y-4">
          {/* ========================================================
              QUESTS VIEW
          ======================================================== */}
          {mode === 'quests' && (
            isLoadingQuests ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-medium">Loading mystery quests...</span>
              </div>
            ) : filteredQuests.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-2xs">
                <Compass className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No quests found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No mystery routes match the &apos;{selectedVibe}&apos; filter.
                </p>
                <button
                  onClick={() => setSelectedVibe('All')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full transition-all"
                >
                  View All Quests
                </button>
              </div>
            ) : (
              filteredQuests.map((quest) => {
                const author = quest.author || {
                  username: 'wanderer',
                  display_name: 'Wanderer',
                  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=nomad',
                };

                const isCloning = cloningQuestId === quest.id;
                const stopsCount = quest.destinations?.length || 3;
                const coverPhoto =
                  quest.preview_photos?.[0] ||
                  quest.destinations?.[0]?.image_url ||
                  'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={quest.id}
                    className="bg-white rounded-[26px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80 flex flex-col group"
                  >
                    {/* Cover Image & Vibe Tag */}
                    <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
                      <Image
                        src={coverPhoto}
                        alt={quest.public_title || quest.starting_location_name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 text-emerald-300 backdrop-blur-md border border-white/10 shadow-xs">
                          {quest.vibe || '🌴 Coastal'}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-amber-300 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-xs">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{quest.clones_count || 12} forked</span>
                        </span>
                      </div>

                      {/* Bottom Image Overlay Title & Stats */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="text-base font-serif font-medium leading-snug tracking-tight drop-shadow-sm truncate">
                          {quest.public_title || quest.starting_location_name}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-300 text-[11px] mt-0.5">
                          <span>
                            {quest.duration_value} {quest.duration_unit}
                          </span>
                          <span>•</span>
                          <span>{stopsCount} Stops</span>
                          <span>•</span>
                          <span className="text-emerald-300 font-bold font-mono">
                            ₹{quest.budget_amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3.5">
                      {/* Author Row (Clickable to open Explorer Profile!) */}
                      <button
                        onClick={() => openAuthorModal(author.username, author.display_name)}
                        className="w-full flex items-center justify-between text-left hover:opacity-85 transition-opacity cursor-pointer group/author"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                            <img
                              src={author.avatar_url}
                              alt={author.display_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 leading-tight truncate group-hover/author:text-emerald-600 transition-colors">
                              {author.display_name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">@{author.username}</p>
                          </div>
                        </div>

                        <span className="text-[9px] font-medium text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-0.5">
                          <span>View Profile</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>

                      {/* 2-Sentence Manifesto */}
                      {quest.public_description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {quest.public_description}
                        </p>
                      )}

                      {/* Verified Stops Strip */}
                      {quest.destinations && quest.destinations.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Stops & Real Spend
                            </span>
                            <span className="text-[9px] font-mono text-emerald-600 font-bold">
                              Verified
                            </span>
                          </div>
                          <div className="space-y-1">
                            {quest.destinations.map((d, idx) => (
                              <div
                                key={d.id || idx}
                                className="flex items-center justify-between text-[11px] text-slate-700"
                              >
                                <span className="truncate pr-2 font-medium">
                                  {idx + 1}. {d.name}
                                </span>
                                <span className="font-mono text-slate-500 font-semibold shrink-0">
                                  ₹{(d.actual_spend || d.estimated_cost || 1500).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{quest.total_points || 350} pts reward</span>
                        </div>

                        <button
                          onClick={() => handleStartQuest(quest.id)}
                          disabled={isCloning}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          {isCloning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Forking Trail...</span>
                            </>
                          ) : (
                            <>
                              <span>Embark Trail</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ========================================================
              EXPLORERS VIEW
          ======================================================== */}
          {mode === 'explorers' && (
            isLoadingExplorers ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-medium">Searching travelers...</span>
              </div>
            ) : filteredExplorers.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-2xs">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No explorers found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No travelers match &apos;{searchQuery}&apos; or the current filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setExplorerFilter('all');
                    loadExplorers('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full transition-all"
                >
                  Reset Explorer Filter
                </button>
              </div>
            ) : (
              filteredExplorers.map((explorer) => {
                const isLive = Boolean(explorer.active_live_quest);
                const isJoiningThis = joiningQuestId === explorer.active_live_quest?.id;

                return (
                  <div
                    key={explorer.id}
                    className="bg-white rounded-[24px] border border-slate-200/80 shadow-2xs p-4 flex flex-col gap-3 transition-all hover:border-slate-300 hover:shadow-xs group"
                  >
                    {/* Top Row: Avatar + Info + Friend Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => setSelectedExplorer(explorer)}
                        className="flex items-center gap-3 cursor-pointer min-w-0"
                      >
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <Image
                            src={
                              explorer.avatar_url ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${explorer.username}`
                            }
                            alt={explorer.display_name || explorer.username}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          {isLive && (
                            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {explorer.display_name || explorer.username}
                            </h3>
                            {explorer.badge && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded-full shrink-0">
                                {explorer.badge.includes('Cosmic')
                                  ? '💎 Cosmic'
                                  : explorer.badge.includes('Gold')
                                  ? '🥇 Gold'
                                  : '🥈 Silver'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">@{explorer.username}</p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-normal">
                            {explorer.bio}
                          </p>
                        </div>
                      </div>

                      {/* Friend Request Button */}
                      <button
                        onClick={() => handleToggleFriend(explorer.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95 ${
                          explorer.friendship_status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : explorer.friendship_status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {explorer.friendship_status === 'accepted' ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Friends</span>
                          </>
                        ) : explorer.friendship_status === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* LIVE QUEST CARD (If Active) */}
                    {isLive && explorer.active_live_quest && (
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0F1E19] to-[#0A1612] text-white border border-emerald-500/25 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE ON TRAIL
                          </span>
                          <span className="text-[10px] text-slate-300 font-mono">
                            Waypoint {explorer.active_live_quest.current_stop_index}/{explorer.active_live_quest.total_stops}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white truncate">
                            {explorer.active_live_quest.title}
                          </p>
                          <p className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>At {explorer.active_live_quest.current_destination_name}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/10">
                          <span className="text-[10px] text-slate-400">
                            {explorer.active_live_quest.companions_count || 1} Co-Travelers
                          </span>

                          <button
                            onClick={() => handleJoinLiveQuest(explorer.active_live_quest!.id)}
                            disabled={isJoiningThis}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            <Zap className="w-3 h-3 stroke-[2.5]" />
                            <span>{isJoiningThis ? 'Joining...' : 'Join Live Quest'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer Row: Traveled Count & View Full Profile */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] font-medium">
                        {(explorer.traveled_quests?.length || explorer.total_quests_completed || 0)} Traveled Quests
                      </span>

                      <button
                        onClick={() => setSelectedExplorer(explorer)}
                        className="text-emerald-700 hover:text-emerald-600 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Quests & Stats</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </PullToRefresh>

      {/* Floating Bottom Navigation */}
      <BottomNav />

      {/* Explorer Profile Sheet / Modal */}
      <ExplorerProfileModal
        explorer={selectedExplorer}
        onClose={() => setSelectedExplorer(null)}
        onFriendStatusChange={(explorerId, newStatus) => {
          setExplorers((prev) =>
            prev.map((e) => (e.id === explorerId ? { ...e, friendship_status: newStatus as any } : e))
          );
        }}
      />
    </div>
  );
}
