import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEnd, setTrialEnd] = useState<Date | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier('basic');
      setLoading(false);
      setIsTrialing(false);
      setTrialEnd(null);
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
          setIsTrialing(stripeData.is_trialing || false);
          setTrialEnd(stripeData.trial_end ? new Date(stripeData.trial_end) : null);
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
      console.error('Error fetching subscription:', err);
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

  // isPro is true if user has pro subscription OR is trialing
  const isPro = tier === 'pro' || isTrialing;

  const value: SubscriptionContextType = {
    tier,
    isPro,
    loading,
    refreshSubscription: fetchSubscription,
    isTrialing,
    trialEnd,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
