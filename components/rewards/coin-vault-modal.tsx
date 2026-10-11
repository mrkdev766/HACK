'use client';

import React, { useState } from 'react';
import {
  Coins,
  X,
  Sparkles,
  Award,
  CheckCircle2,
  Gift,
} from 'lucide-react';

export interface BadgeTier {
  id: string;
  name: string;
  minCoins: number;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Nomad',
    minCoins: 0,
    icon: '🥉',
    color: 'text-amber-700',
    borderColor: 'border-amber-700/30',
    bgColor: 'bg-amber-50',
    description: 'Fresh backpacker exploring uncharted trails',
  },
  {
    id: 'silver',
    name: 'Silver Coin Earner',
    minCoins: 200,
    icon: '🥈',
    color: 'text-slate-700',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-100',
    description: 'Pro bounty collector and route specialist',
  },
  {
    id: 'gold',
    name: 'Gold Trailblazer',
    minCoins: 500,
    icon: '🥇',
    color: 'text-amber-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    description: 'Master of mystery waypoints and cliff lookouts',
  },
  {
    id: 'diamond',
    name: 'Cosmic Explorer',
    minCoins: 1000,
    icon: '💎',
    color: 'text-cyan-600',
    borderColor: 'border-cyan-300',
    bgColor: 'bg-cyan-50',
    description: 'Elite nomad with supreme wanderlust prestige',
  },
];

export interface ClaimableTask {
  id: string;
  title: string;
  category: string;
  reward: number;
  description: string;
  icon: string;
}

export const CLAIMABLE_TASKS: ClaimableTask[] = [
  {
    id: 'welcome_grant',
    title: 'Nomad Welcome Bonus',
    category: 'Starter',
    reward: 100,
    description: 'Free onboarding bounty for every wanderer',
    icon: '🎒',
  },
  {
    id: 'silver_earner',
    title: 'Silver Coin Earner Drop',
    category: 'Special',
    reward: 150,
    description: 'Unlock your Silver Coin Earner status',
    icon: '🪙',
  },
  {
    id: 'daily_scout',
    title: 'Daily Trail Check-in',
    category: 'Daily',
    reward: 50,
    description: 'Log into Wanderly today to claim daily ration',
    icon: '⚡',
  },
  {
    id: 'kerala_expedition',
    title: 'Malabar Coast Explorer',
    category: 'Milestone',
    reward: 200,
    description: 'Surveyed the coastal cliffs & palm backwaters',
    icon: '🌴',
  },
  {
    id: 'hidden_gem_scout',
    title: 'Hidden Gem Discoverer',
    category: 'Quest',
    reward: 250,
    description: 'Found secret off-grid waypoints on the map',
    icon: '✨',
  },
];

interface CoinVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onCoinsChange: (newCoins: number) => void;
  activeBadge: string;
  onBadgeChange: (newBadge: string) => void;
}

export function CoinVaultModal({
  isOpen,
  onClose,
  coins,
  onCoinsChange,
  activeBadge,
  onBadgeChange,
}: CoinVaultModalProps) {
  const [claimedTasks, setClaimedTasks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wanderly_claimed_tasks');
        return saved ? JSON.parse(saved) : ['welcome_grant'];
      } catch {
        return ['welcome_grant'];
      }
    }
    return ['welcome_grant'];
  });

  const [activeTab, setActiveTab] = useState<'claim' | 'badges'>('claim');
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier =
    [...BADGE_TIERS].reverse().find((tier) => coins >= tier.minCoins) || BADGE_TIERS[0];

  const handleClaim = (task: ClaimableTask) => {
    if (claimedTasks.includes(task.id)) return;

    const newClaimed = [...claimedTasks, task.id];
    setClaimedTasks(newClaimed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wanderly_claimed_tasks', JSON.stringify(newClaimed));
    }

    const updatedCoins = coins + task.reward;
    onCoinsChange(updatedCoins);

    // Auto promote badge tier if threshold reached
    const eligibleTier = [...BADGE_TIERS].reverse().find((t) => updatedCoins >= t.minCoins);
    if (eligibleTier && eligibleTier.name !== activeBadge) {
      onBadgeChange(eligibleTier.name);
      setCelebrationMsg(`Promoted to ${eligibleTier.name}!`);
    } else {
      setCelebrationMsg(`+${task.reward} Coins Claimed!`);
    }

    setTimeout(() => {
      setCelebrationMsg(null);
    }, 2800);
  };

  const handleEquipBadge = (tier: BadgeTier) => {
    if (coins < tier.minCoins) return;
    onBadgeChange(tier.name);
    setCelebrationMsg(`Equipped ${tier.name}!`);
    setTimeout(() => {
      setCelebrationMsg(null);
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Sheet Grabber */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 shrink-0 sm:hidden" />

        {/* Clean Header Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Coin Vault
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Claim coins & unlock prestige badges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Balance & Active Badge Card */}
        <div className="px-5 pt-1 pb-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Balance
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  🪙 {coins}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Coins</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Equipped Badge
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs mt-1">
                <span className="text-xs">{currentTier.icon}</span>
                <span className="text-xs font-bold text-slate-800">{activeBadge}</span>
              </div>
            </div>
          </div>

          {/* Celebration Toast */}
          {celebrationMsg && (
            <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{celebrationMsg}</span>
            </div>
          )}

          {/* Segmented Pill Tab Controls */}
          <div className="flex bg-slate-100 p-1 rounded-full mt-3 text-xs font-bold">
            <button
              onClick={() => setActiveTab('claim')}
              className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'claim'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Claim Coins</span>
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Badges & Tiers</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
          {activeTab === 'claim' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-0.5">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Available Bounties
                </span>
                <span className="text-[10px]">
                  {claimedTasks.length} of {CLAIMABLE_TASKS.length} Claimed
                </span>
              </div>

              {CLAIMABLE_TASKS.map((task) => {
                const isClaimed = claimedTasks.includes(task.id);

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isClaimed
                        ? 'bg-slate-50/60 border-slate-200/50 opacity-60'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-base shrink-0">
                        {task.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {task.title}
                          </h4>
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaim(task)}
                      disabled={isClaimed}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
                        isClaimed
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xs active:scale-95 cursor-pointer font-extrabold'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Claimed</span>
                        </>
                      ) : (
                        <>
                          <span>+🪙 {task.reward}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 px-0.5 mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Prestige Tiers & Badges
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Earn coins through adventures to unlock higher status badges.
                </p>
              </div>

              {BADGE_TIERS.map((tier) => {
                const isUnlocked = coins >= tier.minCoins;
                const isEquipped = activeBadge === tier.name;

                return (
                  <div
                    key={tier.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-emerald-50/50 border-emerald-400/80 ring-1 ring-emerald-400/30 shadow-2xs'
                        : isUnlocked
                        ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-lg shrink-0">
                        {tier.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {tier.name}
                          </h4>
                          {isEquipped && (
                            <span className="text-[9px] font-extrabold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tier.description}
                        </p>
                        <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                          Requires: {tier.minCoins === 0 ? 'Free' : `${tier.minCoins} Coins`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEquipBadge(tier)}
                      disabled={!isUnlocked || isEquipped}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        isEquipped
                          ? 'bg-emerald-500 text-slate-950 cursor-default'
                          : isUnlocked
                          ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isEquipped ? 'Equipped' : isUnlocked ? 'Equip' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
