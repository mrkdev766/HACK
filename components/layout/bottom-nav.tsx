'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BookOpen, User, Globe } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';

interface BottomNavProps {
  tripId?: string;
}

export function BottomNav({ tripId }: BottomNavProps) {
  const pathname = usePathname();
  const { activeTripId } = useAuth();

  const currentTripId =
    tripId ||
    activeTripId ||
    (typeof window !== 'undefined' ? localStorage.getItem('wanderly_active_trip_id') : null);

  const tabs = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Adventure',
      href: currentTripId ? `/trip/${currentTripId}` : '/plan',
      icon: Compass,
    },
    {
      name: 'Discover',
      href: '/discover',
      icon: Globe,
    },
    {
      name: 'Journal',
      href: currentTripId ? `/trip/${currentTripId}/journal` : '/journal',
      icon: BookOpen,
    },
    {
      name: 'Profile',
      href: currentTripId ? `/trip/${currentTripId}/profile` : '/profile',
      icon: User,
    },
  ];

  const isTabActive = (name: string) => {
    if (!pathname) return false;

    if (name === 'Home') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (name === 'Adventure') {
      return (
        pathname === '/plan' ||
        (pathname.startsWith('/trip/') &&
          !pathname.includes('/journal') &&
          !pathname.includes('/profile') &&
          !pathname.includes('/complete'))
      );
    }
    if (name === 'Discover') {
      return pathname === '/discover' || pathname.startsWith('/discover');
    }
    if (name === 'Journal') {
      return pathname === '/journal' || pathname.includes('/journal');
    }
    if (name === 'Profile') {
      return pathname === '/profile' || pathname.includes('/profile');
    }
    return false;
  };

  const isDarkPage =
    pathname?.startsWith('/trip/') &&
    !pathname.includes('/journal') &&
    !pathname.includes('/profile') &&
    !pathname.includes('/place') &&
    !pathname.includes('/mission') &&
    !pathname.includes('/complete');

  return (
    <div className="w-full px-4 pb-3 pt-1 shrink-0 z-40 select-none">
      <nav
        className={`w-full h-16 backdrop-blur-xl rounded-[28px] px-2 flex items-center justify-around transition-colors ${
          isDarkPage
            ? 'bg-slate-900/90 border border-slate-800 shadow-[0_12px_28px_-5px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border border-slate-200/90 shadow-[0_12px_28px_-5px_rgba(15,23,42,0.08)]'
        }`}
      >
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.name);

          return (
            <Link
              key={idx}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 group"
            >
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? isDarkPage
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-xs'
                      : 'bg-emerald-50 text-emerald-600 shadow-xs'
                    : isDarkPage
                    ? 'text-slate-400 group-hover:text-slate-200'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-none ${
                  isActive
                    ? isDarkPage
                      ? 'font-bold text-emerald-400'
                      : 'font-bold text-emerald-600'
                    : 'font-medium text-slate-400'
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
