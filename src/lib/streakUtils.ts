import { type CSSProperties } from 'react';

export interface FlameStyles {
  className: string;
  size: number;
  style: CSSProperties;
}

export interface MilestoneBadge {
  days: number;
  name: string;
  emoji: string;
  description: string;
}

export const MILESTONES: MilestoneBadge[] = [
  { days: 7, name: "Week Warrior", emoji: "🏅", description: "7 day streak achieved!" },
  { days: 14, name: "Two Week Titan", emoji: "⭐", description: "14 day streak achieved!" },
  { days: 30, name: "Monthly Master", emoji: "👑", description: "30 day streak achieved!" },
];

export function getFlameStyles(days: number): FlameStyles {
  if (days === 0) {
    return {
      className: "text-muted-foreground opacity-40",
      size: 24,
      style: {},
    };
  }
  if (days <= 2) {
    return {
      className: "text-orange-400 animate-pulse",
      size: 24,
      style: { animationDuration: "2s" },
    };
  }
  if (days <= 6) {
    return {
      className: "text-orange-500 animate-pulse",
      size: 28,
      style: { 
        animationDuration: "1s",
        filter: "drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))"
      },
    };
  }
  if (days <= 13) {
    return {
      className: "text-orange-500 animate-pulse",
      size: 32,
      style: { 
        animationDuration: "1s",
        filter: "drop-shadow(0 0 8px rgba(249, 115, 22, 0.7))"
      },
    };
  }
  if (days <= 29) {
    return {
      className: "text-amber-400 animate-pulse",
      size: 36,
      style: { 
        animationDuration: "1s",
        filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))"
      },
    };
  }
  // 30+ days - legendary
  return {
    className: "text-violet-400 animate-pulse",
    size: 40,
    style: { 
      animationDuration: "1s",
      filter: "drop-shadow(0 0 16px rgba(167, 139, 250, 0.9))"
    },
  };
}

export function getEarnedMilestones(currentStreak: number): MilestoneBadge[] {
  return MILESTONES.filter(m => currentStreak >= m.days);
}

export function getNextMilestone(currentStreak: number): MilestoneBadge | null {
  return MILESTONES.find(m => currentStreak < m.days) || null;
}
