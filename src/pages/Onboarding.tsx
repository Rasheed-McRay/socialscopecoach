import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  AudioWaveform, Sparkles, Briefcase, Users, Heart, Mic, 
  Building2, Coffee, HeartHandshake, Network, Presentation,
  Sprout, TrendingUp, Award, HelpCircle,
  Calendar, CalendarClock, CalendarCheck,
  ArrowRight, ArrowLeft, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingStep } from "@/components/onboarding/OnboardingStep";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

const GOALS = [
  { id: "confidence", icon: Sparkles, title: "Become more confident", description: "Feel comfortable in any conversation" },
  { id: "professional", icon: Briefcase, title: "Improve professionally", description: "Excel in meetings and presentations" },
  { id: "social", icon: Users, title: "Better social skills", description: "Connect more easily with others" },
  { id: "anxiety", icon: Heart, title: "Reduce social anxiety", description: "Feel calmer in social situations" },
  { id: "listening", icon: Mic, title: "Become a better listener", description: "Understand and respond more thoughtfully" },
];

const CONTEXTS = [
  { id: "work", icon: Building2, title: "Work & Meetings", description: "Professional settings and presentations" },
  { id: "social", icon: Coffee, title: "Casual Conversations", description: "Everyday social interactions" },
  { id: "dating", icon: HeartHandshake, title: "Dating & Romance", description: "Romantic and intimate connections" },
  { id: "networking", icon: Network, title: "Networking Events", description: "Making professional connections" },
  { id: "public_speaking", icon: Presentation, title: "Public Speaking", description: "Presenting to groups or audiences" },
];

const SKILL_LEVELS = [
  { id: "beginner", icon: Sprout, title: "Beginner", description: "I often feel awkward and struggle" },
  { id: "intermediate", icon: TrendingUp, title: "Intermediate", description: "I'm okay but want to be better" },
  { id: "advanced", icon: Award, title: "Advanced", description: "I'm good but want to be great" },
  { id: "unsure", icon: HelpCircle, title: "Not sure", description: "That's why I'm here to find out!" },
];

const FREQUENCIES = [
  { id: "daily", icon: Calendar, title: "Daily", description: "I want to practice every day" },
  { id: "weekly", icon: CalendarClock, title: "Few times a week", description: "Regular but flexible" },
  { id: "occasional", icon: CalendarCheck, title: "When I have conversations", description: "Practice after real interactions" },
];

const TOTAL_STEPS = 4;

const Onboarding = () => {
  usePageTitle("Get Started");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    primary_goal: "",
    improvement_context: "",
    skill_level: "",
    practice_frequency: "",
  });

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };


  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...preferences,
          onboarding_completed: true,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      sessionStorage.setItem(`onboarding_completed_${user?.id}`, 'true');
      navigate("/voice-setup", { replace: true });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!preferences.primary_goal;
      case 1: return !!preferences.improvement_context;
      case 2: return !!preferences.skill_level;
      case 3: return !!preferences.practice_frequency;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <OnboardingStep
            title="What brings you here?"
            subtitle="Choose your primary goal"
          >
            <div className="space-y-3">
              {GOALS.map((goal) => (
                <OptionCard
                  key={goal.id}
                  icon={goal.icon}
                  title={goal.title}
                  description={goal.description}
                  selected={preferences.primary_goal === goal.id}
                  onClick={() => setPreferences({ ...preferences, primary_goal: goal.id })}
                />
              ))}
            </div>
          </OnboardingStep>
        );
      case 1:
        return (
          <OnboardingStep
            title="Where do you want to improve?"
            subtitle="Select your main context"
          >
            <div className="space-y-3">
              {CONTEXTS.map((context) => (
                <OptionCard
                  key={context.id}
                  icon={context.icon}
                  title={context.title}
                  description={context.description}
                  selected={preferences.improvement_context === context.id}
                  onClick={() => setPreferences({ ...preferences, improvement_context: context.id })}
                />
              ))}
            </div>
          </OnboardingStep>
        );
      case 2:
        return (
          <OnboardingStep
            title="How would you rate yourself?"
            subtitle="Be honest — there's no wrong answer"
          >
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <OptionCard
                  key={level.id}
                  icon={level.icon}
                  title={level.title}
                  description={level.description}
                  selected={preferences.skill_level === level.id}
                  onClick={() => setPreferences({ ...preferences, skill_level: level.id })}
                />
              ))}
            </div>
          </OnboardingStep>
        );
      case 3:
        return (
          <OnboardingStep
            title="How often do you want to practice?"
            subtitle="We'll personalize your experience"
          >
            <div className="space-y-3">
              {FREQUENCIES.map((freq) => (
                <OptionCard
                  key={freq.id}
                  icon={freq.icon}
                  title={freq.title}
                  description={freq.description}
                  selected={preferences.practice_frequency === freq.id}
                  onClick={() => setPreferences({ ...preferences, practice_frequency: freq.id })}
                />
              ))}
            </div>
          </OnboardingStep>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <AudioWaveform className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-serif font-semibold text-foreground">SocialScope</span>
        </div>
        <div className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
          Let's personalize your experience
        </div>
      </header>

      {/* Progress indicator */}
      <div className="relative z-10 px-4 py-2">
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden bg-secondary"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 px-4 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <div key={step} className="h-full">
            {renderStep()}
          </div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={saving}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex-1"
          >
            {step === TOTAL_STEPS - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Complete"}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
