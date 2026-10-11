'use client';

import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
  theme?: 'forest' | 'cream' | 'dark' | 'cool';
}

export function MobileShell({ children, theme = 'cool' }: MobileShellProps) {
  const bgColors = {
    cool: 'bg-[#F8FAFC] text-slate-900',
    cream: 'bg-[#F8FAFC] text-slate-900',
    forest: 'bg-[#F8FAFC] text-slate-900',
    dark: 'bg-[#0B0F19] text-white',
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-slate-950 sm:bg-[#090D16] flex items-center justify-center sm:py-6 sm:px-4">
      {/* Phone container: full width/height on mobile, framed mockup on desktop */}
      <div
        className={`w-full min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:max-w-[440px] sm:rounded-[44px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.65)] sm:ring-8 sm:ring-slate-800/80 overflow-hidden relative flex flex-col ${bgColors[theme]}`}
      >
        {/* iOS style Top Status Bar (Only visible in Desktop Demo Frame) */}
        <div className={`hidden sm:flex w-full h-11 px-6 items-center justify-between text-xs font-semibold select-none z-50 shrink-0 ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
          <span className="tracking-tight text-[13px] font-bold">9:41</span>
          
          {/* Dynamic Island / Speaker notch */}
          <div className="w-24 h-4 bg-black/80 rounded-full mx-auto" />

          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <Battery className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Screen Content (100% native viewport on mobile) */}
        <div className="flex-1 flex flex-col overflow-y-auto relative">
          {children}
        </div>

        {/* Home indicator bar at bottom (Only visible in Desktop Demo Frame) */}
        <div className="hidden sm:flex w-full h-3 pb-1 justify-center items-center shrink-0 z-50 pointer-events-none">
          <div className={`w-32 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-slate-300'}`} />
        </div>
      </div>
    </div>
  );
}
