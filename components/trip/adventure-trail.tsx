'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { ClientDestinationView } from '@/types/trip';
import { ImageCuratorService } from '@/lib/media/image-curator';

interface AdventureTrailProps {
  tripId: string;
  destinations: ClientDestinationView[];
  totalPoints: number;
}

function DestinationTrailItem({
  dest,
  idx,
  tripId,
}: {
  dest: ClientDestinationView;
  idx: number;
  tripId: string;
}) {
  const isCurrent = dest.isCurrent;
  const isCompleted = dest.status === 'completed';
  const isLocked = dest.status === 'locked';

  const defaultImg = ImageCuratorService.getInstantImage(dest.name, idx);
  const [imageSrc, setImageSrc] = useState(dest.image_url || defaultImg);

  if (isLocked) {
    return (
      <div
        key={dest.id}
        className="w-full bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-[20px] p-4 flex items-center gap-3.5 opacity-70 shadow-lg"
      >
        {/* Lock icon circle */}
        <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
          <Lock className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold text-sm">
              {dest.sequence_number}. {dest.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {idx === 1 ? 'Locked • Complete stop #1 to unlock' : `Locked • Complete stop #${idx} to unlock`}
          </p>
        </div>
      </div>
    );
  }

  // Unlocked or Completed Destination Card
  const href = `/trip/${tripId}/place/${dest.id}`;

  return (
    <Link
      key={dest.id}
      href={href}
      className={`group w-full transition-all duration-200 transform active:scale-98 rounded-[20px] p-3.5 flex items-center gap-3.5 shadow-xl relative overflow-hidden ${
        isCurrent
          ? 'bg-slate-900/95 border-2 border-emerald-500/90 ring-4 ring-emerald-500/15 shadow-[0_12px_30px_-5px_rgba(16,185,129,0.2)]'
          : 'bg-slate-900/80 border border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Highlight ribbon for current destination */}
      {isCurrent && (
        <div className="absolute top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping" />
          Current
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-2.5 right-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Completed
        </div>
      )}

      {/* Destination Image Thumbnail with fallback */}
      <div className="relative w-16 h-16 rounded-[14px] overflow-hidden shrink-0 shadow-md border border-slate-700/60 bg-slate-800">
        <Image
          src={imageSrc}
          alt={dest.name}
          fill
          unoptimized
          onError={() => setImageSrc(defaultImg)}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="64px"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-12">
        <h3 className="text-white font-serif font-medium text-base tracking-tight truncate drop-shadow-2xs">
          {dest.sequence_number}. {dest.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
          {dest.estimated_travel_minutes && (
            <span>{Math.round((dest.estimated_travel_minutes / 60) * 10) / 10 || 2} hrs</span>
          )}
          <span>•</span>
          <span>₹{dest.estimated_cost?.toLocaleString() || '2,000'}</span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

export function AdventureTrail({ tripId, destinations, totalPoints }: AdventureTrailProps) {
  return (
    <div className="relative w-full flex-1 flex flex-col py-6 px-5 select-none overflow-hidden bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#0B0F19]">
      {/* Atmospheric ambient glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at top, rgba(16, 185, 129, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Organic Curved Trail SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 400 650"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M 120 110 C 260 180, 80 280, 200 370 C 310 450, 100 520, 210 590"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="3.5"
          strokeDasharray="7 6"
          className="animate-route-dash"
        />
      </svg>

      {/* Destinations Stack */}
      <div className="relative z-10 flex flex-col gap-6">
        {destinations.map((dest, idx) => (
          <DestinationTrailItem
            key={dest.id}
            dest={dest}
            idx={idx}
            tripId={tripId}
          />
        ))}
      </div>

      {/* Clean bottom label */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
          Route Map
        </p>
      </div>
    </div>
  );
}
