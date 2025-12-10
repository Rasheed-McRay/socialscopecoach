import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioWaveform, Lock, Crown } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { ProcessingState } from "@/components/ProcessingState";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio, analyzeConversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { useDailyAnalysisLimit } from "@/hooks/useDailyAnalysisLimit";
import { Button } from "@/components/ui/button";


type AppState = "idle" | "processing" | "complete" | "limit-reached";
type ProcessingStage = "uploading" | "transcribing" | "analyzing";

const Record = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState>("idle");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("uploading");
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    canAnalyze, 
    remainingAnalyses, 
    limit, 
    loading: limitLoading, 
    incrementUsage,
    isPro,
    resetInfo,
    voiceBonusRemaining,
  } = useDailyAnalysisLimit();

  const handleAudioReady = async (audioBlob: Blob, fileName: string) => {
    // Check if user can analyze before proceeding
    if (!canAnalyze) {
      setAppState("limit-reached");
      return;
    }

    // Increment usage before starting (to prevent race conditions)
    const usageSuccess = await incrementUsage();
    if (!usageSuccess) {
      setAppState("limit-reached");
      return;
    }

    setAppState("processing");
    setProcessingStage("uploading");
    setProgress(10);

    try {
      // Stage 1: Prepare audio
      setProgress(20);
      
      // Stage 2: Transcribe
      setProcessingStage("transcribing");
      setProgress(30);
      
      const transcriptResult = await transcribeAudio(audioBlob);
      setTranscript(transcriptResult);
      setProgress(60);

      // Stage 3: Analyze
      setProcessingStage("analyzing");
      setProgress(70);
      
      const result = await analyzeConversation(transcriptResult);
      setProgress(100);

      setAnalysisResult(result);
      setAppState("complete");
      
      toast({
        title: "Analysis Complete!",
        description: "Your conversation has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setAppState("idle");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setProgress(0);
    setAnalysisResult(null);
    setTranscript(null);
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
            <div className="flex items-center justify-between">
              <Link to="/record" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <AudioWaveform className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-semibold text-foreground">SocialScope</h1>
                  <p className="text-xs text-muted-foreground">Record & Analyze</p>
                </div>
              </Link>
              
              <HeaderNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-12 md:py-16 pb-32">
          {appState === "idle" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif text-foreground">
                  Record Your{" "}
                  <span className="text-gradient-primary">Conversation</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Upload or record a conversation and get instant AI-powered feedback on your
                  communication skills, confidence, and social presence.
                </p>
              </div>

              {/* Loading state */}
              {limitLoading && (
                <div className="text-center py-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
                    <div className="h-32 bg-muted rounded-xl w-full max-w-md mx-auto"></div>
                  </div>
                </div>
              )}

              {/* Limit reached state */}
              {!limitLoading && !canAnalyze && (
                <div className="max-w-md mx-auto text-center space-y-6 py-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      You've reached your analysis limit
                    </h2>
                    <p className="text-muted-foreground">
                      {isPro ? (
                        <>
                          You've used all {limit} analyses this billing period.
                          <br />
                          Resets in {resetInfo.daysUntilReset} {resetInfo.daysUntilReset === 1 ? 'day' : 'days'}.
                        </>
                      ) : (
                        <>
                          You've used your free analysis for today.
                          <br />
                          Upgrade to Pro for unlimited analyses!
                        </>
                      )}
                    </p>
                  </div>
                  {!isPro && (
                    <Button
                      onClick={() => navigate('/settings')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              )}

              {/* Normal recording state */}
              {!limitLoading && canAnalyze && (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isPro ? (
                        <>
                          {remainingAnalyses} of {limit} analyses remaining this billing period
                          {resetInfo.daysUntilReset > 0 && (
                            <span className="text-xs block mt-1">
                              Resets in {resetInfo.daysUntilReset} {resetInfo.daysUntilReset === 1 ? 'day' : 'days'}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {remainingAnalyses} of {limit} free {limit === 1 ? 'analysis' : 'analyses'} remaining today
                        </>
                      )}
                    </p>
                    {voiceBonusRemaining > 0 && (
                      <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <span>🎁</span>
                        {voiceBonusRemaining} voice bonus {voiceBonusRemaining === 1 ? 'analysis' : 'analyses'}
                      </p>
                    )}
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
                </>
              )}
            </div>
          )}

          {appState === "processing" && (
            <ProcessingState stage={processingStage} progress={progress} />
          )}

          {appState === "limit-reached" && (
            <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in py-12">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-semibold text-foreground">
                  You've reached your analysis limit
                </h2>
                <p className="text-muted-foreground">
                  {isPro ? (
                    <>
                      You've used all {limit} analyses this billing period.
                      <br />
                      Resets in {resetInfo.daysUntilReset} {resetInfo.daysUntilReset === 1 ? 'day' : 'days'}.
                    </>
                  ) : (
                    <>
                      You've used your free analysis for today.
                      <br />
                      Come back tomorrow at midnight!
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-primary hover:underline text-sm"
              >
                Go back
              </button>
            </div>
          )}

          {appState === "complete" && analysisResult && (
            <div className="max-w-4xl mx-auto">
              <AnalysisReport result={analysisResult} transcript={transcript} onReset={handleReset} />
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Record;
