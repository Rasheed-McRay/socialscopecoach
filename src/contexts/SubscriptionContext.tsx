import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type SubscriptionTier = 'basic' | 'pro';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  isPromoTrialActive: boolean;
  promoTrialExpiry: Date | null;
  promoTrialDaysRemaining: number;
  isTrialing: boolean;
  trialEnd: Date | null;
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
  const [isPromoTrialActive, setIsPromoTrialActive] = useState(false);
  const [promoTrialExpiry, setPromoTrialExpiry] = useState<Date | null>(null);
  const [promoTrialDaysRemaining, setPromoTrialDaysRemaining] = useState(0);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEnd, setTrialEnd] = useState<Date | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier('basic');
      setLoading(false);
      setIsPromoTrialActive(false);
      setPromoTrialExpiry(null);
      setPromoTrialDaysRemaining(0);
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
        
        // Check for promo trial from Stripe response
        if (stripeData.promo_trial) {
          setTier('pro');
          setIsPromoTrialActive(true);
          if (stripeData.promo_trial_expires) {
            const expiry = new Date(stripeData.promo_trial_expires);
            setPromoTrialExpiry(expiry);
            setPromoTrialDaysRemaining(Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          }
          setLoading(false);
          setHasFetched(true);
          return;
        }
      }

      // Fallback to local database check
      const [subscriptionResult, profileResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('profiles')
          .select('promo_trial_expires_at')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

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

      // Handle promo trial
      if (profileResult.data?.promo_trial_expires_at) {
        const expiry = new Date(profileResult.data.promo_trial_expires_at);
        const now = new Date();
        if (expiry > now) {
          setIsPromoTrialActive(true);
          setPromoTrialExpiry(expiry);
          setPromoTrialDaysRemaining(Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
          setIsPromoTrialActive(false);
          setPromoTrialExpiry(null);
          setPromoTrialDaysRemaining(0);
        }
      } else {
        setIsPromoTrialActive(false);
        setPromoTrialExpiry(null);
        setPromoTrialDaysRemaining(0);
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

  // isPro is true if user has pro subscription OR has an active promo trial OR is trialing
  const isPro = tier === 'pro' || isPromoTrialActive || isTrialing;

  const value: SubscriptionContextType = {
    tier,
    isPro,
    loading,
    refreshSubscription: fetchSubscription,
    isPromoTrialActive,
    promoTrialExpiry,
    promoTrialDaysRemaining,
    isTrialing,
    trialEnd,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
