import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  MessageSquare,
  Heart,
  Sparkles,
  ChevronRight,
  RotateCcw,
  FileText,
  ChevronDown,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/ScoreCircle";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  transcript?: string | null;
  onReset: () => void;
  reportId?: string;
  onSaved?: (id: string) => void;
  onDeleted?: () => void;
}

export function AnalysisReport({ result, transcript, onReset, reportId, onSaved, onDeleted }: AnalysisReportProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(reportId || null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('saved_reports')
        .insert([{
          user_id: user.id,
          title: `Analysis - ${new Date().toLocaleDateString()}`,
          transcript: transcript || null,
          analysis_result: JSON.parse(JSON.stringify(result)),
        }])
        .select('id')
        .single();

      if (error) throw error;

      setSavedId(data.id);
      onSaved?.(data.id);
      toast({
        title: "Report Saved",
        description: "Your analysis report has been saved.",
      });
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedId(null);
      onDeleted?.();
      toast({
        title: "Report Deleted",
        description: "Your saved report has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
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

      {/* Transcript Section */}
      {transcript && (
        <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
          <Card variant="glass">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    View Full Transcript
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    isTranscriptOpen && "rotate-180"
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="p-4 rounded-lg bg-secondary/30 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                    {transcript}
                  </pre>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
        {!savedId ? (
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Report
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="destructive" 
            size="lg" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Saved Report"
            )}
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Analyze Another Conversation
        </Button>
      </div>
    </div>
  );
}
