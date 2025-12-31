import { useNavigate } from "react-router-dom";
import { VoiceRegistration } from "@/components/VoiceRegistration";
import { AudioWaveform } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";

const VoiceSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = () => {
    if (user) {
      sessionStorage.setItem(`voice_registered_${user.id}`, 'true');
    }
    navigate("/record");
  };


  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <AudioWaveform className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">SocialScope</h1>
        </div>
        <HeaderNav />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-glow)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--gradient-accent)" }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 pb-28 md:pb-8 relative z-10">
        <VoiceRegistration
          onComplete={handleComplete}
          showSkip={false}
          isOnboarding={true}
        />
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default VoiceSetup;
