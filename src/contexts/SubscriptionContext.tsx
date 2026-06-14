import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";

type SubscriptionTier = 'basic' | 'pro';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}


const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('basic');
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier('basic');
      setLoading(false);
      return;
    }

    // Only set loading true if we haven't fetched yet
    if (!hasFetched) {
      setLoading(true);
    }

    try {
      // Check Stripe subscription status via edge function
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
      
      if (!stripeError && stripeData) {
        if (stripeData.subscribed) {
          setTier('pro');
          setLoading(false);
          setHasFetched(true);
          return;
        }
      }

      // Fallback to local database check
      const subscriptionResult = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      // Handle subscription
      if (subscriptionResult.error) {
        if (subscriptionResult.error.code === 'PGRST116') {
          supabase
            .from('user_subscriptions')
            .insert({ user_id: user.id, tier: 'basic' })
            .then(() => {});
          setTier('basic');
        }
      } else if (subscriptionResult.data) {
        setTier(subscriptionResult.data.tier as SubscriptionTier);
      }
    } catch (err) {
      logger.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [user, hasFetched]);

  useEffect(() => {
    // Don't fetch while auth is still loading
    if (authLoading) return;
    
    fetchSubscription();
  }, [user, authLoading, fetchSubscription]);

  // Re-check subscription when the app resumes from background
  // (web visibility change + Capacitor appStateChange on native).
  useEffect(() => {
    if (authLoading || !user) return;

    let lastRefresh = Date.now();
    const MIN_INTERVAL_MS = 5000; // throttle to avoid spam

    const maybeRefresh = (reason: string) => {
      const now = Date.now();
      if (now - lastRefresh < MIN_INTERVAL_MS) return;
      lastRefresh = now;
      logger.log(`[Subscription] refresh on ${reason}`);
      fetchSubscription();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") maybeRefresh("visibilitychange");
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Capacitor native resume (Android/iOS). Plugin is optional.
    let removeAppListener: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import(/* @vite-ignore */ "@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) maybeRefresh("appStateChange");
        });
        removeAppListener = () => handle.remove();
      } catch {
        // @capacitor/app not installed or not on native — visibilitychange covers web/PWA.
      }
    })();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      removeAppListener?.();
    };
  }, [user, authLoading, fetchSubscription]);


  const isPro = tier === 'pro';

  const value: SubscriptionContextType = {
    tier,
    isPro,
    loading,
    refreshSubscription: fetchSubscription,
  };


  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
