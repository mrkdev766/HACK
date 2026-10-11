'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Edit3,
  Check,
  X,
  UserPlus,
  UserCheck,
  Users,
  Sparkles,
  MapPin,
  Calendar,
  Award,
  LogOut,
  ChevronRight,
  Shield,
  Plus,
  Loader2,
  Globe2,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { BottomNav } from '@/components/layout/bottom-nav';

interface Explorer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  title: string;
  level: number;
  trips_count: number;
  stops_count: number;
  vibes: string[];
  bio: string;
}

interface ProfileViewProps {
  tripId?: string;
  trips?: any[];
  totalPoints?: number;
  completedStops?: number;
}

const WEIRD_TITLES = [
  'Cosmic Trail Nomad',
  'Monsoon Daydreamer',
  'Zero-Baggage Vagabond',
  'High-Altitude Tea Hermit',
  'Nocturnal Ridge Seeker',
  'Saltwater Lagoon Scout',
];

const PASSPORT_STAMPS = [
  { code: '⟡', name: 'MIST HARVESTER', region: 'Vagamon Heights', year: '2026' },
  { code: '◉', name: 'CLIFF ECHO', region: 'North Cliff', year: '2026' },
  { code: '✦', name: 'CANAL DRIFT', region: 'Punnamada Basin', year: '2026' },
  { code: '☵', name: 'ZERO TRACE', region: 'Western Ghats', year: '2026' },
];

export function ProfileView({
  tripId,
  trips = [],
  totalPoints = 0,
  completedStops = 0,
}: ProfileViewProps) {
  const router = useRouter();
  const { user, logout, updateUsername } = useAuth();

  const [activeTab, setActiveTab] = useState<'passport' | 'directory' | 'trips'>('passport');

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Explorer Directory & Friends State
  const [directory, setDirectory] = useState<Explorer[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [friendsList, setFriendsList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wanderly_friends');
        return saved ? JSON.parse(saved) : ['exp_aria_01'];
      } catch {
        return ['exp_aria_01'];
      }
    }
    return ['exp_aria_01'];
  });

  // Random consistent quirk title based on user id/username
  const userSeed = user?.username || 'wanderer';
  const quirkTitle =
    WEIRD_TITLES[
    Math.abs(
      userSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % WEIRD_TITLES.length
    ];

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user?.username]);

  // Load public explorer directory
  useEffect(() => {
    async function fetchDirectory() {
      setIsLoadingDirectory(true);
      try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();
        if (data.directory) {
          setDirectory(data.directory);
        }
      } catch (err) {
        console.error('Failed to load directory:', err);
      } finally {
        setIsLoadingDirectory(false);
      }
    }
    fetchDirectory();
  }, []);

  // Toggle friend
  const toggleFriend = (explorerId: string) => {
    setFriendsList((prev) => {
      const next = prev.includes(explorerId)
        ? prev.filter((id) => id !== explorerId)
        : [...prev, explorerId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('wanderly_friends', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean || clean.length < 2) {
      setUsernameError('Min 2 characters (alphanumeric or _ -)');
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    const res = await updateUsername(clean);
    setIsSavingUsername(false);

    if (res.success) {
      setIsEditingUsername(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      setUsernameError(res.error || 'Failed to update username');
    }
  };

  const currentLevel = Math.floor(totalPoints / 200) + 1;
  const levelProgress = totalPoints % 500;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
      {/* Top Header Card */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Explorer Passport • ID #{user?.username?.slice(-4) || '9312'}</span>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${user?.username}'s Wanderly Passport`,
                  text: `Check out my travel milestones on Wanderly!`,
                  url: window.location.href,
                });
              } else {
                alert('Passport link copied!');
              }
            }}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4 mt-3">
          {/* Avatar with quirky aura border */}
          <div className="relative w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 bg-slate-100 shrink-0 shadow-sm">
            <img
              src={
                user?.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'wanderer'}`
              }
              alt="Avatar"
              className="w-full h-full object-cover block"
            />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {/* Name & Handle */}
          <div className="flex-1 min-w-0">
            {isEditingUsername ? (
              <form onSubmit={handleSaveUsername} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    maxLength={24}
                    autoFocus
                    className="w-full text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSavingUsername}
                    className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    {isSavingUsername ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(false);
                      setUsernameError(null);
                    }}
                    className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
                {usernameError && (
                  <p className="text-[10px] text-red-500 font-semibold">{usernameError}</p>
                )}
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-slate-900 tracking-tight truncate">
                    {user?.display_name || user?.username || 'Wanderer'}
                  </h1>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Change Username"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-emerald-600 font-bold tracking-tight mt-0.5 flex items-center gap-1">
                  <span>✦</span>
                  <span>{quirkTitle}</span>
                </p>

                <p className="text-[10px] text-slate-400 font-medium">
                  @{user?.username || 'wanderer'} • Level {currentLevel}
                </p>
              </div>
            )}

            {saveSuccess && (
              <span className="inline-block text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                Username updated ✓
              </span>
            )}
          </div>
        </div>

        {/* Quirky Minimal Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div>
            <span className="text-sm font-black text-slate-900">{trips.length}</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Trips</p>
          </div>
          <div>
            <span className="text-sm font-black text-emerald-600">{totalPoints}</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">XP Pts</p>
          </div>
          <div>
            <span className="text-sm font-black text-slate-900">{completedStops}</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Stops</p>
          </div>
          <div>
            <span className="text-sm font-black text-amber-500">{friendsList.length}</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Friends</p>
          </div>
        </div>
      </div>

      {/* Segmented Tab Bar */}
      <div className="px-5 pt-3 pb-1 shrink-0">
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('passport')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'passport'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
              }`}
          >
            Passport
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'directory'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
              }`}
          >
            <span>Explorers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'trips'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
              }`}
          >
            Trips ({trips.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-28">
        {/* TAB 1: WEIRD & MINIMAL PASSPORT */}
        {activeTab === 'passport' && (
          <div className="space-y-4 animate-fade-in">
            {/* Minimal Field Passport Card */}
            <div className="bg-white rounded-[22px] p-4.5 border border-slate-200/90 shadow-xs space-y-3 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase shrink-0">
                  Traveler Manifest
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  Verified Nomad
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-400 shrink-0">Curiosity Quotient</span>
                  <span className="font-bold text-slate-800 text-right truncate">99.4% Cosmic</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-400 shrink-0">Backpack Weight</span>
                  <span className="font-bold text-slate-800 text-right truncate">0.0 kg (Lightfoot)</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-400 shrink-0">Preferred Terrain</span>
                  <span className="font-bold text-slate-800 text-right truncate">Unscripted Byways</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-slate-400 shrink-0">Mutual Network</span>
                  <span className="font-bold text-emerald-600 text-right truncate">{friendsList.length} Connected Explorers</span>
                </div>
              </div>
            </div>

            {/* Quirky Stamp Grid */}
            <div className="bg-white rounded-[22px] p-4.5 border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">
                Official Waypoint Stamps
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {PASSPORT_STAMPS.map((stamp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center text-center group hover:border-emerald-300 transition-colors"
                  >
                    <span className="text-lg font-black text-emerald-600">{stamp.code}</span>
                    <span className="text-[10px] font-black text-slate-800 tracking-tight mt-1">
                      {stamp.name}
                    </span>
                    <span className="text-[9px] text-slate-400">{stamp.region}</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">#{stamp.year}-STMP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logout / Switch Session */}
            <div className="pt-2">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch Explorer Account</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PUBLIC EXPLORER DIRECTORY (ADD FRIENDS) */}
        {activeTab === 'directory' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Public Traveler Directory
                </h3>
                <p className="text-[11px] text-slate-400">
                  Connect with fellow adventurers exploring India
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                {directory.length} Online
              </span>
            </div>

            {isLoadingDirectory ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="text-xs font-semibold">Scanning coordinates...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {directory.map((explorer) => {
                  const isFriend = friendsList.includes(explorer.id);

                  return (
                    <div
                      key={explorer.id}
                      className="p-3.5 bg-white rounded-[20px] border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      {/* Explorer avatar & info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={explorer.avatar_url}
                            alt={explorer.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {explorer.display_name}
                            </h4>
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              Lv.{explorer.level}
                            </span>
                          </div>

                          <p className="text-[10px] text-emerald-600 font-semibold truncate mt-0.5">
                            {explorer.title}
                          </p>

                          <p className="text-[10px] text-slate-400 truncate">
                            {explorer.stops_count} stops • {explorer.vibes.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Add Friend Toggle Button */}
                      <button
                        onClick={() => toggleFriend(explorer.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${isFriend
                            ? 'bg-emerald-500 text-slate-950 shadow-xs hover:bg-emerald-400'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {isFriend ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Friend</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRIPS */}
        {activeTab === 'trips' && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Your Logged Expeditions
            </h3>

            {trips.length === 0 ? (
              <div className="bg-white rounded-[22px] p-8 text-center border border-slate-200/90 shadow-xs flex flex-col items-center justify-center">
                <Compass className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-800">No Expeditions Logged</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                  Start your first quest to unlock milestones.
                </p>
                <button
                  onClick={() => router.push('/plan')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Plan Route</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="p-3.5 bg-white rounded-[20px] border border-slate-200/90 shadow-xs cursor-pointer hover:border-emerald-300 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                        <Image
                          src={trip.cover_image || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80'}
                          alt={trip.starting_location_name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {trip.starting_location_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span>{trip.destinations_count || 0} Stops</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">+{trip.total_points || 0} XP</span>
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Dock */}
      <BottomNav tripId={tripId} />
    </div>
  );
}
