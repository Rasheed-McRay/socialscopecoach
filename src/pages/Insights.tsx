import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, Lightbulb, ArrowLeft, Trash2, Settings, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
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
    date: "Dec 9th, 2025", 
    tone: "Playful + Curious", 
    toneEmoji: "🔥" 
  },
  { 
    id: "demo-2", 
    title: "A serious convo at work", 
    date: "Dec 4th, 2025", 
    tone: "Professional + Assertive", 
    toneEmoji: "🧠" 
  },
  { 
    id: "demo-3", 
    title: "A fiery debate about anime", 
    date: "Dec 12th, 2025", 
    tone: "Excited + Competitive", 
    toneEmoji: "🎭" 
  },
];

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
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all group"
                >
                  <div className="relative">
                    <Lightbulb className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]" />
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all group"
                >
                  <Link to="/settings">
                    <div className="relative">
                      <Settings className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]" />
                    </div>
                  </Link>
                </Button>
              </div>
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
            
            {/* Horizontal scrollable insight cards */}
            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {/* Social Skill Score */}
              <InsightCard className="flex-shrink-0 w-[90px] md:w-[140px]">
                <ScoreDial score={avgSocialScore} label="Social" size="sm" />
              </InsightCard>

              {/* Confidence Score */}
              <InsightCard className="flex-shrink-0 w-[90px] md:w-[140px]">
                <ScoreDial score={avgConfidenceScore} label="Confidence" size="sm" />
              </InsightCard>

              {/* Main Focus */}
              <InsightCard className="flex-shrink-0 w-[100px] md:w-[160px]">
                <div className="flex flex-col items-center justify-center h-full gap-1.5 md:gap-3">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[10px] md:text-sm font-semibold text-foreground">Main Focus</h3>
                    <p className="text-[9px] md:text-xs text-primary leading-tight">Ask better questions</p>
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
                      date={analysis.date}
                      tone={analysis.tone}
                      toneEmoji={analysis.toneEmoji}
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
                      date={formatDate(report.created_at)}
                      tone={report.analysis_result.vocalTone?.archetype || "Engaging"}
                      toneEmoji={report.analysis_result.socialScore >= 70 ? "🔥" : report.analysis_result.confidenceScore >= 70 ? "🧠" : "💬"}
                      onClick={() => setSelectedReport(report)}
                    />
                    {/* Delete button overlay */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
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
