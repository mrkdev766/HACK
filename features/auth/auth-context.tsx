'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  activeTripId: string | null;
  loginGuest: (username: string) => Promise<{ success: boolean; activeTripId?: string | null; error?: string; profile?: Profile }>;
  logout: () => void;
  setActiveTripId: (tripId: string | null) => void;
  refreshUser: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage or auto-create guest
    const savedUser = localStorage.getItem('wanderly_user');
    const savedTripId = localStorage.getItem('wanderly_active_trip_id');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (err) {
        console.error('Failed to parse cached user:', err);
      }
      setIsLoading(false);
    } else {
      // Auto-provision a guest session so any page accessed directly works seamlessly
      const autoUsername = `wanderer_${Math.floor(1000 + Math.random() * 9000)}`;
      loginGuest(autoUsername).finally(() => {
        setIsLoading(false);
      });
    }

    if (savedTripId) {
      setActiveTripId(savedTripId);
    }
  }, []);

  const loginGuest = async (username: string) => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.profile);
      localStorage.setItem('wanderly_user', JSON.stringify(data.profile));

      if (data.activeTripId) {
        setActiveTripId(data.activeTripId);
        localStorage.setItem('wanderly_active_trip_id', data.activeTripId);
      }

      return { success: true, activeTripId: data.activeTripId, profile: data.profile };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setActiveTripId(null);
    localStorage.removeItem('wanderly_user');
    localStorage.removeItem('wanderly_active_trip_id');
    document.cookie = 'wanderly_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setUser(data.profile);
        localStorage.setItem('wanderly_user', JSON.stringify(data.profile));
      }
    } catch {
      // ignore
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wanderly-user-id': user?.id || '',
        },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update username' };
      }
      if (data.profile) {
        setUser(data.profile);
        localStorage.setItem('wanderly_user', JSON.stringify(data.profile));
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating username';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        activeTripId,
        loginGuest,
        logout,
        setActiveTripId: (id) => {
          setActiveTripId(id);
          if (id) localStorage.setItem('wanderly_active_trip_id', id);
          else localStorage.removeItem('wanderly_active_trip_id');
        },
        refreshUser,
        updateUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
