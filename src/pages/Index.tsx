import { useState } from "react";
import { AudioWaveform } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { ProcessingState } from "@/components/ProcessingState";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { useToast } from "@/hooks/use-toast";

type AppState = "idle" | "processing" | "complete";
type ProcessingStage = "uploading" | "transcribing" | "analyzing";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("idle");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("uploading");
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAudioReady = async (audioBlob: Blob, fileName: string) => {
    setAppState("processing");
    setProcessingStage("uploading");
    setProgress(0);

    try {
      // Simulate processing stages for demo
      // In production, this would call Lovable Cloud AI
      
      // Stage 1: Uploading
      for (let i = 0; i <= 30; i += 5) {
        await new Promise((r) => setTimeout(r, 100));
        setProgress(i);
      }

      // Stage 2: Transcribing
      setProcessingStage("transcribing");
      for (let i = 30; i <= 60; i += 5) {
        await new Promise((r) => setTimeout(r, 150));
        setProgress(i);
      }

      // Stage 3: Analyzing
      setProcessingStage("analyzing");
      for (let i = 60; i <= 100; i += 5) {
        await new Promise((r) => setTimeout(r, 200));
        setProgress(i);
      }

      // Demo result - in production this comes from AI
      const demoResult: AnalysisResult = {
        summary:
          "This was a dynamic conversation demonstrating a mix of confidence and thoughtfulness. The speaker showed strong engagement patterns with occasional moments of hesitation that suggest areas for growth. Overall, the conversation maintained good energy and showed genuine interest in connecting with the other party.",
        strengths: [
          "Strong opening presence - you established credibility early",
          "Good use of open-ended questions to drive the conversation",
          "Demonstrated active listening through verbal acknowledgments",
          "Maintained consistent energy throughout the conversation",
          "Showed genuine curiosity and empathy in responses",
        ],
        weaknesses: [
          "Occasional filler words ('um', 'like') reduced impact",
          "Some responses could be more concise",
          "Tendency to interrupt during exciting moments",
          "Could pause more before responding to show deeper reflection",
        ],
        standoutMoments: [
          "Your response at the 2-minute mark showed exceptional emotional intelligence",
          "The story you shared was engaging and well-timed",
          "Great recovery after the momentary pause - showed composure",
        ],
        improvements: [
          "Practice pausing 2 seconds before responding to important points",
          "Replace filler words with confident silence",
          "Mirror the other person's energy level more closely",
        ],
        personalCompliment:
          "Your natural warmth comes through clearly - it's a gift that makes people feel heard and valued. Keep leaning into that authentic presence!",
        socialScore: 78,
        confidenceScore: 72,
        nextSteps: [
          "Record yourself in your next conversation and focus specifically on reducing filler words",
          "Practice the '2-second pause' technique before responding to questions",
          "Work on matching the energy level of your conversation partner",
        ],
        vocalTone: {
          confidence: "Moderate-High",
          nervousness: "Low",
          enthusiasm: "High",
          warmth: "Very High",
          assertiveness: "Moderate",
          archetype: "The Engaged Storyteller",
        },
        technicalSkills: {
          questionQuality: "Good - asked thoughtful follow-up questions",
          talkingRatio: "55/45 - slightly more talking than listening",
          empathySignals: "Strong - showed genuine understanding",
          interruptingFrequency: "Occasional - 2-3 minor interruptions",
          valueAdded: "High - contributed meaningful insights",
          clarity: "Good - explanations were generally clear",
          socialCalibration: "Well-matched energy with the other person",
        },
        emotionalCues: {
          emotionalState: "Positive and engaged throughout",
          confidenceFluctuations: "Minor dip mid-conversation, strong recovery",
          energyChanges: "Consistent with natural peaks during storytelling",
        },
      };

      setAnalysisResult(demoResult);
      setAppState("complete");
      
      toast({
        title: "Analysis Complete!",
        description: "Your conversation has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setAppState("idle");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setProgress(0);
    setAnalysisResult(null);
  };

  const isProcessing = appState === "processing";

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <AudioWaveform className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-semibold text-foreground">SocialScope</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Conversation Coach</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-12 md:py-16">
          {appState === "idle" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif text-foreground">
                  Unlock Your{" "}
                  <span className="text-gradient-primary">Social Superpowers</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Upload or record a conversation and get instant AI-powered feedback on your
                  communication skills, confidence, and social presence.
                </p>
              </div>

              <AudioUploader
                onAudioReady={handleAudioReady}
                isProcessing={isProcessing}
              />

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  🔒 Privacy-first: Your audio is processed and immediately discarded
                </p>
              </div>
            </div>
          )}

          {appState === "processing" && (
            <ProcessingState stage={processingStage} progress={progress} />
          )}

          {appState === "complete" && analysisResult && (
            <div className="max-w-4xl mx-auto">
              <AnalysisReport result={analysisResult} onReset={handleReset} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-auto">
          <div className="container py-6">
            <p className="text-center text-sm text-muted-foreground">
              Built with care for better human connection
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
