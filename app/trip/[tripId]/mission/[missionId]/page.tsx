'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  X,
  Loader2,
  Wallet,
  Sparkles,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { useAuth } from '@/features/auth/auth-context';
import { AppCache } from '@/lib/cache/app-cache';

export default function MissionCapturePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const missionId = params.missionId as string;
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [destinationName, setDestinationName] = useState('Current Stop');
  const [locationName, setLocationName] = useState('');
  const [requiredPhotos, setRequiredPhotos] = useState(2);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [actualSpend, setActualSpend] = useState<number | ''>('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load mission details if possible
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          headers: { 'x-wanderly-user-id': user?.id || '' },
        });
        const data = await res.json();
        if (data.data?.currentDestination) {
          setDestinationName(data.data.currentDestination.name);
          setLocationName(data.data.currentDestination.name);
          if (data.data.currentDestination.mission?.required_photo_count) {
            setRequiredPhotos(data.data.currentDestination.mission.required_photo_count);
          }
        }
      } catch {
        // default fallback
      }
    }
    if (tripId) loadData();
  }, [tripId, user?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-wanderly-user-id': user?.id || '',
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setPhotoUrls((prev) => [...prev, data.url]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading photo';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (photoUrls.length === 0) {
      setError('Please capture or upload at least one photo for this mission.');
      return;
    }

    if (!note || note.trim().length < 5) {
      setError('Please write at least 5 characters in your journal note.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/missions/${missionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || '',
        },
        body: JSON.stringify({
          note,
          actual_spend: Number(actualSpend),
          photo_urls: photoUrls,
          location_name: locationName.trim() || destinationName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete mission');
      }

      // Store completion payload in session storage for celebration screen
      sessionStorage.setItem('wanderly_completion_result', JSON.stringify(data));

      // Invalidate cached trip and trips list to reflect newly unlocked stop
      AppCache.remove(`trip_detail_${tripId}`);
      if (user?.id) AppCache.remove(`user_trips_${user.id}`);

      // Navigate to complete screen
      router.push(`/trip/${tripId}/complete`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col bg-[#F8FAFC] px-5 py-4 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="text-base font-extrabold text-slate-900">{destinationName}</h2>
          <span className="text-xs font-black text-action bg-action/10 px-2.5 py-1 rounded-full">
            {photoUrls.length}/{requiredPhotos} Photos
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Main Photo Showcase / Upload Card */}
          <div className="relative w-full h-56 rounded-[24px] overflow-hidden shadow-card border border-black/5 bg-black/5 flex flex-col items-center justify-center">
            {photoUrls.length > 0 ? (
              <Image
                src={photoUrls[photoUrls.length - 1]}
                alt="Captured memory"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted gap-2">
                <Camera className="w-10 h-10 stroke-[1.5]" />
                <span className="text-xs font-bold">No photos captured yet</span>
              </div>
            )}

            {/* Floating Camera Button on bottom right */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 right-4 w-12 h-12 bg-forest/90 hover:bg-forest text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-10"
              title="Take Photo or Upload"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-6 h-6 stroke-[2]" />
              )}
            </button>
          </div>

          {/* Photo Thumbnail Grid */}
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-full aspect-square rounded-[14px] overflow-hidden border border-black/10 group shadow-xs"
                >
                  <Image src={url} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square rounded-[14px] border-2 border-dashed border-black/15 flex flex-col items-center justify-center text-muted hover:border-action hover:text-action transition-all bg-white/50"
              >
                <UploadCloud className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1">+ Add</span>
              </button>
            </div>
          )}

          {/* Location Name Customization */}
          <div className="bg-white rounded-[22px] p-4 shadow-card border border-black/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-ink flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Location / Spot Name</span>
              </label>
              <span className="text-[10px] font-bold text-muted">Confirmed spot</span>
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={destinationName || 'Spot or location name'}
              className="w-full text-xs font-bold text-ink bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted/50"
            />
          </div>

          {/* Add a Note Box */}
          <div className="bg-white rounded-[22px] p-4 shadow-card border border-black/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-ink">Add a Note</label>
              <span className="text-[10px] font-bold text-muted">{note.length}/200</span>
            </div>
            <textarea
              rows={3}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made this stop unforgettable?"
              required
              className="w-full text-xs text-ink/90 bg-transparent focus:outline-none resize-none leading-relaxed placeholder:text-muted/50"
            />
          </div>

          {/* Actual Spending Input */}
          <div className="bg-white rounded-[22px] p-4 shadow-card border border-black/5 flex items-center justify-between">
            <div>
              <label className="text-xs font-black text-ink flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-action" />
                Actual Spending
              </label>
              <p className="text-[10px] text-muted mt-0.5">Recorded for trip budget summary</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-xs font-black text-slate-900">₹</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={actualSpend === '' ? '' : actualSpend}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  if (clean === '') {
                    setActualSpend('');
                    return;
                  }
                  const stripped = clean.replace(/^0+(?=\d)/, '');
                  setActualSpend(parseInt(stripped, 10));
                }}
                onBlur={() => {
                  if (actualSpend === '') setActualSpend(0);
                }}
                placeholder="0"
                required
                className="w-16 text-xs font-black text-slate-900 bg-transparent focus:outline-none text-right"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all rounded-full text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md mt-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Mission...</span>
              </>
            ) : (
              <>
                <span>Submit & Continue</span>
                <Sparkles className="w-5 h-5 text-reward-gold" />
              </>
            )}
          </button>
        </form>
      </div>
    </MobileShell>
  );
}
