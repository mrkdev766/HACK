'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  Calendar,
  Compass,
  Bus,
  Car,
  Footprints,
  Sparkles,
  Loader2,
  MapPin,
  Bot,
  ThermometerSun,
  Flame,
  CheckCircle2,
  Heart,
  Navigation,
  Plus,
  CloudSun,
  Mountain,
  ChevronDown,
  X,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/features/auth/auth-context';
import { AppCache } from '@/lib/cache/app-cache';

const LocationMapPicker = dynamic(
  () => import('./location-map-picker').then((mod) => mod.LocationMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 bg-white rounded-[22px] flex flex-col items-center justify-center border border-slate-200/80 gap-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs font-medium">Loading Interactive Map...</span>
      </div>
    ),
  }
);

const SYNTHESIS_STEPS = [
  'Scouting verified stops & hidden gems...',
  'Optimizing transit route within budget...',
  'Calibrating scenery vibe & challenge missions...',
  'Locking milestones & encrypting coordinates...',
];

export function PlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setActiveTripId, loginGuest } = useAuth();

  const urlLocation = searchParams?.get('location');
  const urlBudget = searchParams?.get('budget');
  const urlDays = searchParams?.get('days');
  const urlVibe = searchParams?.get('vibe');

  // Wizard step state (1 to 4)
  const [step, setStep] = useState(1);

  // Form inputs
  const [startingLocation, setStartingLocation] = useState(urlLocation || 'Kochi, Kerala');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState<number | ''>(urlBudget ? Number(urlBudget) : 2500);
  const [durationValue, setDurationValue] = useState<number | ''>(urlDays ? Number(urlDays) : 2);
  const [durationUnit, setDurationUnit] = useState<'days' | 'hours'>('days');
  const [transportMode, setTransportMode] = useState<'public_transit' | 'walking' | 'personal_vehicle'>('public_transit');
  const [travelStyle, setTravelStyle] = useState<'nature' | 'culture' | 'food' | 'mixed'>('nature');
  const [adventureLevel, setAdventureLevel] = useState<'easy' | 'moderate' | 'intense'>('moderate');
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    urlVibe ? urlVibe.split(',').map((s) => s.trim()).filter(Boolean) : ['Chill & Serene']
  );
  const [extraPreferences, setExtraPreferences] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [synthesisStepIndex, setSynthesisStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Cycling agent progress steps during loading
  useEffect(() => {
    if (!isLoading) {
      setSynthesisStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setSynthesisStepIndex((prev) => (prev < SYNTHESIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [isLoading]);

  // GPS current location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.state ||
              'My Current Location';
            const state = data.address?.state ? `, ${data.address.state}` : '';
            setStartingLocation(`${city}${state}`);
          } else {
            setStartingLocation(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
          }
        } catch {
          setStartingLocation('Current Location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        alert('Could not retrieve current location.');
      },
      { timeout: 8000 }
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!startingLocation.trim()) {
        setError('Please enter or select a starting location.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!budgetAmount || budgetAmount < 500) {
        setError('Please enter a budget of at least ₹500.');
        return;
      }
      if (!durationValue || durationValue < 1) {
        setError('Please enter a duration of at least 1.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let currentUserId = user?.id;
      if (!currentUserId && typeof window !== 'undefined') {
        const saved = localStorage.getItem('wanderly_user');
        if (saved) {
          try {
            currentUserId = JSON.parse(saved).id;
          } catch {}
        }
      }
      if (!currentUserId) {
        const guestRes = await loginGuest(`wanderer_${Math.floor(1000 + Math.random() * 9000)}`);
        if (guestRes.success && guestRes.profile) {
          currentUserId = guestRes.profile.id;
        }
      }

      const finalVibe = selectedVibes.length > 0 ? selectedVibes.join(', ') : 'Scenic Adventure';

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': currentUserId || user?.id || '',
        },
        body: JSON.stringify({
          starting_location: startingLocation,
          budget_amount: Number(budgetAmount) || 2500,
          currency: 'INR',
          duration_value: Number(durationValue) || 2,
          duration_unit: durationUnit,
          transport_mode: transportMode,
          travel_style: travelStyle,
          vibe: finalVibe,
          climate: 'Any',
          adventure_level: adventureLevel,
          activities: [],
          extra_preferences: extraPreferences,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to craft itinerary');
      }

      if (data.profile && !user && typeof window !== 'undefined') {
        localStorage.setItem('wanderly_user', JSON.stringify(data.profile));
      }

      setActiveTripId(data.trip_id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wanderly_active_trip_id', data.trip_id);
      }
      if (user?.id) AppCache.remove(`user_trips_${user.id}`);
      AppCache.remove('user_trips_guest');

      router.push(`/trip/${data.trip_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating itinerary';
      setError(msg);
      setIsLoading(false);
    }
  };

  const stepTitles = [
    'Departure Point',
    'Time & Budget',
    'Vibe & Style',
    'Route Blueprint',
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-slate-900 px-5 py-4 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (step > 1) setStep((s) => s - 1);
            else router.push('/dashboard');
          }}
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>

        {/* Centered Step Indicator */}
        <div className="text-center">
          <p className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest">
            Step {step} of 4
          </p>
          <h3 className="text-xs font-bold text-slate-800 leading-tight">
            {stepTitles[step - 1]}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-xs font-bold text-slate-400 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5 mb-5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-emerald-500 shadow-2xs' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* AI EXPEDITION AGENT SYNTHESIS SCREEN */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Ambient emerald backlight orb */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />

            {/* Double radar scanning rings */}
            <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-40" />
            <div className="absolute -inset-2 rounded-full border border-emerald-500/20 border-t-emerald-500 animate-spin" />

            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0F1E19] flex items-center justify-center text-emerald-400 shadow-lg border border-emerald-500/30">
              <Bot className="w-7 h-7 stroke-[2.2]" />
            </div>
          </div>

          <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight">
            Synthesizing Your Trail...
          </h2>

          <p className="text-xs text-slate-500 max-w-[280px] mt-1.5 leading-relaxed font-normal">
            Mapping progressive mystery stops from <strong className="text-slate-800">{startingLocation}</strong>
          </p>

          {/* Dynamic Cycling Synthesis Step */}
          <div className="mt-6 w-full max-w-xs bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3 text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Active Process
              </p>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                {SYNTHESIS_STEPS[synthesisStepIndex]}
              </p>
            </div>
          </div>

          {/* Live Progress Bar */}
          <div className="w-full max-w-xs mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(synthesisStepIndex + 1) * 25}%` }}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleNextStep} className="flex-1 flex flex-col justify-between">
          {/* STEP 1: Starting Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                  Starting Point
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Where should your mystery trail kick off? Type a departure city or tap the map.
                </p>
              </div>

              {/* Location Input with GPS button */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Departure City</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    ) : (
                      <Navigation className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>Current GPS</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  placeholder="e.g. Kochi, Kerala or Manali, HP"
                  required
                  className="w-full text-base font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Interactive Map Selector */}
              <LocationMapPicker
                initialLocation={startingLocation}
                onLocationSelected={(locationName) => {
                  setStartingLocation(locationName);
                }}
              />
            </div>
          )}

          {/* STEP 2: Time, Transport & Budget */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                  Time, Transit & Budget
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tailor your duration and spending range for the AI agent to optimize.
                </p>
              </div>

              {/* Available Time Card */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available Time</span>
                  </label>

                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDurationUnit('days')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        durationUnit === 'days'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationUnit('hours')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        durationUnit === 'hours'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hours
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={durationValue === '' ? '' : durationValue}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      if (clean === '') {
                        setDurationValue('');
                        return;
                      }
                      const stripped = clean.replace(/^0+(?=\d)/, '');
                      const num = parseInt(stripped, 10);
                      const max = durationUnit === 'days' ? 14 : 72;
                      setDurationValue(Math.min(num, max));
                    }}
                    onBlur={() => {
                      if (durationValue === '' || durationValue < 1) {
                        setDurationValue(1);
                      }
                    }}
                    placeholder="2"
                    required
                    className="w-16 text-3xl font-extrabold text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-base font-bold text-slate-500 capitalize">
                    {durationUnit}
                  </span>
                </div>

                <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100">
                  {[1, 2, 3, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDurationValue(val)}
                      className={`text-xs px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        durationValue === val
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {val} {val === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Budget Card */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Budget</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    INR (₹)
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={budgetAmount === '' ? '' : budgetAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      if (clean === '') {
                        setBudgetAmount('');
                        return;
                      }
                      const stripped = clean.replace(/^0+(?=\d)/, '');
                      setBudgetAmount(parseInt(stripped, 10));
                    }}
                    onBlur={() => {
                      if (budgetAmount === '' || budgetAmount < 500) {
                        setBudgetAmount(500);
                      }
                    }}
                    placeholder="2500"
                    required
                    className="w-full text-3xl font-extrabold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
                  {[1500, 2500, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBudgetAmount(amt)}
                      className={`text-xs px-3 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        budgetAmount === amt
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transit Mode Grid */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Transit Mode
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'public_transit', label: 'Public Transit', icon: Bus, desc: 'Buses & trains' },
                    { id: 'personal_vehicle', label: 'Vehicle', icon: Car, desc: 'Car or bike' },
                    { id: 'walking', label: 'On Foot', icon: Footprints, desc: 'Walking trail' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = transportMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTransportMode(item.id as any)}
                        className={`p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">{item.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Vibe & Atmosphere */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                  Vibe & Atmosphere
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Choose the scenery and pace for your AI-curated checkpoints.
                </p>
              </div>

              {/* Scenery & Vibes Pill Cloud */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Travel Vibes</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    '🌴 Scenic Coast',
                    '⛰️ Mountain Mist',
                    '🍃 Lush Forest',
                    '🏛️ Heritage & History',
                    '☕ Tea Highlands',
                    '🌊 Silent Backwaters',
                    '🍜 Foodie Trails',
                    '✨ Hidden Off-Grid',
                  ].map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe);
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedVibes((prev) => prev.filter((v) => v !== vibe));
                          } else {
                            setSelectedVibes((prev) => [...prev, vibe]);
                          }
                        }}
                        className={`text-xs px-3.5 py-2 rounded-full font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pacing Selector */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pacing</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'Relaxed', desc: '1-2 slow stops' },
                    { id: 'moderate', label: 'Balanced', desc: '2-3 checkpoints' },
                    { id: 'intense', label: 'Active', desc: 'Fast exploration' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAdventureLevel(item.id as any)}
                      className={`p-3 rounded-2xl text-center transition-all cursor-pointer border ${
                        adventureLevel === item.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{item.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Travel Style */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Theme Focus
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'nature', label: 'Nature & Scenery' },
                    { id: 'culture', label: 'Culture & Heritage' },
                    { id: 'food', label: 'Street Food & Cafes' },
                    { id: 'mixed', label: 'Eclectic Mix' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTravelStyle(item.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer border ${
                        travelStyle === item.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 border-transparent text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preferences & Route Blueprint */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                  Final Blueprint
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Add custom highlights before the AI agent locks in your secret route.
                </p>
              </div>

              {/* Custom Highlights */}
              <div className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-200/80 space-y-2.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Special Notes or Must-Haves
                </label>
                <textarea
                  rows={2}
                  value={extraPreferences}
                  onChange={(e) => setExtraPreferences(e.target.value)}
                  placeholder="e.g. Scenic tea shacks, cliffside sunset views, ancient temples..."
                  className="w-full text-xs text-slate-900 bg-transparent focus:outline-none resize-none leading-relaxed placeholder:text-slate-400"
                />

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {[
                    'Scenic Cafes',
                    'Sunset Cliffs',
                    'Quiet Sanctuaries',
                    'Local Bakeries',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!extraPreferences.includes(tag)) {
                          setExtraPreferences((prev) => (prev ? `${prev}, ${tag}` : tag));
                        }
                      }}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Blueprint Card */}
              <div className="bg-gradient-to-br from-[#0B132B] via-[#111C38] to-[#0A1022] text-white rounded-[24px] p-5 shadow-lg border border-white/10 space-y-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>AI Route Blueprint</span>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ₹{Number(budgetAmount).toLocaleString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {durationValue} {durationUnit} from {startingLocation}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="capitalize">{transportMode.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{adventureLevel} Pace</span>
                    <span>•</span>
                    <span className="capitalize">
                      {selectedVibes.length > 0 ? selectedVibes[0] : 'Curated Scenery'}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Mystery Stops: 3–4 Progressive Checkpoints</span>
                  <span className="text-emerald-300 font-bold">+350 pts reward</span>
                </div>
              </div>
            </div>
          )}

          {/* Form CTA Buttons */}
          <div className="pt-5 pb-2">
            <button
              type="submit"
              className="w-full h-12 bg-emerald-400 hover:bg-emerald-300 active:scale-98 transition-all rounded-full text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(52,211,153,0.3)] cursor-pointer"
            >
              {step < 4 ? (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Synthesize Mystery Expedition</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
