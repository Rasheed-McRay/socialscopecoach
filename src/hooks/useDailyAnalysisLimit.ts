import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const FREE_DAILY_LIMIT = 1;

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

export const useDailyAnalysisLimit = () => {
  const { user } = useAuth();
  const { canBypassRateLimits } = useFeatureAccess();
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayLocalDate());

  // Check if user can perform an analysis
  const canAnalyze = canBypassRateLimits() || analysisCount < FREE_DAILY_LIMIT;
  const remainingAnalyses = Math.max(0, FREE_DAILY_LIMIT - analysisCount);

  // Fetch today's usage
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const todayDate = getTodayLocalDate();
    setCurrentDate(todayDate);

    try {
      const { data, error } = await supabase
        .from('daily_analysis_usage')
        .select('analysis_count')
        .eq('user_id', user.id)
        .eq('usage_date', todayDate)
        .maybeSingle();

      if (error) {
        console.error('Error fetching usage:', error);
        setAnalysisCount(0);
      } else {
        setAnalysisCount(data?.analysis_count ?? 0);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setAnalysisCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Increment the usage count
  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Users who can bypass limits don't need to track usage
    if (canBypassRateLimits()) return true;

    const todayDate = getTodayLocalDate();

    try {
      // Check current usage first
      const { data: existing } = await supabase
        .from('daily_analysis_usage')
        .select('id, analysis_count')
        .eq('user_id', user.id)
        .eq('usage_date', todayDate)
        .maybeSingle();

      if (existing) {
        // Check if already at limit
        if (existing.analysis_count >= FREE_DAILY_LIMIT) {
          return false;
        }
        
        // Update existing record
        const { error } = await supabase
          .from('daily_analysis_usage')
          .update({ analysis_count: existing.analysis_count + 1 })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating usage:', error);
          return false;
        }
        
        setAnalysisCount(existing.analysis_count + 1);
      } else {
        // Insert new record for today
        const { error } = await supabase
          .from('daily_analysis_usage')
          .insert({
            user_id: user.id,
            usage_date: todayDate,
            analysis_count: 1,
          });

        if (error) {
          console.error('Error inserting usage:', error);
          return false;
        }
        
        setAnalysisCount(1);
      }

      return true;
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  }, [user, canBypassRateLimits]);

  // Fetch usage on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Set up timer to refresh at midnight
  useEffect(() => {
    const msUntilMidnight = getMsUntilMidnight();
    
    const timer = setTimeout(() => {
      // Reset at midnight
      setAnalysisCount(0);
      setCurrentDate(getTodayLocalDate());
      fetchUsage();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentDate, fetchUsage]);

  return {
    canAnalyze,
    remainingAnalyses,
    analysisCount,
    dailyLimit: FREE_DAILY_LIMIT,
    loading,
    incrementUsage,
    refetch: fetchUsage,
  };
};