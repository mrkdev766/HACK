'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Calendar, Wallet, FileText, Globe, Sparkles } from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { BottomNav } from '@/components/layout/bottom-nav';
import { JournalEntry } from '@/types/database';
import { useAuth } from '@/features/auth/auth-context';
import { PublishQuestModal } from '@/components/discovery/publish-quest-modal';

export default function JourneyJournalPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'photos' | 'notes'>('photos');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);

  useEffect(() => {
    async function loadJournal() {
      try {
        const [journalRes, tripRes] = await Promise.all([
          fetch(`/api/trips/${tripId}/journal`, {
            headers: { 'x-wanderly-user-id': user?.id || '' },
          }),
          fetch(`/api/trips/${tripId}`, {
            headers: { 'x-wanderly-user-id': user?.id || '' },
          }),
        ]);

        const jData = await journalRes.json();
        const tData = await tripRes.json();

        if (jData.entries) setEntries(jData.entries);
        if (tData.data) {
          setTripData(tData.data);
          if (tData.data.trip?.public_title) {
            setPublishedTitle(tData.data.trip.public_title);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    if (tripId) loadJournal();
  }, [tripId, user?.id]);

  // Aggregate all photos from entries or fallback seed photos
  const allPhotos: { url: string; destName?: string; note?: string }[] = [];
  entries.forEach((entry) => {
    if (entry.photos) {
      entry.photos.forEach((p) => {
        allPhotos.push({
          url: p.storage_path,
          destName: entry.destination_name,
          note: entry.note,
        });
      });
    }
  });

  const destinationsForPublish = tripData?.destinations?.map((d: any) => {
    const entryForDest = entries.find((e) => e.destination_id === d.id);
    return {
      id: d.id,
      name: d.name,
      actual_spend: entryForDest?.actual_spend ?? d.actual_spend ?? d.estimated_cost,
      estimated_cost: d.estimated_cost,
      image_url: d.image_url,
      custom_notes: entryForDest?.note,
    };
  }) || [];

  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
        {/* Header with Publish Quest Action */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-black text-slate-900 font-display">
              Expedition Journal
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {allPhotos.length} Photos • ₹
              {entries.reduce((sum, e) => sum + (e.actual_spend || 0), 0)} Logged
            </p>
          </div>

          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Publish Quest to Public Discovery"
          >
            <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publish Quest</span>
          </button>
        </div>

        {/* Tab Toggle (Photos | Notes) */}
        <div className="px-5 pt-3 pb-2 flex justify-center">
          <div className="bg-slate-200/80 p-1 rounded-full flex w-full max-w-[280px]">
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'photos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Notes
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {activeTab === 'photos' ? (
            /* 3-Column Photo Grid or None empty state */
            allPhotos.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-ink">None</p>
                <p className="text-[11px] text-muted mt-0.5">No expedition photos captured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photo.url)}
                    className="relative aspect-square rounded-[16px] overflow-hidden shadow-card border border-black/5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Image
                      src={photo.url}
                      alt={`Memory ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="120px"
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Notes List View or None empty state */
            <div className="space-y-3">
              {entries.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-ink">None</p>
                  <p className="text-[11px] text-muted mt-0.5">No mission notes recorded yet.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-[20px] p-4 shadow-card border border-black/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-ink">
                        {entry.destination_name || 'Destination Stop'}
                      </span>
                      <span className="text-[10px] text-muted flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-action" /> ₹{entry.actual_spend}
                      </span>
                    </div>
                    <p className="text-xs text-ink/80 italic leading-relaxed">
                      &ldquo;{entry.note}&rdquo;
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          >
            <div className="relative max-w-sm w-full aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <Image src={selectedPhoto} alt="Full view" fill className="object-cover" />
            </div>
          </div>
        )}

        {/* Publish Quest Modal */}
        <PublishQuestModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          tripId={tripId}
          tripTitle={publishedTitle || tripData?.trip?.starting_location_name || 'Mystery Expedition'}
          destinations={destinationsForPublish}
          defaultVibe={tripData?.trip?.vibe || '🌴 Coastal Mist'}
          onPublished={(newTitle) => setPublishedTitle(newTitle)}
        />

        <BottomNav tripId={tripId} />
      </div>
    </MobileShell>
  );
}
