'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Clock,
  Wallet,
  MapPin,
  Target,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Navigation,
  Star,
  Compass,
  ChevronDown,
  ChevronUp,
  PenLine,
  Save,
  Bus,
  Sparkles,
  Info,
} from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { ClientDestinationView } from '@/types/trip';
import { useAuth } from '@/features/auth/auth-context';
import { getDestinationPlaces, DestinationSpot } from '@/lib/places/destination-attractions';
import { AppCache } from '@/lib/cache/app-cache';
import { ImageCuratorService } from '@/lib/media/image-curator';
import { ClientTripDetail } from '@/types/trip';
import {
  getDestinationBudgetBreakdown,
  BudgetLineItem,
  TransportOption,
} from '@/lib/places/budget-breakdown';

const CATEGORY_COLORS: Record<string, string> = {
  transport: 'bg-blue-50 text-blue-700 border-blue-100',
  food: 'bg-amber-50 text-amber-700 border-amber-100',
  accommodation: 'bg-purple-50 text-purple-700 border-purple-100',
  activity: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  misc: 'bg-slate-50 text-slate-600 border-slate-200',
};

const CATEGORY_LABEL: Record<string, string> = {
  transport: 'Transport',
  food: 'Food & Drink',
  accommodation: 'Stay',
  activity: 'Activity',
  misc: 'Misc',
};

export default function DestinationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const destinationId = params.destinationId as string;
  const { user } = useAuth();

  const [destination, setDestination] = useState<ClientDestinationView | null>(() => {
    const direct = AppCache.get<ClientDestinationView>(`dest_${destinationId}`);
    if (direct) return direct;
    const cachedTrip = AppCache.get<ClientTripDetail>(`trip_detail_${tripId}`);
    if (cachedTrip?.destinations) {
      return cachedTrip.destinations.find((d) => d.id === destinationId) ?? null;
    }
    return null;
  });

  const [currency, setCurrency] = useState('INR');
  const [isLoading, setIsLoading] = useState(() => !destination);
  const [error, setError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [heroImageSrc, setHeroImageSrc] = useState<string>(() =>
    destination?.image_url || ImageCuratorService.getInstantImage(destination?.name || 'Kerala')
  );

  // Budget breakdown state
  const [showBudget, setShowBudget] = useState(true);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Derive budget breakdown from destination name
  const budgetBreakdown = useMemo(() => {
    if (!destination) return null;
    return getDestinationBudgetBreakdown(destination.name, destination.estimated_cost);
  }, [destination]);

  // Init line items + selected transport once breakdown is ready
  useEffect(() => {
    if (budgetBreakdown) {
      setLineItems(budgetBreakdown.line_items.map((i) => ({ ...i })));
      setSelectedTransport(budgetBreakdown.recommended_transport_id);
    }
  }, [budgetBreakdown]);

  useEffect(() => {
    if (destination?.image_url) setHeroImageSrc(destination.image_url);
  }, [destination?.image_url]);

  useEffect(() => {
    if (destination?.custom_notes) setNotes(destination.custom_notes);
  }, [destination?.custom_notes]);

  useEffect(() => {
    async function fetchDestination() {
      try {
        let uid = user?.id;
        if (!uid && typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('wanderly_user');
            if (cached) uid = JSON.parse(cached)?.id;
          } catch {}
        }
        const res = await fetch(`/api/destinations/${destinationId}`, {
          headers: { 'x-wanderly-user-id': uid || '' },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Destination not found');
        setDestination(data.data);
        AppCache.set(`dest_${destinationId}`, data.data);
        if (data.currency) setCurrency(data.currency);
      } catch (err: unknown) {
        if (!destination) {
          setError(err instanceof Error ? err.message : 'Error loading destination');
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (destinationId) fetchDestination();
  }, [destinationId, user?.id]);

  const placesToVisit = useMemo<DestinationSpot[]>(() => {
    if (!destination) return [];
    return getDestinationPlaces(destination.name, destination.id, destination.latitude, destination.longitude);
  }, [destination]);

  // Computed totals
  const totalActualSpend = lineItems.reduce(
    (s, i) => s + (i.actual_cost != null ? Number(i.actual_cost) : Number(i.estimated_cost)),
    0
  );
  const totalEstimated = lineItems.reduce((s, i) => s + Number(i.estimated_cost), 0);
  const savedAmount = totalEstimated - totalActualSpend;

  const handleEditItem = (idx: number) => {
    setEditingIdx(idx);
    const item = lineItems[idx];
    setEditValue(String(item.actual_cost ?? item.estimated_cost));
  };

  const handleSaveItem = (idx: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], actual_cost: Number(editValue) || null };
      return copy;
    });
    setEditingIdx(null);
  };

  const handleSaveCorrections = useCallback(async () => {
    if (!destination) return;
    setIsSaving(true);
    try {
      const actualSpend = lineItems.reduce(
        (s, i) => s + (i.actual_cost != null ? Number(i.actual_cost) : Number(i.estimated_cost)),
        0
      );
      await fetch(`/api/destinations/${destinationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || '',
        },
        body: JSON.stringify({
          actual_spend: actualSpend,
          custom_notes: notes,
          preferred_transport: selectedTransport,
        }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      // silent fail for demo
    } finally {
      setIsSaving(false);
    }
  }, [destination, destinationId, lineItems, notes, selectedTransport, user?.id]);

  if (isLoading) {
    return (
      <MobileShell theme="cream">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-400">Opening Destination...</p>
        </div>
      </MobileShell>
    );
  }

  if (error || !destination) {
    return (
      <MobileShell theme="cream">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-600 mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Destination Locked or Unavailable</h2>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">{error || 'Could not load details.'}</p>
          <button
            onClick={() => router.push(`/trip/${tripId}`)}
            className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-full cursor-pointer hover:bg-emerald-500"
          >
            Return to Adventure Map
          </button>
        </div>
      </MobileShell>
    );
  }

  const mission = destination.mission;
  const mainGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.name)}`;

  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto pb-10">
        {/* Hero Image */}
        <div className="relative w-full h-64 shrink-0 bg-slate-900">
          <Image
            src={heroImageSrc}
            alt={destination.name}
            fill priority unoptimized
            onError={() => setHeroImageSrc(ImageCuratorService.getInstantImage(destination.name))}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />

          <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `Wanderly: ${destination.name}`, text: `Exploring ${destination.name}!`, url: window.location.href });
                }
              }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
            <div className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>{destination.status === 'completed' ? 'Completed Stop' : 'Active Waypoint'}</span>
            </div>
            <a
              href={mainGoogleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Go Maps</span>
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-4 flex flex-col gap-5">
          {/* Title & Meta */}
          <div>
            <h1 className="text-2xl font-serif text-slate-900 tracking-tight font-medium">{destination.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500">
              {destination.estimated_travel_minutes && (
                <div className="flex items-center gap-1 text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{Math.round((destination.estimated_travel_minutes / 60) * 10) / 10} hrs</span>
                </div>
              )}
              <span>•</span>
              <div className="flex items-center gap-1 text-slate-800">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <span>₹{destination.estimated_cost?.toLocaleString() || '2,000'} est.</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>India</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{destination.description}</p>

          {/* ─── BUDGET BREAKDOWN SECTION ─── */}
          {budgetBreakdown && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setShowBudget((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Budget Breakdown</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">AI estimates • correct & publish</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    ₹{totalActualSpend.toLocaleString()}
                  </span>
                  {showBudget ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {showBudget && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Transport Options */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Bus className="w-3 h-3" /> How to Get Here
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {budgetBreakdown.transport_options.map((t: TransportOption) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTransport(t.id)}
                          className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedTransport === t.id
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {t.is_budget_pick && (
                            <span className={`absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${selectedTransport === t.id ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-700'}`}>
                              Budget
                            </span>
                          )}
                          <div className="text-lg leading-none mb-1">{t.icon}</div>
                          <p className={`text-[11px] font-bold leading-tight pr-8 ${selectedTransport === t.id ? 'text-white' : 'text-slate-900'}`}>{t.label}</p>
                          <div className={`flex items-center justify-between mt-1 ${selectedTransport === t.id ? 'text-slate-300' : 'text-slate-500'}`}>
                            <span className="text-[10px] font-medium">{t.duration}</span>
                            <span className="text-[10px] font-mono font-bold">₹{t.estimated_cost}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedTransport && (
                      <p className="text-[10px] text-slate-500 italic px-1">
                        {budgetBreakdown.transport_options.find((t) => t.id === selectedTransport)?.detail}
                      </p>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Itemized Costs</p>
                      <div className="flex items-center gap-1.5">
                        {savedAmount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ₹{savedAmount.toLocaleString()} saved
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Est. ₹{totalEstimated.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {lineItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors"
                        >
                          <span className="text-base shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category]}`}>
                                {CATEGORY_LABEL[item.category]}
                              </span>
                              {item.is_recommended && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-900 mt-0.5 truncate">{item.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.detail}</p>
                          </div>

                          {/* Cost Editor */}
                          {editingIdx === idx ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-emerald-600 font-bold">₹</span>
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16 text-xs font-bold text-slate-900 bg-white border border-emerald-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveItem(idx)}
                                className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditItem(idx)}
                              className="flex items-center gap-1 shrink-0 group cursor-pointer"
                            >
                              <div className="text-right">
                                {item.actual_cost != null && item.actual_cost !== item.estimated_cost && (
                                  <p className="text-[9px] text-slate-400 line-through">₹{item.estimated_cost}</p>
                                )}
                                <p className={`text-xs font-mono font-bold ${item.actual_cost != null ? 'text-emerald-700' : 'text-slate-700'}`}>
                                  ₹{(item.actual_cost ?? item.estimated_cost).toLocaleString()}
                                </p>
                              </div>
                              <PenLine className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agent Budget Tips */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Agent Budget Tips
                    </p>
                    <ul className="space-y-1.5">
                      {budgetBreakdown.budget_tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* User Notes */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <PenLine className="w-3 h-3" /> Your Notes & Corrections
                    </p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="e.g. The KSRTC bus actually cost ₹18, not ₹25. Fish thali at Hotel Seaside was much better — ₹220..."
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {/* Save Corrections CTA */}
                  <button
                    onClick={handleSaveCorrections}
                    disabled={isSaving}
                    className="w-full h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
                    ) : savedOk ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Corrections Saved!</span></>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /><span>Save My Real Costs</span></>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Your corrections help improve the public quest. You can publish refined budget data from your Journal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Places to Visit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Places to Visit Nearby</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Top spots to explore while you're here</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                {placesToVisit.length} Spots
              </span>
            </div>

            <div className="space-y-3">
              {placesToVisit.map((spot) => {
                const isBroken = brokenImages[spot.id];
                const spotImg = isBroken
                  ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
                  : spot.image_url;
                return (
                  <div
                    key={spot.id}
                    className="bg-white rounded-[20px] p-3.5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={spotImg} alt={spot.name} fill unoptimized
                          onError={() => setBrokenImages((prev) => ({ ...prev, [spot.id]: true }))}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-tight bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {spot.category}
                          </span>
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-none" />
                            <span>{spot.rating}</span>
                          </span>
                        </div>
                        <h4 className="text-[13px] font-serif font-medium text-slate-900 leading-tight mt-1 truncate tracking-tight">
                          {spot.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock className="w-2.5 h-2.5 text-emerald-500" />
                          <span>{spot.travel_time}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{spot.description}</p>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span>Google Maps Ready</span>
                      </span>
                      <a
                        href={spot.google_maps_url}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Go</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mission Card */}
          {mission && (
            <div className="bg-white rounded-[20px] p-4 shadow-xs border border-slate-200/80 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stop Mission & Quest</span>
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">{mission.instructions}</p>
            </div>
          )}

          {/* Log Visit CTA */}
          <button
            onClick={() => { if (mission) router.push(`/trip/${tripId}/mission/${mission.id}`); }}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-98 transition-all rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Log Destination Visit</span>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
