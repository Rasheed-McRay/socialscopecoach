import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [voiceChecked, setVoiceChecked] = useState(false);
  const [voiceRegistered, setVoiceRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVoiceRegistration = async () => {
      if (!user) {
        setVoiceChecked(true);
        return;
      }

      // Check cache first
      const cached = sessionStorage.getItem(`voice_registered_${user.id}`);
      if (cached !== null) {
        setVoiceRegistered(cached === 'true');
        setVoiceChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('voice_registered')
        .eq('user_id', user.id)
        .single();

      const isRegistered = profile?.voice_registered ?? false;
      setVoiceRegistered(isRegistered);
      sessionStorage.setItem(`voice_registered_${user.id}`, String(isRegistered));
      setVoiceChecked(true);
    };

    if (user && !loading) {
      checkVoiceRegistration();
    } else if (!loading) {
      setVoiceChecked(true);
    }
  }, [user, loading]);

  // Show loading only during initial auth check, not voice check
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Don't block on voice check - show children while checking
  // Redirect to voice setup if not registered and not already on voice-setup or settings page
  const exemptPaths = ['/voice-setup', '/settings'];
  if (voiceChecked && voiceRegistered === false && !exemptPaths.includes(location.pathname)) {
    return <Navigate to="/voice-setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;