import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';

const FREE_DAILY_LIMIT = 1;
const PRO_MONTHLY_LIMIT = 30;

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
  const { effectiveTier, effectiveHasFullAccess, impersonation } = useRole();
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayLocalDate());
  const [billingPeriod, setBillingPeriod] = useState<{ start: string; end: string } | null>(null);
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<Date | null>(null);

  const isPro = effectiveTier === 'premium' || effectiveTier === 'developer';
  const hasUnlimitedAccess = effectiveHasFullAccess && !impersonation.active;
  
  const currentLimit = isPro ? PRO_MONTHLY_LIMIT : FREE_DAILY_LIMIT;
  const canAnalyze = hasUnlimitedAccess || analysisCount < currentLimit;
  const remainingAnalyses = Math.max(0, currentLimit - analysisCount);

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
      setLoading(false);
      return;
    }

    try {
      if (isPro) {
        // Fetch subscription date first
        const subDate = await fetchSubscriptionDate();
        const period = getCurrentBillingPeriod(subDate);
        setBillingPeriod(period);

        // Fetch monthly usage
        const { data, error } = await supabase
          .from('monthly_analysis_usage')
          .select('analysis_count')
          .eq('user_id', user.id)
          .eq('billing_period_start', period.start)
          .maybeSingle();

        if (error) {
          console.error('Error fetching monthly usage:', error);
          setAnalysisCount(0);
        } else {
          setAnalysisCount(data?.analysis_count ?? 0);
        }
      } else {
        // Fetch daily usage for free users
        const todayDate = getTodayLocalDate();
        setCurrentDate(todayDate);

        const { data, error } = await supabase
          .from('daily_analysis_usage')
          .select('analysis_count')
          .eq('user_id', user.id)
          .eq('usage_date', todayDate)
          .maybeSingle();

        if (error) {
          console.error('Error fetching daily usage:', error);
          setAnalysisCount(0);
        } else {
          setAnalysisCount(data?.analysis_count ?? 0);
        }
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setAnalysisCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, isPro, fetchSubscriptionDate]);

  // Increment the usage count
  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Users with unlimited access don't need to track usage
    if (hasUnlimitedAccess) return true;

    try {
      if (isPro) {
        // Pro user: track monthly usage
        const subDate = subscriptionStartedAt || (await fetchSubscriptionDate());
        const period = getCurrentBillingPeriod(subDate);

        const { data: existing } = await supabase
          .from('monthly_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('billing_period_start', period.start)
          .maybeSingle();

        if (existing) {
          if (existing.analysis_count >= PRO_MONTHLY_LIMIT) {
            return false;
          }

          const { error } = await supabase
            .from('monthly_analysis_usage')
            .update({ analysis_count: existing.analysis_count + 1 })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating monthly usage:', error);
            return false;
          }

          setAnalysisCount(existing.analysis_count + 1);
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
            return false;
          }

          setAnalysisCount(1);
        }
      } else {
        // Free user: track daily usage
        const todayDate = getTodayLocalDate();

        const { data: existing } = await supabase
          .from('daily_analysis_usage')
          .select('id, analysis_count')
          .eq('user_id', user.id)
          .eq('usage_date', todayDate)
          .maybeSingle();

        if (existing) {
          if (existing.analysis_count >= FREE_DAILY_LIMIT) {
            return false;
          }

          const { error } = await supabase
            .from('daily_analysis_usage')
            .update({ analysis_count: existing.analysis_count + 1 })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating daily usage:', error);
            return false;
          }

          setAnalysisCount(existing.analysis_count + 1);
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
            return false;
          }

          setAnalysisCount(1);
        }
      }

      return true;
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  }, [user, isPro, hasUnlimitedAccess, subscriptionStartedAt, fetchSubscriptionDate]);

  // Fetch usage on mount and when user/tier changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Set up timer to refresh at midnight for free users
  useEffect(() => {
    if (isPro) return;

    const msUntilMidnight = getMsUntilMidnight();

    const timer = setTimeout(() => {
      setAnalysisCount(0);
      setCurrentDate(getTodayLocalDate());
      fetchUsage();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentDate, fetchUsage, isPro]);

  // Calculate reset info
  const getResetInfo = () => {
    if (isPro && billingPeriod) {
      const daysUntil = getDaysUntilReset(billingPeriod.end);
      return {
        type: 'monthly' as const,
        daysUntilReset: daysUntil,
        periodEnd: billingPeriod.end,
      };
    }
    return {
      type: 'daily' as const,
      daysUntilReset: 1,
      periodEnd: currentDate,
    };
  };

  return {
    canAnalyze,
    remainingAnalyses,
    analysisCount,
    limit: currentLimit,
    dailyLimit: FREE_DAILY_LIMIT,
    monthlyLimit: PRO_MONTHLY_LIMIT,
    loading,
    incrementUsage,
    refetch: fetchUsage,
    isPro,
    hasUnlimitedAccess,
    resetInfo: getResetInfo(),
  };
};