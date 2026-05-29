import { useEffect, useRef, useState } from "react";
import { Loader2, AudioWaveform, Brain, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProcessingStateProps {
  stage: "uploading" | "transcribing" | "analyzing";
  /** Optional override; when omitted, progress animates automatically based on stage + elapsed time. */
  progress?: number;
  /** "deep" (default) tunes durations for Pro-quality analyses; "fast" tunes for Flash-quality. */
  pace?: "fast" | "deep";
  onCancel?: () => void;
}

const stageDefs = {
  uploading: {
    icon: AudioWaveform,
    title: "Processing Audio",
    description: "Preparing your audio for analysis...",
    start: 0,
    cap: 20,
    estMs: { fast: 1500, deep: 1500 },
  },
  transcribing: {
    icon: FileText,
    title: "Transcribing",
    description: "Converting speech to text...",
    start: 20,
    cap: 60,
    estMs: { fast: 7000, deep: 7000 },
  },
  analyzing: {
    icon: Brain,
    title: "Analyzing Social Skills",
    description: "Evaluating tone, confidence, and conversation dynamics...",
    start: 60,
    cap: 97,
    estMs: { fast: 9000, deep: 22000 },
  },
} as const;

export function ProcessingState({ stage, progress: progressOverride, pace = "deep", onCancel }: ProcessingStateProps) {
  const currentStage = stageDefs[stage];
  const Icon = currentStage.icon;
  const estMs = currentStage.estMs[pace];

  const [autoProgress, setAutoProgress] = useState(currentStage.start);
  const stageStartRef = useRef<number>(performance.now());
  const stageStartValueRef = useRef<number>(currentStage.start);

  useEffect(() => {
    stageStartRef.current = performance.now();
    setAutoProgress((prev) => {
      const baseline = Math.max(prev, currentStage.start);
      stageStartValueRef.current = baseline;
      return baseline;
    });
  }, [stage, currentStage.start]);

  useEffect(() => {
    if (progressOverride !== undefined) return;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - stageStartRef.current;
      const tau = estMs / 3;
      const eased = 1 - Math.exp(-elapsed / tau);
      const next = stageStartValueRef.current + (currentStage.cap - stageStartValueRef.current) * eased;
      setAutoProgress((prev) => (next > prev ? next : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, currentStage.cap, estMs, progressOverride]);

  const displayed = progressOverride ?? autoProgress;

  return (
    <Card variant="glass" className="p-12 text-center max-w-lg mx-auto">
      <div className="space-y-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 rounded-3xl animate-pulse-slow" />
        </div>

        {/* Stage Info */}
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-foreground">{currentStage.title}</h2>
          <p className="text-muted-foreground">{currentStage.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <Progress value={displayed} className="h-2 transition-[width] duration-200" />
          <p className="text-sm text-muted-foreground">{Math.round(displayed)}% complete</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">This may take a moment...</span>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Analysis
          </Button>
        )}
      </div>
    </Card>
  );
}
