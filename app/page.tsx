'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mountain, ArrowRight, User, Loader2 } from 'lucide-react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { useAuth } from '@/features/auth/auth-context';

export default function WelcomePage() {
  const router = useRouter();
  const { loginGuest, user, activeTripId } = useAuth();

  const [step, setStep] = useState<'intro' | 'username'>('intro');
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetStarted = () => {
    if (user && activeTripId) {
      router.push(`/trip/${activeTripId}`);
      return;
    }
    if (user) {
      router.push('/dashboard');
      return;
    }
    setStep('username');
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Please enter a username of at least 2 characters');
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

  // SCREEN 1: Welcome Intro
  if (step === 'intro') {
    return (
      <MobileShell theme="forest">
        <div className="relative flex-1 flex flex-col justify-between p-6 select-none overflow-hidden">
          {/* Cinematic Background Travel Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
              alt="Mountain adventure"
              fill
              priority
              className="object-cover scale-105"
            />
            {/* Rich gradient overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#091a13]/85 via-black/40 to-[#091a13]/90" />
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex flex-col items-center pt-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-3 shadow-lg">
              <Mountain className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display">
              Wanderly
            </h1>
            <p className="text-xs text-white/80 font-medium tracking-wide mt-1">
              Curated mystery travel itineraries
            </p>
          </div>

          {/* Bottom Call to Action */}
          <div className="relative z-10 flex flex-col gap-4 pb-4">
            <button
              onClick={handleGetStarted}
              className="w-full h-14 bg-white hover:bg-slate-100 text-[#091a13] font-black text-base rounded-pill flex items-center justify-center gap-2 shadow-2xl active:scale-98 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <p className="text-[11px] text-center text-white/60">
              Instant guest session • No passwords required
            </p>
          </div>
        </div>
      </MobileShell>
    );
  }

  // SCREEN 2: Welcome Back & Username Step (Original Clean UI)
  return (
    <MobileShell theme="cream">
      <div className="flex-1 flex flex-col justify-between bg-[#F7F4EA] text-ink p-6 select-none overflow-y-auto">
        {/* Top Header */}
        <div className="pt-6">
          <button
            onClick={() => setStep('intro')}
            className="text-xs font-bold text-muted hover:text-ink mb-6 flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>

          <h2 className="text-2xl font-black text-ink font-display tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Your next adventure is just one step away.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUsernameSubmit} className="mt-6 flex flex-col gap-4">
            <div className="bg-white rounded-[20px] p-3.5 px-4 shadow-card border border-black/5 flex items-center gap-3">
              <User className="w-5 h-5 text-muted" />
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username"
                maxLength={24}
                required
                className="w-full bg-transparent text-sm font-bold text-ink focus:outline-none placeholder:text-muted/60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-forest hover:bg-forest-light active:scale-98 transition-all rounded-pill text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg mt-2 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entering Adventure...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cute hand-written quote and pine forest illustration at bottom */}
        <div className="flex flex-col items-center pt-8 pb-4 text-center">
          <p className="text-xs font-semibold text-action italic tracking-wide font-display -rotate-3 mb-4">
            Same you, new places...
          </p>

          {/* Forest Graphic Simulation */}
          <div className="w-full h-28 relative opacity-40">
            <svg
              className="w-full h-full text-forest"
              viewBox="0 0 300 100"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              <polygon points="20,100 40,30 60,100" />
              <polygon points="50,100 75,20 100,100" />
              <polygon points="90,100 115,35 140,100" />
              <polygon points="130,100 160,15 190,100" />
              <polygon points="180,100 205,30 230,100" />
              <polygon points="220,100 250,25 280,100" />
            </svg>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
