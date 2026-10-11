'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Loader2 } from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { useAuth } from '@/features/auth/auth-context';

export default function WelcomePage() {
  const router = useRouter();
  const { loginGuest, user, activeTripId } = useAuth();

  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExploring = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If already logged in, redirect directly
    if (user && activeTripId) {
      router.push(`/trip/${activeTripId}`);
      return;
    }
    if (user) {
      router.push('/dashboard');
      return;
    }

    const trimmed = usernameInput.trim() || `wanderer_${Math.floor(1000 + Math.random() * 9000)}`;

    if (trimmed.length < 2) {
      setError('Please enter a name of at least 2 characters');
      return;
    }

    setIsLoading(true);

    const result = await loginGuest(trimmed);

    if (!result.success) {
      setError(result.error || 'Failed to initialize session');
      setIsLoading(false);
      return;
    }

    if (result.activeTripId) {
      router.push(`/trip/${result.activeTripId}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <MobileShell theme="dark">
      <div className="relative flex-1 flex flex-col justify-between select-none overflow-y-auto min-h-full bg-[#0F172A] text-white">
        {/* Background Image: Mountain Sunset Overlook from Image 1 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/wanderly_hero.png"
            alt="Wanderly Mountain Sunset"
            fill
            priority
            className="object-cover object-center scale-105"
          />
          {/* Subtle gradient scrim for text readability & focus */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/85" />
        </div>

        {/* Top Header Branding Section (Matches Image 1 Concept) */}
        <div className="relative z-10 flex flex-col items-center text-center pt-12 px-6">
          {/* Mountain Peak & Sun Logo Icon */}
          <div className="w-16 h-14 flex items-center justify-center text-white mb-2 drop-shadow-lg">
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 100 65"
              fill="currentColor"
            >
              {/* Sun */}
              <circle cx="78" cy="14" r="6" fill="white" />
              {/* Left Mountain */}
              <path d="M15 52 L45 15 L62 38 L48 52 Z" />
              {/* Main Peak */}
              <path d="M38 52 L62 10 L88 52 Z" />
              {/* Curved Path Cutout */}
              <path
                d="M25 55 Q 50 42, 75 55 Q 50 48, 25 55"
                fill="white"
                className="opacity-90"
              />
            </svg>
          </div>

          {/* Brand Name */}
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans drop-shadow-md">
            Wanderly
          </h1>
          
          {/* Tagline matching Image 1 */}
          <p className="text-[11px] sm:text-xs font-extrabold text-white/90 tracking-[0.28em] uppercase mt-2 drop-shadow-sm">
            EXPLORE &nbsp;•&nbsp; PLAN &nbsp;•&nbsp; EXPERIENCE
          </p>

          <p className="text-xs font-semibold text-emerald-300 tracking-wider uppercase mt-3 bg-slate-950/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            AI Surprise Adventures
          </p>
        </div>

        {/* Bottom Area: Stylized Slogan & Interactive Form Card */}
        <div className="relative z-10 p-5 sm:p-6 pb-8 space-y-3">
          {/* Slogan Flourish matching Image 1 */}
          <div className="flex justify-end px-2">
            <div className="text-right">
              <span className="font-serif italic text-xl sm:text-2xl font-bold text-white drop-shadow-lg block leading-tight tracking-tight">
                More Places
              </span>
              <span className="font-serif italic text-xl sm:text-2xl font-bold text-white drop-shadow-lg block leading-tight tracking-tight border-b-2 border-white/80 pb-0.5 inline-block">
                More You
              </span>
            </div>
          </div>

          {/* Bottom Card Form */}
          <div className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-2xl shadow-slate-950/40 border border-slate-100/80 space-y-4 backdrop-blur-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                What should we call you?
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Enter your name to start your mystery adventure
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200/90 rounded-2xl text-xs text-red-700 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleStartExploring} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl py-3.5 px-4 flex items-center gap-3 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Your name"
                  maxLength={24}
                  className="w-full bg-transparent text-sm font-extrabold text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 min-h-[52px] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all rounded-full text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-slate-950/25 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Entering Adventure...</span>
                  </>
                ) : (
                  <>
                    <span>Start Exploring</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
