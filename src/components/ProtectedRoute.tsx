import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface ProfileStatus {
  onboarding_completed: boolean;
  voice_registered: boolean;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) {
        setProfileChecked(true);
        return;
      }

      // Check cache first
      const cachedOnboarding = sessionStorage.getItem(`onboarding_completed_${user.id}`);
      const cachedVoice = sessionStorage.getItem(`voice_registered_${user.id}`);
      
      if (cachedOnboarding !== null && cachedVoice !== null) {
        setProfileStatus({
          onboarding_completed: cachedOnboarding === 'true',
          voice_registered: cachedVoice === 'true',
        });
        setProfileChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, voice_registered')
        .eq('user_id', user.id)
        .single();

      const status = {
        onboarding_completed: profile?.onboarding_completed ?? false,
        voice_registered: profile?.voice_registered ?? false,
      };
      
      setProfileStatus(status);
      sessionStorage.setItem(`onboarding_completed_${user.id}`, String(status.onboarding_completed));
      sessionStorage.setItem(`voice_registered_${user.id}`, String(status.voice_registered));
      setProfileChecked(true);
    };

    if (user && !loading) {
      checkProfileStatus();
    } else if (!loading) {
      setProfileChecked(true);
    }
  }, [user, loading, location.pathname]);

  // Show loading during auth check OR while fetching profile status
  if (loading || !profileChecked || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Read cache directly on every render for immediate reactivity
  const cachedOnboarding = sessionStorage.getItem(`onboarding_completed_${user.id}`);
  const cachedVoice = sessionStorage.getItem(`voice_registered_${user.id}`);
  
  const effectiveStatus: ProfileStatus = {
    onboarding_completed: cachedOnboarding === 'true' || (profileStatus?.onboarding_completed ?? false),
    voice_registered: cachedVoice === 'true' || (profileStatus?.voice_registered ?? false),
  };

  // Paths that don't require subscription
  const noSubscriptionPaths = ['/onboarding', '/voice-setup', '/paywall', '/checkout-success', '/settings'];
  // Paths that don't require voice registration
  const exemptPaths = ['/onboarding', '/voice-setup', '/paywall', '/checkout-success', '/settings'];
  
  // Check onboarding first
  if (!effectiveStatus.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Then check voice registration (but only if onboarding is complete)
  if (effectiveStatus.onboarding_completed && !effectiveStatus.voice_registered && !exemptPaths.includes(location.pathname)) {
    return <Navigate to="/voice-setup" replace />;
  }

  // Check subscription (but only after onboarding and voice setup are complete)
  if (
    effectiveStatus.onboarding_completed && 
    effectiveStatus.voice_registered && 
    !isPro && 
    !noSubscriptionPaths.includes(location.pathname)
  ) {
    return <Navigate to="/paywall" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;