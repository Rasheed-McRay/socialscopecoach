import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';

interface UserActivityStats {
  user_id: string;
  email: string | null;
  display_name: string | null;
  login_count: number;
  analysis_count: number;
  last_login: string | null;
  last_analysis: string | null;
  total_activity: number;
}

export const useActivityStats = () => {
  const { isOwner } = useRole();
  const [stats, setStats] = useState<UserActivityStats[]>([]);
  const [totals, setTotals] = useState({
    totalLogins: 0,
    totalAnalyses: 0,
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isOwner) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all activity records
      const { data: activities, error: activityError } = await supabase
        .from('user_activity')
        .select('user_id, activity_type, created_at')
        .order('created_at', { ascending: false });

      if (activityError) {
        console.error('Error fetching activities:', activityError);
        setLoading(false);
        return;
      }

      // Fetch profiles for display names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch user roles for emails (if available via auth)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Build user stats map
      const userStatsMap = new Map<string, UserActivityStats>();
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let totalLogins = 0;
      let totalAnalyses = 0;
      const activeToday = new Set<string>();
      const activeWeek = new Set<string>();

      activities?.forEach((activity) => {
        const userId = activity.user_id;
        const activityDate = new Date(activity.created_at);

        if (!userStatsMap.has(userId)) {
          const profile = profiles?.find(p => p.user_id === userId);
          userStatsMap.set(userId, {
            user_id: userId,
            email: null,
            display_name: profile?.display_name || null,
            login_count: 0,
            analysis_count: 0,
            last_login: null,
            last_analysis: null,
            total_activity: 0,
          });
        }

        const userStats = userStatsMap.get(userId)!;
        userStats.total_activity++;

        if (activity.activity_type === 'login') {
          userStats.login_count++;
          totalLogins++;
          if (!userStats.last_login || activityDate > new Date(userStats.last_login)) {
            userStats.last_login = activity.created_at;
          }
        } else if (activity.activity_type === 'analysis') {
          userStats.analysis_count++;
          totalAnalyses++;
          if (!userStats.last_analysis || activityDate > new Date(userStats.last_analysis)) {
            userStats.last_analysis = activity.created_at;
          }
        }

        if (activityDate >= todayStart) {
          activeToday.add(userId);
        }
        if (activityDate >= weekAgo) {
          activeWeek.add(userId);
        }
      });

      // Sort by total activity
      const sortedStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.total_activity - a.total_activity);

      setStats(sortedStats);
      setTotals({
        totalLogins,
        totalAnalyses,
        totalUsers: userStatsMap.size,
        activeUsersToday: activeToday.size,
        activeUsersWeek: activeWeek.size,
      });
    } catch (err) {
      console.error('Error fetching activity stats:', err);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    totals,
    loading,
    refetch: fetchStats,
  };
};
