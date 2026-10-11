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
        {/* Background Image: Scenic Mountain Valley Sunset */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
            alt="Wanderly Mountain Sunset"
            fill
            priority
            className="object-cover object-center scale-105"
          />
          {/* Subtle gradient scrim for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/90" />
        </div>

        {/* Top Header Branding Section */}
        <div className="relative z-10 flex flex-col items-center text-center pt-10 px-6">
          {/* Mountain & Path Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-3 shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 22h20L12 2z" />
              <path d="M12 2l4 8 4 12" />
              <circle cx="18" cy="6" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans drop-shadow-md">
            Wanderly
          </h1>
          
          <p className="text-xs font-bold text-emerald-300 tracking-wider uppercase mt-1">
            AI Surprise Adventures
          </p>

          <p className="text-sm font-medium text-slate-200/90 mt-4 leading-relaxed max-w-[260px] drop-shadow-xs">
            Real places. Simple plans. Big memories.
          </p>
        </div>

        {/* Bottom Interactive Sheet (Matches Image 1 Concept) */}
        <div className="relative z-10 p-5 sm:p-6 pb-8">
          <div className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-2xl shadow-slate-950/30 border border-slate-100/80 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                What should we call you?
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Enter your name to personalize your mystery route
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
