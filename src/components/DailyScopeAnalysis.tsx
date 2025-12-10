import { CheckCircle2, Star, TrendingUp, Lightbulb, Quote } from "lucide-react";
import { ScoreCircle } from "./ScoreCircle";

interface DailyScopeAnalysisProps {
  completion: {
    rating: number;
    analysis_result: {
      summary?: string;
      highlights?: string[];
      improvements?: string[];
      clarityScore?: number;
      authenticityScore?: number;
      deliveryScore?: number;
      vocabularyScore?: number;
      personalNote?: string;
      quickTip?: string;
    };
    prompt: string;
    transcript: string | null;
  };
}

export const DailyScopeAnalysis = ({ completion }: DailyScopeAnalysisProps) => {
  const analysis = completion.analysis_result;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-6 md:p-8 space-y-6">
      {/* Completed Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-serif text-foreground">
            Daily Scope Complete!
          </h3>
          <p className="text-sm text-muted-foreground">Come back tomorrow for a new prompt</p>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex justify-center">
        <div className="text-center">
          <ScoreCircle score={completion.rating} label="Overall" size="lg" />
          <p className="mt-2 text-sm text-muted-foreground">Your Score</p>
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="bg-background/50 rounded-xl p-4 border border-border/50">
          <p className="text-foreground leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {analysis.clarityScore !== undefined && (
          <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
            <div className="text-2xl font-bold text-primary">{analysis.clarityScore}</div>
            <div className="text-xs text-muted-foreground">Clarity</div>
          </div>
        )}
        {analysis.authenticityScore !== undefined && (
          <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
            <div className="text-2xl font-bold text-primary">{analysis.authenticityScore}</div>
            <div className="text-xs text-muted-foreground">Authenticity</div>
          </div>
        )}
        {analysis.deliveryScore !== undefined && (
          <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
            <div className="text-2xl font-bold text-primary">{analysis.deliveryScore}</div>
            <div className="text-xs text-muted-foreground">Delivery</div>
          </div>
        )}
        {analysis.vocabularyScore !== undefined && (
          <div className="bg-background/50 rounded-xl p-3 text-center border border-border/50">
            <div className="text-2xl font-bold text-primary">{analysis.vocabularyScore}</div>
            <div className="text-xs text-muted-foreground">Vocabulary</div>
          </div>
        )}
      </div>

      {/* Highlights */}
      {analysis.highlights && analysis.highlights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Star className="w-4 h-4 text-primary" />
            <span>Highlights</span>
          </div>
          <div className="space-y-2">
            {analysis.highlights.map((highlight, i) => (
              <div
                key={i}
                className="bg-primary/10 rounded-lg p-3 text-sm text-foreground border-l-2 border-primary"
              >
                <Quote className="w-3 h-3 text-primary/60 inline mr-1" />
                {highlight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span>Areas to Improve</span>
          </div>
          <div className="space-y-2">
            {analysis.improvements.map((improvement, i) => (
              <div
                key={i}
                className="bg-accent/10 rounded-lg p-3 text-sm text-foreground border-l-2 border-accent"
              >
                {improvement}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Note */}
      {analysis.personalNote && (
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 border border-primary/30">
          <p className="text-foreground italic">"{analysis.personalNote}"</p>
        </div>
      )}

      {/* Quick Tip */}
      {analysis.quickTip && (
        <div className="flex items-start gap-3 bg-background/50 rounded-xl p-4 border border-border/50">
          <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tip for Tomorrow</p>
            <p className="text-sm text-foreground">{analysis.quickTip}</p>
          </div>
        </div>
      )}
    </div>
  );
};
