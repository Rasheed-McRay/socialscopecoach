import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AudioWaveform, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { HomeRecorder } from "@/components/HomeRecorder";
import { supabase } from "@/integrations/supabase/client";

// Daily scope prompts
const DAILY_PROMPTS = [
  "What type of animal are you?",
  "Describe your perfect weekend.",
  "If you could have dinner with anyone, who would it be?",
  "What's your most unpopular opinion?",
  "Describe yourself in three words.",
  "What's the best advice you've ever received?",
  "If you won the lottery, what's the first thing you'd do?",
];

const getDailyPrompt = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setDisplayName(data?.display_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const getGreetingName = () => {
    if (displayName) return displayName;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

  const handleRecordingComplete = (audioBlob: Blob, fileName: string) => {
    navigate("/record", { state: { audioBlob, fileName } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pb-24">
        {/* Header */}
        <header className="border-b border-primary/10 backdrop-blur-sm safe-area-top">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                  <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-serif font-semibold text-foreground">SocialScope</h1>
                  <p className="text-[9px] text-muted-foreground">AI-Powered Conversation Coach</p>
                </div>
              </div>
              
              <HeaderNav />
            </div>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-6 md:py-10 space-y-6 max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="text-center space-y-1 animate-fade-in">
            <h2 className="text-xl md:text-2xl font-serif text-foreground">
              Welcome back{getGreetingName() ? `, ${getGreetingName()}` : ''}
            </h2>
          </section>

          {/* Daily Scope Prompt */}
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="rounded-2xl bg-card border border-primary/20 p-5 md:p-6 text-center space-y-1 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
              <h3 className="text-lg md:text-xl font-serif font-semibold text-foreground">
                Daily Scope
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {getDailyPrompt()}
              </p>
            </div>
          </section>

          {/* Recording Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-6 md:p-8 space-y-5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto flex items-center justify-center glow-primary">
                  <Mic className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-serif text-foreground">
                  Answer the Daily Scope
                </h3>
              </div>
              
              <HomeRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Index;
