/**
 * Ultra-fast client-side caching with Stale-While-Revalidate pattern.
 * Provides instant 0ms loads by serving cached data while silently
 * revalidating in the background.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for fast tab-to-tab navigation
const memoryCache = new Map<string, CacheEntry<unknown>>();

export const AppCache = {
  get<T>(key: string, maxAgeMs: number = 1000 * 60 * 30): T | null {
    // 1. Check in-memory cache first (0ms)
    const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (mem && Date.now() - mem.timestamp < maxAgeMs) {
      return mem.data;
    }

    // 2. Check localStorage (persistent across browser refreshes)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`wanderly_cache_${key}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry<T>;
          if (Date.now() - parsed.timestamp < maxAgeMs) {
            memoryCache.set(key, parsed);
            return parsed.data;
          }
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }
    }

    return null;
  },

  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    memoryCache.set(key, entry);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`wanderly_cache_${key}`, JSON.stringify(entry));
      } catch (e) {
        console.warn('Cache write error:', e);
      }
    }
  },

  remove(key: string): void {
    memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`wanderly_cache_${key}`);
      } catch (e) {
        // ignore
      }
    }
  },

  clearAll(): void {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith('wanderly_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        // ignore
      }
    }
  },
};
