'use client';

import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  X,
  CheckCircle2,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';

interface DestinationItem {
  id: string;
  name: string;
  actual_spend?: number | null;
  estimated_cost?: number;
  image_url?: string;
  custom_notes?: string | null;
  preferred_transport?: string | null;
}

interface PublishQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
  destinations: DestinationItem[];
  defaultVibe?: string;
  onPublished?: (updatedTitle: string) => void;
}

const VIBE_OPTIONS = [
  '🌴 Coastal Mist',
  '⛰️ Mountain Ridge',
  '🛶 Backwater Drift',
  '🏛️ Ancient Heritage',
  '✨ Secret Gems',
  '☕ Tea Highlands',
];

export function PublishQuestModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  destinations: initialDestinations,
  defaultVibe = '🌴 Coastal Mist',
  onPublished,
}: PublishQuestModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState(tripTitle || 'My Mystery Expedition');
  const [description, setDescription] = useState(
    'A verified independent backpacker route with real travel costs and off-grid mystery stops.'
  );
  const [selectedVibe, setSelectedVibe] = useState(defaultVibe);

  // Editable destination copies with corrected prices & custom names
  const [dests, setDests] = useState(initialDestinations);

  const [isPolishingAI, setIsPolishingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateDest = (idx: number, field: string, val: any) => {
    setDests((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAIPolish = async () => {
    setIsPolishingAI(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || '',
        },
        body: JSON.stringify({
          publicTitle: title,
          publicDescription: description,
          vibe: selectedVibe,
          polish_with_ai: true,
          destinations: dests,
        }),
      });
      const data = await res.json();
      if (data.public_title) setTitle(data.public_title);
      if (data.public_description) setDescription(data.public_description);
    } catch {
      // ignore
    } finally {
      setIsPolishingAI(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || '',
        },
        body: JSON.stringify({
          publicTitle: title,
          publicDescription: description,
          vibe: selectedVibe,
          destinations: dests,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');

      setSuccessMsg(true);
      if (onPublished) onPublished(title);

      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSpent = dests.reduce((sum, d) => sum + (Number(d.actual_spend) || Number(d.estimated_cost) || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Grab Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 shrink-0 sm:hidden" />

        {/* Clean Header Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Publish Mystery Quest
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Share your route & verified prices with travelers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto px-5 py-2 space-y-4 pb-6">
          {successMsg ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Quest Published to Discovery!</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Your journey is live on the public feed. Explorers can now view, fork, and embark on this trail.
              </p>
            </div>
          ) : (
            <>
              {/* Quest Title & AI Polish Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Public Quest Title
                  </label>
                  <button
                    type="button"
                    onClick={handleAIPolish}
                    disabled={isPolishingAI}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    {isPolishingAI ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Polishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Polish with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unmapped Malabar Drift: Canals & Cliffs"
                  required
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Vibe Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Vibe Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VIBE_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVibe(v)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        selectedVibe === v
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Lore / Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Explorer Manifesto / Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Corrected Locations & Real Spend Review */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Stops & Real Prices Spent
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Total: ₹{totalSpent.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {dests.map((dest, idx) => (
                    <div
                      key={dest.id}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-700">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={dest.name}
                          onChange={(e) => handleUpdateDest(idx, 'name', e.target.value)}
                          placeholder="Location name"
                          className="flex-1 text-xs font-bold bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pl-7">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-emerald-600">₹</span>
                          <input
                            type="number"
                            value={dest.actual_spend ?? dest.estimated_cost ?? ''}
                            onChange={(e) =>
                              handleUpdateDest(idx, 'actual_spend', Number(e.target.value))
                            }
                            placeholder="Actual spend"
                            className="w-20 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">actual spent cost</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold text-center">{errorMsg}</p>
              )}
            </>
          )}

          {/* Submit CTA */}
          {!successMsg && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Expedition...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 stroke-[2.5]" />
                    <span>Publish to Public Discovery</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
