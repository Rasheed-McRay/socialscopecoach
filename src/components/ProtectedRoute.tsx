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

      const { data: profile } = await supabase
        .from('profiles')
        .select('voice_registered')
        .eq('user_id', user.id)
        .single();

      setVoiceRegistered(profile?.voice_registered ?? false);
      setVoiceChecked(true);
    };

    if (user && !loading) {
      checkVoiceRegistration();
    } else if (!loading) {
      setVoiceChecked(true);
    }
  }, [user, loading]);

  if (loading || !voiceChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to voice setup if not registered and not already on voice-setup or settings page
  const exemptPaths = ['/voice-setup', '/settings'];
  if (voiceRegistered === false && !exemptPaths.includes(location.pathname)) {
    return <Navigate to="/voice-setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;