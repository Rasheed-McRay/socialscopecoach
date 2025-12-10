import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioWaveform, Mic, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { HomeRecorder } from "@/components/HomeRecorder";
import { DailyScopeAnalysis } from "@/components/DailyScopeAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { transcribeAudio } from "@/lib/api";
import { toast } from "sonner";

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
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

interface DailyScopeCompletion {
  id: string;
  rating: number;
  analysis_result: any;
  transcript: string | null;
  prompt: string;
  created_at: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [todayCompletion, setTodayCompletion] = useState<DailyScopeCompletion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(true);

  useEffect(() => {
    fetchProfile();
    checkTodayCompletion();
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

  const checkTodayCompletion = async () => {
    if (!user) {
      setLoadingCompletion(false);
      return;
    }
    try {
      const today = getTodayDateString();
      const { data, error } = await supabase
        .from("daily_scope_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("prompt_date", today)
        .maybeSingle();

      if (error) throw error;
      setTodayCompletion(data);
    } catch (error) {
      console.error("Error checking today's completion:", error);
    } finally {
      setLoadingCompletion(false);
    }
  };

  const getGreetingName = () => {
    if (displayName) return displayName;
    if (user?.email) return user.email.split("@")[0];
    return "";
  };

  const handleRecordingComplete = async (audioBlob: Blob, fileName: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsProcessing(true);
    const dailyPrompt = getDailyPrompt();

    try {
      // Step 1: Transcribe
      toast.info("Transcribing your response...");
      const transcript = await transcribeAudio(audioBlob);

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Could not transcribe audio");
      }

      // Step 2: Analyze monologue
      toast.info("Analyzing your response...");
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-monologue",
        {
          body: { transcript, prompt: dailyPrompt },
        }
      );

      if (analysisError) throw analysisError;
      if (analysisData.error) throw new Error(analysisData.error);

      // Step 3: Save completion
      const { error: insertError } = await supabase.from("daily_scope_completions").insert({
        user_id: user.id,
        prompt: dailyPrompt,
        prompt_date: getTodayDateString(),
        rating: analysisData.rating || 70,
        analysis_result: analysisData,
        transcript: transcript,
      });

      if (insertError) throw insertError;

      // Refresh to show completed state
      await checkTodayCompletion();
      toast.success("Daily Scope completed!");
    } catch (error: any) {
      console.error("Error processing daily scope:", error);
      toast.error(error.message || "Failed to process recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const dailyPrompt = getDailyPrompt();

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
              <Link to="/record" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                  <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-serif font-semibold text-foreground">
                    SocialScope
                  </h1>
                  <p className="text-[9px] text-muted-foreground">
                    AI-Powered Conversation Coach
                  </p>
                </div>
              </Link>

              <HeaderNav />
            </div>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-6 md:py-10 space-y-6 max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="text-center space-y-1 animate-fade-in">
            <h2 className="md:text-2xl font-serif text-foreground text-2xl">
              Welcome back{getGreetingName() ? `, ${getGreetingName()}` : ""}
            </h2>
          </section>

          {/* Daily Scope Prompt */}
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="rounded-2xl bg-card border border-primary/20 p-5 md:p-6 text-center space-y-1 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
              <h3 className="text-lg md:text-xl font-serif font-semibold text-foreground">
                Daily Scope
              </h3>
              <p className="text-muted-foreground md:text-base text-lg">{dailyPrompt}</p>
            </div>
          </section>

          {/* Recording Section or Completed State */}
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {loadingCompletion ? (
              <div className="rounded-2xl bg-card border border-primary/20 p-6 md:p-8 text-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : todayCompletion ? (
              <DailyScopeAnalysis completion={todayCompletion} />
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-6 md:p-8 space-y-5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto flex items-center justify-center glow-primary">
                    <Mic className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-serif text-foreground">
                    Answer the Daily Scope
                  </h3>
                  <p className="text-sm text-muted-foreground">Your 60 seconds of clarity</p>
                </div>

                {isProcessing ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Processing your response...</p>
                  </div>
                ) : (
                  <HomeRecorder onRecordingComplete={handleRecordingComplete} />
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Index;
