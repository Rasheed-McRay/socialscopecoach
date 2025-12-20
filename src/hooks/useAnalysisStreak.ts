import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
import { toast } from '@/hooks/use-toast';

interface StreakData {
  currentStreak: number;
  promoTrialClaimed: boolean;
  promoTrialExpiresAt: string | null;
  isPromoTrialActive: boolean;
  daysUntilPromoUnlock: number;
  loading: boolean;
  claimPromoTrial: () => Promise<boolean>;
  refreshStreak: () => Promise<void>;
}

const STREAK_REQUIRED = 3;
const PROMO_TRIAL_DAYS = 7;

export function useAnalysisStreak(): StreakData {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [promoTrialClaimed, setPromoTrialClaimed] = useState(false);
  const [promoTrialExpiresAt, setPromoTrialExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStreak = useCallback(async () => {
    if (!user) {
      setCurrentStreak(0);
      setLoading(false);
      return;
    }

    try {
      // Fetch usage data ordered by date descending
      const { data: usageData, error: usageError } = await supabase
        .from('daily_analysis_usage')
        .select('usage_date, analysis_count')
        .eq('user_id', user.id)
        .gt('analysis_count', 0)
        .order('usage_date', { ascending: false });

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
        setLoading(false);
        return;
      }

      // Fetch promo trial status from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('promo_trial_claimed, promo_trial_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        setPromoTrialClaimed(profileData.promo_trial_claimed || false);
        setPromoTrialExpiresAt(profileData.promo_trial_expires_at);
      }

      // Calculate streak from consecutive days
      if (!usageData || usageData.length === 0) {
        setCurrentStreak(0);
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let streak = 0;
      let checkDate = new Date(today);
      
      // Check if today has usage, if not start from yesterday
      const todayStr = today.toISOString().split('T')[0];
      const hasTodayUsage = usageData.some(d => d.usage_date === todayStr);
      
      if (!hasTodayUsage) {
        checkDate = new Date(yesterday);
      }

      // Count consecutive days
      for (let i = 0; i < usageData.length; i++) {
        const usageDate = new Date(usageData[i].usage_date);
        usageDate.setHours(0, 0, 0, 0);
        
        const checkDateStr = checkDate.toISOString().split('T')[0];
        const usageDateStr = usageDate.toISOString().split('T')[0];
        
        if (checkDateStr === usageDateStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (usageDate < checkDate) {
          // Found a gap, streak is broken
          break;
        }
      }

      setCurrentStreak(streak);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating streak:', error);
      setLoading(false);
    }
  }, [user]);

  const claimPromoTrial = useCallback(async (): Promise<boolean> => {
    if (!user || promoTrialClaimed || currentStreak < STREAK_REQUIRED) {
      return false;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PROMO_TRIAL_DAYS);

      const { error } = await supabase
        .from('profiles')
        .update({
          promo_trial_claimed: true,
          promo_trial_expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error claiming promo trial:', error);
        return false;
      }

      setPromoTrialClaimed(true);
      setPromoTrialExpiresAt(expiresAt.toISOString());

      // Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#22c55e'],
      });

      toast({
        title: "🎉 Congratulations!",
        description: "You've unlocked a free week of Pro! Enjoy unlimited analyses.",
      });

      return true;
    } catch (error) {
      console.error('Error claiming promo trial:', error);
      return false;
    }
  }, [user, promoTrialClaimed, currentStreak]);

  const refreshStreak = useCallback(async () => {
    await calculateStreak();
  }, [calculateStreak]);

  useEffect(() => {
    calculateStreak();
  }, [calculateStreak]);

  const isPromoTrialActive = Boolean(
    promoTrialExpiresAt && new Date(promoTrialExpiresAt) > new Date()
  );

  const daysUntilPromoUnlock = Math.max(0, STREAK_REQUIRED - currentStreak);

  return {
    currentStreak,
    promoTrialClaimed,
    promoTrialExpiresAt,
    isPromoTrialActive,
    daysUntilPromoUnlock,
    loading,
    claimPromoTrial,
    refreshStreak,
  };
}
