import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FREE_DAILY_LIMIT = 1;
const PRO_MONTHLY_LIMIT = 30;

export type CreditType = 'voice_bonus' | 'daily_bonus' | 'monthly' | 'none';

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
 * Calculate milliseconds until midnight in user's local timezone
 */
const getMsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

/**
 * Get current billing period based on subscription start date
 * Returns { start: YYYY-MM-DD, end: YYYY-MM-DD }
 */
const getCurrentBillingPeriod = (subscriptionStartedAt: Date | null): { start: string; end: string } => {
  const now = new Date();
  
  if (!subscriptionStartedAt) {
    // Default to first of current month if no subscription date
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDate(start),
      end: formatDate(end),
    };
  }
  
  // Calculate billing period based on subscription start day
  const subDay = subscriptionStartedAt.getDate();
  let periodStart: Date;
  let periodEnd: Date;
  
  // If we're before the subscription day this month, the period started last month
  if (now.getDate() < subDay) {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, subDay);
    periodEnd = new Date(now.getFullYear(), now.getMonth(), subDay - 1);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), subDay);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, subDay - 1);
  }
  
  // Handle edge case where subDay doesn't exist in a month (e.g., 31st in February)
  if (periodStart.getDate() !== subDay) {
    // Adjust to last day of previous month
    periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  }
  
  return {
    start: formatDate(periodStart),
    end: formatDate(periodEnd),
  };
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate days until billing period reset
 */
const getDaysUntilReset = (periodEnd: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because it resets day after end
};

export const useDailyAnalysisLimit = () => {
  const { user } = useAuth();
  const { effectiveTier, effectiveHasFullAccess, impersonation, loading: roleLoading } = useRole();
  const { isPro: isProFromSubscription, loading: subscriptionLoading } = useSubscription();
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [dailyBonusUsed, setDailyBonusUsed] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayLocalDate());
  const [billingPeriod, setBillingPeriod] = useState<{ start: string; end: string } | null>(null);
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<Date | null>(null);
  const [voiceBonusRemaining, setVoiceBonusRemaining] = useState(0);

  // Wait for both contexts to finish loading before determining isPro
  const contextsLoading = roleLoading || subscriptionLoading;
  
  // Check both user_roles (effectiveTier) AND user_subscriptions (isProFromSubscription)
  const isPro = effectiveTier === 'premium' || effectiveTier === 'developer' || isProFromSubscription;
  const hasUnlimitedAccess = effectiveHasFullAccess && !impersonation.active;
  
  // Overall loading state - contexts must load first, then usage data
  const loading = contextsLoading || usageLoading;
  
  // Pro users: 30 monthly + 1 daily bonus + voice bonus
  // Free users: 1 daily + voice bonus
  const monthlyRemaining = isPro ? Math.max(0, PRO_MONTHLY_LIMIT - monthlyCount) : 0;
  const dailyBonusRemaining = isPro && !dailyBonusUsed ? 1 : 0;
  const freeRemaining = !isPro && !dailyBonusUsed ? 1 : 0;
  
  const totalRemaining = isPro 
    ? monthlyRemaining + dailyBonusRemaining + voiceBonusRemaining
    : freeRemaining + voiceBonusRemaining;
  
  const canAnalyze = hasUnlimitedAccess || totalRemaining > 0;

  // Fetch subscription start date
  const fetchSubscriptionDate = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('subscription_started_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription date:', error);
        return null;
      }

      if (data?.subscription_started_at) {
        const date = new Date(data.subscription_started_at);
        setSubscriptionStartedAt(date);
        return date;
      }
    } catch (err) {
      console.error('Error fetching subscription date:', err);
    }
    return null;
  }, [user]);

  // Fetch usage based on tier
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageLoading(false);
      return;
    }

    // Don't fetch if contexts are still loading
    if (contextsLoading) {
      return;
    }

    try {
      const todayDate = getTodayLocalDate();
      setCurrentDate(todayDate);

      // Fetch voice bonus remaining from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('voice_bonus_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setVoiceBonusRemaining(profileData?.voice_bonus_remaining ?? 0);
      }

      // Always fetch daily usage (for bonus tracking)
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_analysis_usage')
        .select('analysis_count')
        .eq('user_id', user.id)
        .eq('usage_date', todayDate)
        .maybeSingle();

      if (dailyError) {
        console.error('Error fetching daily usage:', dailyError);
      }

      if (isPro) {
        // Fetch subscription date and monthly usage
        const subDate = await fetchSubscriptionDate();
        const period = getCurrentBillingPeriod(subDate);
        setBillingPeriod(period);

        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_analysis_usage')
          .select('analysis_count')
          .eq('user_id', user.id)
          .eq('billing_period_start', period.start)
          .maybeSingle();

        if (monthlyError) {
          console.error('Error fetching monthly usage:', monthlyError);
          setMonthlyCount(0);
        } else {
          setMonthlyCount(monthlyData?.analysis_count ?? 0);
        }

        // For pro users, daily count tracks bonus usage (1 = used, 0 = available)
        setDailyBonusUsed((dailyData?.analysis_count ?? 0) >= 1);
      } else {
        // Free users only use daily
        setMonthlyCount(0);
        setDailyBonusUsed((dailyData?.analysis_count ?? 0) >= 1);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setMonthlyCount(0);
      setDailyBonusUsed(false);
      setVoiceBonusRemaining(0);
    } finally {
      setUsageLoading(false);
    }
  }, [user, isPro, contextsLoading, fetchSubscriptionDate]);


  // Decrement usage (for cancelled analyses)
  const decrementUsage = useCallback(async (creditUsed?: CreditType): Promise<boolean> => {
    if (!user) return false;

    // Users with unlimited access don't need to track usage
    if (hasUnlimitedAccess) return true;

    // If no credit type specified, nothing to restore
    if (!creditUsed || creditUsed === 'none') return true;

    try {
      const todayDate = getTodayLocalDate();

      if (creditUsed === 'voice_bonus') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('voice_bonus_remaining')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          const { error } = await supabase
            .from('profiles')
            .update({ voice_bonus_remaining: profileData.voice_bonus_remaining + 1 })
            .eq('user_id', user.id);

          if (!error) {
            setVoiceBonusRemaining(prev => prev + 1);
            return true;
          }
        }
        return false;
      }

      if (creditUsed === 'daily_bonus') {
        const { data: existing } = await supabase
          .from('daily_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('usage_date', todayDate)
          .maybeSingle();

        if (existing && existing.analysis_count > 0) {
          const { error } = await supabase
            .from('daily_analysis_usage')
            .update({ analysis_count: existing.analysis_count - 1 })
            .eq('id', existing.id);

          if (!error) {
            setDailyBonusUsed(false);
            return true;
          }
        }
        return false;
      }

      if (creditUsed === 'monthly') {
        const subDate = subscriptionStartedAt || (await fetchSubscriptionDate());
        const period = getCurrentBillingPeriod(subDate);

        const { data: existing } = await supabase
          .from('monthly_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('billing_period_start', period.start)
          .maybeSingle();

        if (existing && existing.analysis_count > 0) {
          const { error } = await supabase
            .from('monthly_analysis_usage')
            .update({ analysis_count: existing.analysis_count - 1 })
            .eq('id', existing.id);

          if (!error) {
            setMonthlyCount(existing.analysis_count - 1);
            return true;
          }
        }
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error decrementing usage:', err);
      return false;
    }
  }, [user, hasUnlimitedAccess, subscriptionStartedAt, fetchSubscriptionDate]);

  // Increment the usage count - returns the type of credit used
  const incrementUsage = useCallback(async (): Promise<{ success: boolean; creditUsed: CreditType }> => {
    if (!user) return { success: false, creditUsed: 'none' };

    // Users with unlimited access don't need to track usage
    if (hasUnlimitedAccess) return { success: true, creditUsed: 'none' };

    try {
      const todayDate = getTodayLocalDate();

      // Use voice bonus first (for both free and pro users)
      if (voiceBonusRemaining > 0) {
        const { error } = await supabase
          .from('profiles')
          .update({ voice_bonus_remaining: voiceBonusRemaining - 1 })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error decrementing voice bonus:', error);
          return { success: false, creditUsed: 'none' };
        }

        setVoiceBonusRemaining(prev => prev - 1);
        return { success: true, creditUsed: 'voice_bonus' };
      }

      if (isPro) {
        // Pro user logic: use daily bonus first, then monthly
        if (!dailyBonusUsed) {
          // Use daily bonus first
          const { data: existing } = await supabase
            .from('daily_analysis_usage')
            .select('id, analysis_count')
            .eq('user_id', user.id)
            .eq('usage_date', todayDate)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from('daily_analysis_usage')
              .update({ analysis_count: existing.analysis_count + 1 })
              .eq('id', existing.id);

            if (error) {
              console.error('Error updating daily usage:', error);
              return { success: false, creditUsed: 'none' };
            }
          } else {
            const { error } = await supabase
              .from('daily_analysis_usage')
              .insert({
                user_id: user.id,
                usage_date: todayDate,
                analysis_count: 1,
              });

            if (error) {
              console.error('Error inserting daily usage:', error);
              return { success: false, creditUsed: 'none' };
            }
          }

          setDailyBonusUsed(true);
          return { success: true, creditUsed: 'daily_bonus' };
        }

        // Daily bonus used, use monthly allocation
        if (monthlyRemaining <= 0) {
          return { success: false, creditUsed: 'none' };
        }

        const subDate = subscriptionStartedAt || (await fetchSubscriptionDate());
        const period = getCurrentBillingPeriod(subDate);

        const { data: existing } = await supabase
          .from('monthly_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('billing_period_start', period.start)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('monthly_analysis_usage')
            .update({ analysis_count: existing.analysis_count + 1 })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating monthly usage:', error);
            return { success: false, creditUsed: 'none' };
          }

          setMonthlyCount(existing.analysis_count + 1);
        } else {
          const { error } = await supabase
            .from('monthly_analysis_usage')
            .insert({
              user_id: user.id,
              billing_period_start: period.start,
              billing_period_end: period.end,
              analysis_count: 1,
            });

          if (error) {
            console.error('Error inserting monthly usage:', error);
            return { success: false, creditUsed: 'none' };
          }

          setMonthlyCount(1);
        }

        // Track analysis activity (non-blocking)
        const userId = user.id;
        (async () => {
          try {
            await supabase
              .from('user_activity')
              .insert({
                user_id: userId,
                activity_type: 'analysis',
                metadata: { tier: 'pro' },
              });
          } catch (err) {
            console.error('Failed to track analysis:', err);
          }
        })();

        return { success: true, creditUsed: 'monthly' };
      } else {
        // Free user: track daily usage only
        if (dailyBonusUsed) {
          return { success: false, creditUsed: 'none' };
        }

        const { data: existing } = await supabase
          .from('daily_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('usage_date', todayDate)
          .maybeSingle();

        if (existing) {
          if (existing.analysis_count >= FREE_DAILY_LIMIT) {
            return { success: false, creditUsed: 'none' };
          }

          const { error } = await supabase
            .from('daily_analysis_usage')
            .update({ analysis_count: existing.analysis_count + 1 })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating daily usage:', error);
            return { success: false, creditUsed: 'none' };
          }
        } else {
          const { error } = await supabase
            .from('daily_analysis_usage')
            .insert({
              user_id: user.id,
              usage_date: todayDate,
              analysis_count: 1,
            });

          if (error) {
            console.error('Error inserting daily usage:', error);
            return { success: false, creditUsed: 'none' };
          }
        }

        setDailyBonusUsed(true);

        // Track analysis activity (non-blocking)
        const userId = user.id;
        (async () => {
          try {
            await supabase
              .from('user_activity')
              .insert({
                user_id: userId,
                activity_type: 'analysis',
                metadata: { tier: 'free' },
              });
          } catch (err) {
            console.error('Failed to track analysis:', err);
          }
        })();

        return { success: true, creditUsed: 'daily_bonus' };
      }
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return { success: false, creditUsed: 'none' };
    }
  }, [user, isPro, hasUnlimitedAccess, dailyBonusUsed, monthlyRemaining, voiceBonusRemaining, subscriptionStartedAt, fetchSubscriptionDate]);

  // Fetch usage on mount and when user/tier changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Set up timer to refresh at midnight (daily bonus resets)
  useEffect(() => {
    const msUntilMidnight = getMsUntilMidnight();

    const timer = setTimeout(() => {
      setDailyBonusUsed(false);
      setCurrentDate(getTodayLocalDate());
      fetchUsage();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentDate, fetchUsage]);

  // Calculate reset info
  const getResetInfo = () => {
    if (isPro && billingPeriod) {
      const daysUntil = getDaysUntilReset(billingPeriod.end);
      return {
        type: 'monthly' as const,
        daysUntilReset: daysUntil,
        periodEnd: billingPeriod.end,
        dailyBonusAvailable: !dailyBonusUsed,
      };
    }
    return {
      type: 'daily' as const,
      daysUntilReset: 1,
      periodEnd: currentDate,
      dailyBonusAvailable: !dailyBonusUsed,
    };
  };

  return {
    canAnalyze,
    remainingAnalyses: totalRemaining,
    analysisCount: isPro ? monthlyCount : (dailyBonusUsed ? 1 : 0),
    limit: isPro ? PRO_MONTHLY_LIMIT : FREE_DAILY_LIMIT,
    dailyLimit: FREE_DAILY_LIMIT,
    monthlyLimit: PRO_MONTHLY_LIMIT,
    loading,
    incrementUsage,
    decrementUsage,
    refetch: fetchUsage,
    isPro,
    hasUnlimitedAccess,
    resetInfo: getResetInfo(),
    // Pro-specific info
    monthlyRemaining,
    dailyBonusAvailable: !dailyBonusUsed,
    // Voice bonus info
    voiceBonusRemaining,
  };
};