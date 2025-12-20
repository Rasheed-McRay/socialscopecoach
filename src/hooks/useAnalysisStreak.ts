import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';

const STREAK_REQUIRED = 3;
const TRIAL_DAYS = 7;

interface StreakData {
  currentStreak: number;
  canClaimTrial: boolean;
  trialActive: boolean;
  trialExpiry: Date | null;
  trialClaimed: boolean;
  daysUntilTrial: number;
  trialDaysRemaining: number;
  loading: boolean;
}

/**
 * Get today's date in the user's local timezone as YYYY-MM-DD
 */
const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate consecutive days with at least 1 analysis
 */
const calculateStreak = (usageDates: string[]): number => {
  if (usageDates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = [...usageDates].sort((a, b) => b.localeCompare(a));
  
  const today = getTodayLocalDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if streak starts from today or yesterday
  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterdayStr) {
    // Streak is broken
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(mostRecent);

  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrev = new Date(currentDate);
    expectedPrev.setDate(expectedPrev.getDate() - 1);
    const expectedPrevStr = `${expectedPrev.getFullYear()}-${String(expectedPrev.getMonth() + 1).padStart(2, '0')}-${String(expectedPrev.getDate()).padStart(2, '0')}`;

    if (sortedDates[i] === expectedPrevStr) {
      streak++;
      currentDate = expectedPrev;
    } else {
      break;
    }
  }

  return streak;
};

export const useAnalysisStreak = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    canClaimTrial: false,
    trialActive: false,
    trialExpiry: null,
    trialClaimed: false,
    daysUntilTrial: STREAK_REQUIRED,
    trialDaysRemaining: 0,
    loading: true,
  });

  const fetchStreakData = useCallback(async () => {
    if (!user) {
      setStreakData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch profile for promo trial status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('promo_trial_claimed, promo_trial_expires_at, current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const trialClaimed = profileData?.promo_trial_claimed ?? false;
      const trialExpiryStr = profileData?.promo_trial_expires_at;
      const cachedStreak = profileData?.current_streak ?? 0;
      
      let trialExpiry: Date | null = null;
      let trialActive = false;
      let trialDaysRemaining = 0;

      if (trialExpiryStr) {
        trialExpiry = new Date(trialExpiryStr);
        const now = new Date();
        if (trialExpiry > now) {
          trialActive = true;
          trialDaysRemaining = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Fetch usage dates from last 30 days to calculate streak
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;

      const { data: usageData, error: usageError } = await supabase
        .from('daily_analysis_usage')
        .select('usage_date')
        .eq('user_id', user.id)
        .gte('usage_date', thirtyDaysAgoStr)
        .gt('analysis_count', 0);

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
      }

      const usageDates = usageData?.map(d => d.usage_date) ?? [];
      const currentStreak = calculateStreak(usageDates);

      // Update cached streak in profile (non-blocking)
      if (currentStreak !== cachedStreak) {
        supabase
          .from('profiles')
          .update({ current_streak: currentStreak })
          .eq('user_id', user.id)
          .then(() => {});
      }

      const canClaimTrial = currentStreak >= STREAK_REQUIRED && !trialClaimed && !isPro;
      const daysUntilTrial = Math.max(0, STREAK_REQUIRED - currentStreak);

      setStreakData({
        currentStreak,
        canClaimTrial,
        trialActive,
        trialExpiry,
        trialClaimed,
        daysUntilTrial,
        trialDaysRemaining,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setStreakData(prev => ({ ...prev, loading: false }));
    }
  }, [user, isPro]);

  const claimTrial = useCallback(async (): Promise<boolean> => {
    if (!user || !streakData.canClaimTrial) return false;

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + TRIAL_DAYS);

      const { error } = await supabase
        .from('profiles')
        .update({
          promo_trial_claimed: true,
          promo_trial_expires_at: expiryDate.toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error claiming trial:', error);
        return false;
      }

      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#22d3ee', '#a855f7'],
      });

      toast({
        title: "🎉 Pro Trial Unlocked!",
        description: `You've earned 7 days of Pro access! Enjoy unlimited analyses.`,
      });

      // Refresh data
      setStreakData(prev => ({
        ...prev,
        canClaimTrial: false,
        trialActive: true,
        trialExpiry: expiryDate,
        trialClaimed: true,
        trialDaysRemaining: TRIAL_DAYS,
      }));

      return true;
    } catch (err) {
      console.error('Error claiming trial:', err);
      return false;
    }
  }, [user, streakData.canClaimTrial, toast]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return {
    ...streakData,
    claimTrial,
    refetch: fetchStreakData,
    STREAK_REQUIRED,
    TRIAL_DAYS,
  };
};