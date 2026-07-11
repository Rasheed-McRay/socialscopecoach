import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HeaderNav } from "@/components/HeaderNav";
import { InsightCard } from "@/components/InsightCard";
import { ScoreDial } from "@/components/ScoreDial";
import { AnalysisCard } from "@/components/AnalysisCard";
import { logger } from "@/lib/logger";
import { usePageTitle } from "@/hooks/usePageTitle";


interface SavedReport {
  id: string;
  title: string | null;
  analysis_result: AnalysisResult;
  transcript: string | null;
  created_at: string;
}


// Helper to get first sentence only
const getFirstSentence = (text: string): string => {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
};

const Insights = () => {
  usePageTitle("Insights");
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
      logger.error("Error fetching reports:", error);
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
      logger.error("Error deleting report:", error);
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
    : null;
  const avgConfidenceScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis_result.confidenceScore, 0) / reports.length)
    : null;

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
                reportId={selectedReport.id}
                onReset={() => setSelectedReport(null)}
                onDeleted={() => {
                  setSelectedReport(null);
                  fetchReports();
                }}
              />
            </div>
          </main>
        </div>
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Header */}
        <header className="fixed-header bg-background/95 backdrop-blur-lg border-b border-primary/10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/record" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
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

        {/* Spacer for fixed header */}
        <div className="flex-shrink-0" style={{ height: 'calc(60px + env(safe-area-inset-top))' }} />

        {/* Main Content */}
        <main className="px-4 md:px-8 py-4 md:py-8 pb-28 space-y-6 md:space-y-10 max-w-4xl mx-auto flex-1">
          {reports.length === 0 && !loading ? (
            // Empty state for new users
            <section className="space-y-6 animate-fade-in text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <AudioWaveform className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-serif text-foreground">
                  No insights yet
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Record and analyze a conversation to see your personalized insights and social skills scores.
                </p>
              </div>
              <Link to="/record">
                <Button variant="gradient" size="lg" className="gap-2">
                  Start Recording
                </Button>
              </Link>
            </section>
          ) : (
            <>
              {/* Section: Your Insights */}
              <section className="space-y-3 md:space-y-4 animate-fade-in">
                <h2 className="text-xl md:text-3xl font-serif text-foreground">
                  Your <span className="text-gradient-primary">Insights</span>
                </h2>
                
                {/* Insight cards grid */}
                <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
                  {/* Social Skills Score */}
                  <InsightCard className="w-full md:w-[140px]">
                    <ScoreDial score={avgSocialScore ?? 0} label="Social Skills" size="sm" />
                  </InsightCard>

                  {/* Confidence Score */}
                  <InsightCard className="w-full md:w-[140px]">
                    <ScoreDial score={avgConfidenceScore ?? 0} label="Confidence" size="sm" />
                  </InsightCard>
                </div>
              </section>

              {/* Section: Recent Analyses */}
              <section className="space-y-3 md:space-y-4" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-xl md:text-3xl font-serif text-foreground animate-fade-in">
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
            </>
          )}
        </main>
      </div>

      </div>
  );
};

export default Insights;
