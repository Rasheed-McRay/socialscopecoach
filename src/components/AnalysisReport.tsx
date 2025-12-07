import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  MessageSquare,
  Heart,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { cn } from "@/lib/utils";

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  standoutMoments: string[];
  improvements: string[];
  personalCompliment: string;
  socialScore: number;
  confidenceScore: number;
  nextSteps: string[];
  vocalTone: {
    confidence: string;
    nervousness: string;
    enthusiasm: string;
    warmth: string;
    assertiveness: string;
    archetype: string;
  };
  technicalSkills: {
    questionQuality: string;
    talkingRatio: string;
    empathySignals: string;
    interruptingFrequency: string;
    valueAdded: string;
    clarity: string;
    socialCalibration: string;
  };
  emotionalCues: {
    emotionalState: string;
    confidenceFluctuations: string;
    energyChanges: string;
  };
}

interface AnalysisReportProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisReport({ result, onReset }: AnalysisReportProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Scores */}
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-serif mb-2">Your Analysis Results</h1>
          <p className="text-muted-foreground">Here's a detailed breakdown of your conversation</p>
        </div>

        <div className="flex justify-center gap-12">
          <ScoreCircle score={result.socialScore} label="Social Skills" size="lg" />
          <ScoreCircle score={result.confidenceScore} label="Confidence" size="lg" />
        </div>
      </div>

      {/* Personal Compliment */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{result.personalCompliment}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Conversation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <TrendingUp className="w-5 h-5" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                  <span className="text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <TrendingDown className="w-5 h-5" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                  <span className="text-muted-foreground">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Vocal Tone Analysis */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Vocal Tone & Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(result.vocalTone).map(([key, value]) => (
              <div key={key} className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Skills */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Technical Conversation Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(result.technicalSkills).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Standout Moments */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Standout Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.standoutMoments.map((moment, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-primary font-bold">{i + 1}.</span>
                <span className="text-muted-foreground">{moment}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Your Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-foreground pt-1">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Analyze Another Conversation
        </Button>
      </div>
    </div>
  );
}
