import { Loader2, AudioWaveform, Brain, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProcessingStateProps {
  stage: "uploading" | "transcribing" | "analyzing";
  progress: number;
  onCancel?: () => void;
}

const stages = {
  uploading: {
    icon: AudioWaveform,
    title: "Processing Audio",
    description: "Preparing your audio for analysis...",
  },
  transcribing: {
    icon: FileText,
    title: "Transcribing",
    description: "Converting speech to text...",
  },
  analyzing: {
    icon: Brain,
    title: "Analyzing Social Skills",
    description: "Evaluating tone, confidence, and conversation dynamics...",
  },
};

export function ProcessingState({ stage, progress, onCancel }: ProcessingStateProps) {
  const currentStage = stages[stage];
  const Icon = currentStage.icon;

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
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">This may take a minute...</span>
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
