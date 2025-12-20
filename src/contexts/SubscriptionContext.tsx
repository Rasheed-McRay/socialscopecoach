import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type SubscriptionTier = 'basic' | 'pro';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  isPromoTrialActive: boolean;
  promoTrialExpiresAt: string | null;
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
  const [promoTrialExpiresAt, setPromoTrialExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSubscription = async () => {
    if (!user) {
      setTier('basic');
      setPromoTrialExpiresAt(null);
      setLoading(false);
      return;
    }

    // Only set loading true if we haven't fetched yet
    if (!hasFetched) {
      setLoading(true);
    }

    try {
      // Fetch subscription tier
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      } else if (subData) {
        setTier(subData.tier as SubscriptionTier);
      } else {
        // No subscription exists, create one with basic tier (non-blocking)
        supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id, tier: 'basic' })
          .then(() => {});
        setTier('basic');
      }

      // Fetch promo trial status from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('promo_trial_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile promo status:', profileError);
      } else if (profileData) {
        setPromoTrialExpiresAt(profileData.promo_trial_expires_at);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    // Don't fetch while auth is still loading
    if (authLoading) return;
    
    fetchSubscription();
  }, [user, authLoading]);

  // Check if promo trial is currently active
  const isPromoTrialActive = Boolean(
    promoTrialExpiresAt && new Date(promoTrialExpiresAt) > new Date()
  );

  // isPro is true if paid subscriber OR has active promo trial
  const isPro = tier === 'pro' || isPromoTrialActive;

  const value: SubscriptionContextType = {
    tier,
    isPro,
    isPromoTrialActive,
    promoTrialExpiresAt,
    loading,
    refreshSubscription: fetchSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
