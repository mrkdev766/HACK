'use client';

import React, { useState } from 'react';
import { Sparkles, Compass, MapPin, Feather, Wind } from 'lucide-react';

const EXPEDITION_QUOTES = [
  '“Not all those who wander are lost.” — J.R.R. Tolkien',
  '“The road must be trodden with light feet and heavy wonder.”',
  '“Where the asphalt ends, the true journey begins.”',
  '“Collect horizons, not things.”',
  '“Follow the monsoon winds down the Malabar coast.”',
];

export function TravelMinimalDrawing() {
  const [quoteIdx, setQuoteIdx] = useState(0);

  const cycleQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % EXPEDITION_QUOTES.length);
  };

  return (
    <div className="w-full mt-6 select-none animate-fade-in">
      {/* Outer Card with minimalist border */}
      <div className="bg-white/70 backdrop-blur-sm rounded-[26px] p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] relative overflow-hidden group">
        {/* Subtle background topographic contour lines */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M-50,80 Q100,20 250,90 T500,40 M-30,140 Q120,80 270,160 T520,110 M-40,200 Q140,150 290,220 T530,180"
              stroke="#0F172A"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Section Header with Minimalist Tag */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Field Sketch • Survey 08
            </span>
          </div>

          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            8.73° N · 76.71° E
          </span>
        </div>

        {/* Main Minimal SVG Illustration Canvas */}
        <div
          onClick={cycleQuote}
          title="Click to draw next lore"
          className="w-full h-44 relative bg-slate-50/60 rounded-2xl border border-dashed border-slate-200/90 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400/60 transition-colors"
        >
          <svg
            viewBox="0 0 380 180"
            className="w-full h-full text-slate-800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid Coordinates Lines */}
            <line x1="20" y1="90" x2="360" y2="90" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="190" y1="15" x2="190" y2="165" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />

            {/* Rising Geometric Sun */}
            <circle cx="190" cy="72" r="28" stroke="#10B981" strokeWidth="1.2" strokeDasharray="4 2" />
            <circle cx="190" cy="72" r="14" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1" />
            <line x1="190" y1="36" x2="190" y2="40" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="190" y1="104" x2="190" y2="108" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="154" y1="72" x2="158" y2="72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="222" y1="72" x2="226" y2="72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />

            {/* Continuous Minimal Mountain Peaks */}
            <path
              d="M 25 145 L 85 85 L 125 125 L 175 60 L 225 115 L 265 80 L 320 145 L 355 145"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mountain Ridge Accent Lines */}
            <path
              d="M 85 85 L 95 145 M 175 60 L 170 145 M 265 80 L 280 145"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Shading Contour Hatching */}
            <path
              d="M 160 85 L 172 80 M 153 100 L 168 95 M 145 115 L 165 110 M 140 130 L 162 125"
              stroke="#CBD5E1"
              strokeWidth="0.9"
              strokeLinecap="round"
            />

            {/* Dashed Trekking Path winding through the valley */}
            <path
              d="M 35 155 Q 110 135 155 145 T 260 138 T 345 152"
              stroke="#10B981"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />

            {/* Minimal Hot Air Balloon Drifter */}
            <g transform="translate(62, 28) scale(0.9)">
              {/* Balloon envelope */}
              <ellipse cx="20" cy="18" rx="14" ry="18" stroke="#0F172A" strokeWidth="1.3" />
              <path d="M 10 18 C 10 26, 15 32, 20 34 C 25 32, 30 26, 30 18" stroke="#0F172A" strokeWidth="1.2" fill="none" />
              <line x1="16" y1="34" x2="16" y2="40" stroke="#94A3B8" strokeWidth="0.8" />
              <line x1="24" y1="34" x2="24" y2="40" stroke="#94A3B8" strokeWidth="0.8" />
              {/* Tiny basket */}
              <rect x="15" y="40" width="10" height="7" rx="1.5" stroke="#0F172A" strokeWidth="1.2" fill="#F8FAFC" />
              {/* Balloon stripes */}
              <path d="M 14 10 Q 20 18 20 34" stroke="#10B981" strokeWidth="0.9" />
              <path d="M 26 10 Q 20 18 20 34" stroke="#10B981" strokeWidth="0.9" />
            </g>

            {/* Floating Paper Plane drifting right */}
            <g transform="translate(290, 32) scale(0.85)">
              <path
                d="M 0 10 L 25 0 L 12 25 L 8 13 Z"
                stroke="#0F172A"
                strokeWidth="1.3"
                strokeLinejoin="round"
                fill="#FFFFFF"
              />
              <path d="M 8 13 L 25 0" stroke="#0F172A" strokeWidth="1" />
              {/* Flight trail */}
              <path
                d="M -20 18 Q -10 12 0 10"
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            </g>

            {/* Minimalist Celestial Stars */}
            {/* Star 1 */}
            <g transform="translate(130, 24)">
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            {/* Star 2 */}
            <g transform="translate(245, 26)">
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />
            </g>
            {/* Star 3 */}
            <circle cx="340" cy="70" r="1.5" fill="#0F172A" />
            <circle cx="45" cy="55" r="1.5" fill="#0F172A" />

            {/* Backwater / Lake Gentle Waves */}
            <path
              d="M 110 162 C 120 160, 130 164, 140 162 C 150 160, 160 164, 170 162"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M 210 163 C 220 161, 230 165, 240 163 C 250 161, 260 165, 270 163"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Miniature Canoe Silhouette on the water */}
            <path
              d="M 180 161 C 185 163, 195 163, 200 161 L 199 159 C 195 160, 185 160, 181 159 Z"
              fill="#0F172A"
            />
            <line x1="189" y1="156" x2="191" y2="164" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />

            {/* Elevation Marker */}
            <g transform="translate(175, 48)">
              <polygon points="0,0 -3,5 3,5" fill="#10B981" />
              <text x="7" y="5" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#0F172A">
                2,140m
              </text>
            </g>
          </svg>

          {/* Interactive Hint Indicator */}
          <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>touch to reflect</span>
          </span>
        </div>

        {/* Dynamic Wanderer's Lore Quote */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-700 leading-snug italic transition-all duration-300">
              {EXPEDITION_QUOTES[quoteIdx]}
            </p>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
              Wanderly Cartographic Archive • Malabar Range
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
