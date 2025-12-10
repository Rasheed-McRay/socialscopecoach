import { useState } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { ProcessingState } from "@/components/ProcessingState";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio, analyzeConversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";

type AppState = "idle" | "processing" | "complete";
type ProcessingStage = "uploading" | "transcribing" | "analyzing";

const Record = () => {
  const [appState, setAppState] = useState<AppState>("idle");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("uploading");
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAudioReady = async (audioBlob: Blob, fileName: string) => {
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
