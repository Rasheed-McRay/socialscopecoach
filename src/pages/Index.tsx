import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioWaveform, Speech, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HeaderNav } from "@/components/HeaderNav";
import { HomeRecorder } from "@/components/HomeRecorder";
import { DailyScopeAnalysis } from "@/components/DailyScopeAnalysis";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { supabase } from "@/integrations/supabase/client";
import { transcribeAudio } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Daily scope prompts - open-ended questions that encourage thoughtful, detailed responses
const DAILY_PROMPTS = [
  "What's a belief you held strongly in the past that you've since changed your mind about, and what led to that shift?",
  "Describe a moment in your life that fundamentally changed how you see the world.",
  "If you could redesign how society approaches education, what would you change and why?",
  "Tell me about a person who shaped who you are today, and explain the specific ways they influenced you.",
  "What's something you're currently struggling with, and how are you approaching it?",
  "Describe a time when you were completely wrong about something important. What did you learn?",
  "If you could have a conversation with your younger self, what would you want them to understand?",
  "What does success mean to you, and how has that definition evolved over time?",
  "Describe a fear you've overcome and the journey it took to get there.",
  "What's a controversial opinion you hold, and walk me through your reasoning?",
  "Tell me about a failure that ultimately led to something positive in your life.",
  "If you could solve one problem in your community, what would it be and how would you approach it?",
  "Describe a skill or hobby you've always wanted to pursue but haven't yet. What's holding you back?",
  "What's the most meaningful gift you've ever given or received, and what made it special?",
  "Tell me about a time when you had to make a difficult decision with no clear right answer.",
  "How do you define authenticity, and where do you feel most authentic in your life?",
  "Describe a cultural tradition or practice that's meaningful to you and explain its significance.",
  "What's something you wish more people understood about you or your experiences?",
  "If you could change one thing about how you communicate with others, what would it be?",
  "Tell me about a book, movie, or piece of art that deeply affected you and why.",
  "What role does vulnerability play in your relationships, and how has that evolved?",
  "Describe a time when you stood up for something you believed in, even when it was difficult.",
  "What's a question you've been asking yourself lately, and where are you in finding the answer?",
  "Tell me about a relationship in your life that has taught you the most about yourself.",
  "If you could master any subject or field overnight, what would you choose and what would you do with that knowledge?",
  "Describe your ideal day from start to finish, including who you'd spend it with and where.",
  "What's something about the way you were raised that you're grateful for, and something you'd do differently?",
  "Tell me about a time when you felt truly understood by someone. What made that connection special?",
  "How do you handle disagreements with people you care about? What's your approach?",
  "Describe a place that feels like home to you, even if it's not where you live.",
  "What's a habit or pattern in your life that you're working to change?",
  "Tell me about a risk you took that didn't work out. How do you feel about it now?",
  "If you could give everyone in the world one piece of advice, what would it be and why?",
  "Describe a moment when you felt truly proud of yourself, beyond any external recognition.",
  "What does friendship mean to you, and how has your understanding of it changed?",
  "Tell me about a time when your perspective was broadened by someone very different from you.",
  "What's something you do regularly that brings you peace or grounds you?",
  "Describe a challenge you're currently facing and how you're thinking about approaching it.",
  "If you could witness any historical event firsthand, what would you choose and why?",
  "What's a lesson you keep having to relearn in your life?",
  "Tell me about someone you admire from afar and what specifically draws you to them.",
  "How do you think about your legacy? What do you hope people remember about you?",
  "Describe a time when you surprised yourself with your own capabilities.",
  "What's something you've created that you're proud of, and what was the process like?",
  "Tell me about a boundary you've had to set in your life and how it affected your relationships.",
  "If you could have any career for a year without worrying about money, what would you choose?",
  "What's the most important conversation you've ever had, and what made it so impactful?",
  "Describe how your relationship with yourself has changed over the years.",
  "What's something you believe that most people around you would disagree with?",
  "Tell me about a time when you chose kindness over being right.",
  "How do you want to grow as a person in the next year, and what steps are you taking?",
  "Describe a moment of unexpected joy or beauty you experienced recently.",
  "What's a story from your family history that has influenced who you are?",
  "Tell me about a mentor or guide who appeared in your life when you needed them most.",
  "If you could change one thing about how you spend your time, what would it be?",
  "What does courage mean to you, and when have you had to be courageous?",
  "Describe a time when you had to let go of something or someone important to you.",
  "What's the most valuable thing you've learned from a mistake?",
  "Tell me about a time when you felt completely out of your depth. How did you handle it?",
  "How do you approach making decisions that affect other people's lives?",
  "Describe what balance means to you and how you try to achieve it.",
  "What's something you used to judge others for that you now understand differently?",
  "Tell me about a tradition you've started or want to start in your life.",
  "If you could ask one question and get an absolutely truthful answer, what would you ask?",
  "What's the hardest thing about being you, and how do you cope with it?",
  "Describe a time when you felt genuinely heard and seen by another person.",
  "What role does gratitude play in your life, and how do you practice it?",
  "Tell me about a time when you had to rebuild trust with someone.",
  "How do you handle uncertainty and ambiguity in your life?",
  "Describe a crossroads moment in your life and how you chose which path to take.",
  "What's something you're passionate about that people might not expect?",
  "Tell me about a time when you changed someone's mind about something important.",
  "If you could relive one year of your life with your current wisdom, which would you choose and why?",
  "What does it mean to you to live a meaningful life?",
  "Describe a time when you felt truly free. What were the circumstances?",
  "What's the most difficult feedback you've ever received, and how did you respond to it?",
  "Tell me about a goal you're working toward and the obstacles you're facing.",
  "How has your definition of happiness evolved throughout your life?",
  "Describe a time when you had to advocate for yourself in a difficult situation.",
  "What's something you wish you had started earlier in life?",
  "Tell me about a conflict that ultimately strengthened a relationship.",
  "If you could spend a week living someone else's life, whose would you choose and why?",
  "What values do you hold that you're unwilling to compromise on, no matter what?",
  "Describe how you've grown as a communicator over the years.",
  "What's a dream you've had to let go of, and how have you made peace with that?",
  "Tell me about a time when you felt like an outsider and how that shaped you.",
  "How do you stay motivated when things get difficult?",
  "Describe a person in your life who challenges you to be better.",
  "What's something you've forgiven yourself for that was hard to let go of?",
  "Tell me about a moment when you realized you were becoming the person you wanted to be.",
  "If you could change one aspect of human nature, what would it be and why?",
  "What's the most important thing you've learned about communication?",
  "Describe a time when you had to be vulnerable to get what you needed.",
  "How do you define love, and how has that definition changed for you?",
  "Tell me about a time when you stepped outside your comfort zone and what you discovered.",
  "What's something about the world today that gives you hope?",
  "Describe how you process and work through strong emotions.",
  "What's a quality in others that you find most admirable, and why?",
  "Tell me about a time when you had to trust the process without knowing the outcome.",
  "If you could give your community one gift, what would it be?",
  "What does home mean to you, beyond just a physical place?",
];

// Use UTC date to ensure all users get the same prompt on the same day
const getDailyPrompt = () => {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  
  // Calculate day of year in UTC
  const startOfYear = Date.UTC(utcYear, 0, 0);
  const currentDay = Date.UTC(utcYear, utcMonth, utcDate);
  const dayOfYear = Math.floor((currentDay - startOfYear) / 86400000);
  
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

// Use UTC date string for consistency across timezones
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    toast.info("Analysis cancelled");
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob, fileName: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    const dailyPrompt = getDailyPrompt();

    try {
      // Step 1: Transcribe
      toast.info("Transcribing your response...");
      const transcript = await transcribeAudio(audioBlob);

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

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

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

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
      // Don't show error if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      console.error("Error processing daily scope:", error);
      toast.error(error.message || "Failed to process recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const dailyPrompt = getDailyPrompt();

  return (
    <ProFeatureGate 
      featureName="Daily Scope" 
      description="Practice your communication skills with daily prompts and get AI-powered feedback."
    >
      <div className="min-h-screen bg-background">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Fixed Header */}
          <header className="fixed-header bg-background/95 backdrop-blur-lg border-b border-primary/10">
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

                <HeaderNav isAnalyzing={isProcessing} />
              </div>
            </div>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </header>

          {/* Spacer for fixed header */}
          <div className="h-[60px] safe-area-top flex-shrink-0" />

          {/* Main Content */}
          <main className="px-4 md:px-8 py-6 md:py-10 pb-28 space-y-6 max-w-4xl mx-auto flex-1">
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
                    <div className="text-center py-8 space-y-4">
                      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                      <p className="text-muted-foreground">Processing your response...</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <HomeRecorder onRecordingComplete={handleRecordingComplete} />
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </ProFeatureGate>
  );
};

export default Index;
