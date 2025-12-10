import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, ArrowLeft, Trash2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { InsightCard } from "@/components/InsightCard";
import { ScoreDial } from "@/components/ScoreDial";
import { AnalysisCard } from "@/components/AnalysisCard";

interface SavedReport {
  id: string;
  title: string | null;
  analysis_result: AnalysisResult;
  transcript: string | null;
  created_at: string;
}

// Demo data for showcase
const demoAnalyses = [
  { 
    id: "demo-1", 
    title: "A flirty convo about dogs", 
    description: "A flirty conversation between strangers about puppies",
    date: "Dec 9th, 2025", 
    socialScore: 82,
    confidenceScore: 75
  },
  { 
    id: "demo-2", 
    title: "A serious convo at work", 
    description: "A tense negotiation about project deadlines",
    date: "Dec 4th, 2025", 
    socialScore: 71,
    confidenceScore: 84
  },
  { 
    id: "demo-3", 
    title: "A fiery debate about anime", 
    description: "A heated debate about which anime is best",
    date: "Dec 12th, 2025", 
    socialScore: 78,
    confidenceScore: 69
  },
];

// Helper to get first sentence only
const getFirstSentence = (text: string): string => {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
};

const Insights = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data as unknown as SavedReport[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setReports(reports.filter(r => r.id !== id));
      toast.success("Report deleted");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate average scores from reports
  const avgSocialScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis_result.socialScore, 0) / reports.length)
    : 75;
  const avgConfidenceScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis_result.confidenceScore, 0) / reports.length)
    : 67;

  // Simplify action step to be clear, concise, and actionable
  const simplifyActionStep = (step: string): string => {
    let simplified = step;
    
    // Remove common filler phrases at the start
    const fillerPhrases = [
      /^in your next[^,]*,?\s*/i,
      /^next time[^,]*,?\s*/i,
      /^try to\s*/i,
      /^experiment with\s*/i,
      /^practice\s*/i,
      /^work on\s*/i,
      /^focus on\s*/i,
      /^consider\s*/i,
      /^start\s*/i,
      /^begin\s*/i,
      /^make sure to\s*/i,
      /^remember to\s*/i,
      /^don't forget to\s*/i,
      /^be sure to\s*/i,
      /^when you[^,]*,?\s*/i,
      /^before you[^,]*,?\s*/i,
      /^after you[^,]*,?\s*/i,
    ];
    
    for (const phrase of fillerPhrases) {
      simplified = simplified.replace(phrase, "");
    }
    
    // Capitalize first letter
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
    
    // Remove trailing period
    simplified = simplified.replace(/\.$/, "");
    
    // If still too long, truncate at a natural break point
    if (simplified.length > 50) {
      // Try to cut at "or", "and", "to" for natural breaks
      const breakPoints = [" or ", " and ", " to "];
      for (const bp of breakPoints) {
        const idx = simplified.indexOf(bp);
        if (idx > 15 && idx < 45) {
          simplified = simplified.substring(0, idx);
          break;
        }
      }
      // If still too long, just truncate
      if (simplified.length > 50) {
        simplified = simplified.substring(0, 47) + "...";
      }
    }
    
    return simplified;
  };

  // Get most common next step from all reports
  const getMostCommonNextStep = (): string => {
    if (reports.length === 0) return "Ask better questions";
    
    // Collect first next step from each report
    const allSteps: string[] = [];
    reports.forEach(r => {
      if (r.analysis_result.nextSteps && Array.isArray(r.analysis_result.nextSteps)) {
        if (r.analysis_result.nextSteps[0]) {
          allSteps.push(r.analysis_result.nextSteps[0]);
        }
      }
    });

    if (allSteps.length === 0) return "Ask better questions";

    // Return simplified version of the most recent step
    return simplifyActionStep(allSteps[0]);
  };

  const mainFocus = getMostCommonNextStep();

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
            <div className="container py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Insights
              </Button>
            </div>
          </header>

          <main className="container py-8 pb-32">
            <div className="max-w-4xl mx-auto">
              <AnalysisReport
                result={selectedReport.analysis_result}
                transcript={selectedReport.transcript}
                onReset={() => setSelectedReport(null)}
                onDeleted={() => {
                  setSelectedReport(null);
                  fetchReports();
                }}
              />
            </div>
          </main>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pb-24">
        {/* Header */}
        <header className="border-b border-primary/10 backdrop-blur-sm safe-area-top">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/app" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                  <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-serif font-semibold text-foreground">SocialScope</h1>
                  <p className="text-[9px] text-muted-foreground">AI-Powered Conversation Coach</p>
                </div>
              </Link>
              <HeaderNav />
            </div>
          </div>
          {/* Gold tinted divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-4 md:py-8 space-y-6 md:space-y-10 max-w-4xl mx-auto">
          {/* Section: Your Insights */}
          <section className="space-y-3 md:space-y-4 animate-fade-in">
            <h2 className="text-lg md:text-2xl font-serif text-foreground">
              Your <span className="text-gradient-primary">Insights</span>
            </h2>
            
            {/* Insight cards grid */}
            <div className="grid grid-cols-3 gap-2 md:flex md:gap-4">
              {/* Social Skills Score */}
              <InsightCard className="w-full md:w-[140px]">
                <ScoreDial score={avgSocialScore} label="Social Skills" size="sm" />
              </InsightCard>

              {/* Confidence Score */}
              <InsightCard className="w-full md:w-[140px]">
                <ScoreDial score={avgConfidenceScore} label="Confidence" size="sm" />
              </InsightCard>

              {/* Main Focus */}
              <InsightCard className="w-full md:w-[160px]">
                <div className="flex flex-col items-center justify-center h-full gap-1.5 md:gap-3">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[10px] md:text-sm font-semibold text-foreground">Main Focus</h3>
                    <p className="text-[9px] md:text-xs text-primary leading-tight">{mainFocus}</p>
                  </div>
                </div>
              </InsightCard>
            </div>
          </section>

          {/* Section: Recent Analyses */}
          <section className="space-y-3 md:space-y-4" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-lg md:text-2xl font-serif text-foreground animate-fade-in">
              Recent <span className="text-gradient-primary">Analyses</span>
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-card/50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-36 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="space-y-3 animate-fade-in">
                {/* Show demo analyses when no real data */}
                {demoAnalyses.map((analysis, index) => (
                  <div 
                    key={analysis.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  >
                    <AnalysisCard
                      title={analysis.title}
                      description={analysis.description}
                      date={analysis.date}
                      socialScore={analysis.socialScore}
                      confidenceScore={analysis.confidenceScore}
                      onClick={() => toast.info("Analyze a conversation to see your insights!")}
                    />
                  </div>
                ))}
                <p className="text-center text-sm text-muted-foreground pt-2">
                  These are sample analyses. Record a conversation to see your real insights!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report, index) => (
                  <div 
                    key={report.id}
                    className="animate-fade-in relative group"
                    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  >
                    <AnalysisCard
                      title={report.title || `Analysis from ${formatDate(report.created_at)}`}
                      description={getFirstSentence(report.analysis_result.summary)}
                      date={formatDate(report.created_at)}
                      socialScore={report.analysis_result.socialScore}
                      confidenceScore={report.analysis_result.confidenceScore}
                      onClick={() => setSelectedReport(report)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Insights;
