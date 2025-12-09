import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, Lightbulb, ArrowLeft, Trash2, Calendar, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePWA } from "@/hooks/use-pwa";
import { BottomNav } from "@/components/BottomNav";
import { AnalysisReport, AnalysisResult } from "@/components/AnalysisReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ScoreCircle } from "@/components/ScoreCircle";

interface SavedReport {
  id: string;
  title: string | null;
  analysis_result: AnalysisResult;
  transcript: string | null;
  created_at: string;
}

const Insights = () => {
  const { isPWA } = usePWA();
  const { user, signOut } = useAuth();
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

  if (selectedReport) {
    return (
      <div className={`min-h-screen bg-background ${isPWA ? 'pb-20' : ''}`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 safe-area-top">
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

          <main className="container py-8">
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

        {isPWA && <BottomNav />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isPWA ? 'pb-20' : ''}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {isPWA ? (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 safe-area-top">
            <div className="container py-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <h1 className="text-lg font-serif font-semibold text-foreground">Insights</h1>
                </div>
              </div>
            </div>
          </header>
        ) : (
          <header className="border-b border-border/50 backdrop-blur-sm">
            <div className="container py-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <AudioWaveform className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-serif font-semibold text-foreground">SocialScope</h1>
                    <p className="text-xs text-muted-foreground">AI-Powered Conversation Coach</p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-4">
                  {user?.email && (
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {user.email}
                    </span>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/settings" className="gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="container py-8 md:py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">
                Your <span className="text-gradient-primary">Insights</span>
              </h1>
              <p className="text-muted-foreground">
                Review your saved conversation analyses
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No insights yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Analyze a conversation and save it to see your insights here.
                  </p>
                  <Button asChild>
                    <Link to="/app">Analyze a Conversation</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="border-border/50 hover:border-border transition-colors cursor-pointer group"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <ScoreCircle 
                            score={report.analysis_result.socialScore} 
                            label="Social" 
                            size="sm"
                          />
                          <ScoreCircle 
                            score={report.analysis_result.confidenceScore} 
                            label="Confidence" 
                            size="sm"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {report.title || `Analysis from ${formatDate(report.created_at)}`}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(report.created_at)}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(report.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {!isPWA && (
          <footer className="border-t border-border/50 mt-auto">
            <div className="container py-6">
              <p className="text-center text-sm text-muted-foreground">
                Built with care for better human connection
              </p>
            </div>
          </footer>
        )}
      </div>

      {isPWA && <BottomNav />}
    </div>
  );
};

export default Insights;
