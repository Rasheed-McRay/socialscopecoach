import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityType = 'login' | 'analysis';

interface ActivityMetadata {
  [key: string]: string | number | boolean | null;
}

export const useActivityTracker = () => {
  const { user } = useAuth();

  const trackActivity = useCallback(async (
    activityType: ActivityType,
    metadata: ActivityMetadata = {}
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          metadata,
        });

      if (error) {
        console.error('Error tracking activity:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error tracking activity:', err);
      return false;
    }
  }, [user]);

  const trackLogin = useCallback(() => {
    return trackActivity('login');
  }, [trackActivity]);

  const trackAnalysis = useCallback((analysisType?: string) => {
    return trackActivity('analysis', { type: analysisType || 'conversation' });
  }, [trackActivity]);

  return {
    trackActivity,
    trackLogin,
    trackAnalysis,
  };
};
