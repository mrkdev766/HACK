'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 60; // pixels to pull before triggering refresh
const MAX_PULL = 90; // maximum pull height

export function PullToRefresh({
  onRefresh,
  children,
  className = '',
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isRefreshing) return;
    const scrollContainer = containerRef.current;
    if (scrollContainer && scrollContainer.scrollTop <= 0) {
      startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || isRefreshing || disabled) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY.current;

    const scrollContainer = containerRef.current;
    if (scrollContainer && scrollContainer.scrollTop <= 0 && diff > 0) {
      // Elastic resistance
      const damped = Math.min(diff * 0.45, MAX_PULL);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
      isDragging.current = false;
    }
  };

  const executeRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(52); // Keep indicator visible during refresh
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      await onRefresh();
      setRefreshSuccess(true);
      setTimeout(() => {
        setRefreshSuccess(false);
        setIsRefreshing(false);
        setPullDistance(0);
      }, 400);
    } catch (e) {
      console.error('Refresh error:', e);
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      executeRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isReady = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      className={`relative flex-1 flex flex-col overflow-y-auto overscroll-y-contain ${className}`}
    >
      {/* Pull down indicator pill */}
      <div
        className="w-full flex items-center justify-center pointer-events-none transition-all duration-200 overflow-hidden shrink-0 z-30"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700/80 shadow-lg backdrop-blur-md text-[11px] font-bold">
          {refreshSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span className="text-emerald-400">Updated</span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="text-slate-300">Syncing...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-150"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                }}
              />
              <span className={isReady ? 'text-emerald-400' : 'text-slate-400'}>
                {isReady ? 'Release to refresh' : 'Pull down to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
