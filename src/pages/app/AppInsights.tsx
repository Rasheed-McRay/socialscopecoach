import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, ArrowLeft, Trash2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { InsightCard } from "@/components/InsightCard";
import { ScoreDial } from "@/components/ScoreDial";
import { AnalysisCard } from "@/components/AnalysisCard";
import { FocusExamplesDialog } from "@/components/FocusExamplesDialog";

interface SavedReport {
  id: string;
  title: string | null;
  analysis_result: AnalysisResult;
  transcript: string | null;
  created_at: string;
}

const getFirstSentence = (text: string): string => {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
};

const AppInsights = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [focusDialogOpen, setFocusDialogOpen] = useState(false);

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
    });
  };

  const avgSocialScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis_result.socialScore, 0) / reports.length)
    : null;
  const avgConfidenceScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis_result.confidenceScore, 0) / reports.length)
    : null;

  const simplifyActionStep = (step: string): string => {
    let simplified = step.replace(/^(in your next[^,]*,?\s*|try to\s*|practice\s*|focus on\s*)/i, "");
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
    simplified = simplified.replace(/\.$/, "");
    return simplified.length <= 40 ? simplified : simplified.substring(0, 40);
  };

  const getMostCommonNextStep = (): string | null => {
    if (reports.length === 0) return null;
    const allSteps: string[] = [];
    reports.forEach(r => {
      if (r.analysis_result.nextSteps && Array.isArray(r.analysis_result.nextSteps)) {
        if (r.analysis_result.nextSteps[0]) {
          allSteps.push(r.analysis_result.nextSteps[0]);
        }
      }
    });
    if (allSteps.length === 0) return null;
    return simplifyActionStep(allSteps[0]);
  };

  const mainFocus = getMostCommonNextStep();

  if (selectedReport) {
    return (
      <div className="px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedReport(null)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="max-w-lg mx-auto">
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
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {reports.length === 0 && !loading ? (
        <section className="space-y-4 animate-fade-in text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <AudioWaveform className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif text-foreground">No insights yet</h2>
            <p className="text-sm text-muted-foreground">
              Record and analyze a conversation to see your insights.
            </p>
          </div>
          <Link to="/app/record">
            <Button variant="gradient" size="lg" className="gap-2">
              Start Recording
            </Button>
          </Link>
        </section>
      ) : (
        <>
          {/* Insight Cards */}
          <section className="space-y-3 animate-fade-in">
            <h2 className="text-xl font-serif text-foreground">
              Your <span className="text-gradient-primary">Insights</span>
            </h2>
            
            <div className="grid grid-cols-3 gap-2">
              <InsightCard className="w-full">
                <ScoreDial score={avgSocialScore ?? 0} label="Social" size="sm" />
              </InsightCard>

              <InsightCard className="w-full">
                <ScoreDial score={avgConfidenceScore ?? 0} label="Confidence" size="sm" />
              </InsightCard>

              {mainFocus && (
                <InsightCard 
                  className="w-full cursor-pointer"
                  onClick={() => setFocusDialogOpen(true)}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-[10px] font-semibold text-foreground">Focus</h3>
                      <p className="text-[9px] text-primary leading-tight line-clamp-2">{mainFocus}</p>
                    </div>
                  </div>
                </InsightCard>
              )}
            </div>
          </section>

          {/* Recent Analyses */}
          <section className="space-y-3" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-lg font-serif text-foreground animate-fade-in">
              Recent <span className="text-gradient-primary">Analyses</span>
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
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
                      title={report.title || formatDate(report.created_at)}
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

      {mainFocus && (
        <FocusExamplesDialog
          open={focusDialogOpen}
          onOpenChange={setFocusDialogOpen}
          focusArea={mainFocus}
        />
      )}
    </div>
  );
};

export default AppInsights;
