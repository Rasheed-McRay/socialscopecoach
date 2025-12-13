import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Crown } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { ProcessingState } from "@/components/ProcessingState";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio, analyzeConversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyAnalysisLimit } from "@/hooks/useDailyAnalysisLimit";
import { Button } from "@/components/ui/button";

type AppState = "idle" | "processing" | "complete" | "limit-reached";
type ProcessingStage = "uploading" | "transcribing" | "analyzing";

const AppRecord = () => {
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
    if (!canAnalyze) {
      setAppState("limit-reached");
      return;
    }

    const usageSuccess = await incrementUsage();
    if (!usageSuccess) {
      setAppState("limit-reached");
      return;
    }

    setAppState("processing");
    setProcessingStage("uploading");
    setProgress(10);

    try {
      setProgress(20);
      setProcessingStage("transcribing");
      setProgress(30);
      
      const transcriptResult = await transcribeAudio(audioBlob);
      setTranscript(transcriptResult);
      setProgress(60);

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
    <div className="px-4 py-6 max-w-lg mx-auto">
      {appState === "idle" && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-serif text-foreground">
              Record Your{" "}
              <span className="text-gradient-primary">Conversation</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload or record a conversation and get instant AI-powered feedback.
            </p>
          </div>

          {limitLoading && (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
                <div className="h-32 bg-muted rounded-xl w-full"></div>
              </div>
            </div>
          )}

          {!limitLoading && !canAnalyze && (
            <div className="text-center space-y-4 py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Limit reached
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isPro ? (
                    <>Resets in {resetInfo.daysUntilReset} days</>
                  ) : (
                    <>Upgrade to Pro for unlimited analyses!</>
                  )}
                </p>
              </div>
              {!isPro && (
                <Button
                  onClick={() => navigate('/app/settings')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          )}

          {!limitLoading && canAnalyze && (
            <>
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isPro ? (
                    <>{remainingAnalyses} of {limit} remaining</>
                  ) : (
                    <>{remainingAnalyses} of {limit} free analyses today</>
                  )}
                </p>
                {voiceBonusRemaining > 0 && (
                  <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    🎁 {voiceBonusRemaining} voice bonus
                  </p>
                )}
              </div>

              <AudioUploader
                onAudioReady={handleAudioReady}
                isProcessing={isProcessing}
              />

              <p className="text-center text-xs text-muted-foreground">
                🔒 Privacy-first: Audio is processed and discarded
              </p>
            </>
          )}
        </div>
      )}

      {appState === "processing" && (
        <ProcessingState stage={processingStage} progress={progress} />
      )}

      {appState === "limit-reached" && (
        <div className="text-center space-y-4 py-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              Limit reached
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPro ? (
                <>Resets in {resetInfo.daysUntilReset} days</>
              ) : (
                <>Come back tomorrow!</>
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
        <div className="max-w-lg mx-auto">
          <AnalysisReport result={analysisResult} transcript={transcript} onReset={handleReset} />
        </div>
      )}
    </div>
  );
};

export default AppRecord;
