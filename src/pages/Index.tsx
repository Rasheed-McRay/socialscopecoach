import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, Mic, Lightbulb, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { InsightCard } from "@/components/InsightCard";
import { ScoreDial } from "@/components/ScoreDial";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const [recentCount, setRecentCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_reports")
        .select("analysis_result")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setRecentCount(data?.length || 0);
      if (data && data.length > 0) {
        const avg = Math.round(
          data.reduce((acc, r: any) => acc + (r.analysis_result?.socialScore || 0), 0) / data.length
        );
        setAvgScore(avg);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setDisplayName(data?.display_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const getGreetingName = () => {
    if (displayName) return displayName;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

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
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                  <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-serif font-semibold text-foreground">SocialScope</h1>
                  <p className="text-[9px] text-muted-foreground">AI-Powered Conversation Coach</p>
                </div>
              </div>
              
              <HeaderNav />
            </div>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-6 md:py-10 space-y-8 max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="space-y-2 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              Welcome back{getGreetingName() ? `, ${getGreetingName()}` : ''}
            </h2>
            <p className="text-muted-foreground">
              Ready to unlock your social superpowers?
            </p>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <InsightCard className="col-span-1">
              <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
                <ScoreDial score={avgScore || 75} label="Avg Score" size="sm" />
              </div>
            </InsightCard>

            <InsightCard className="col-span-1">
              <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{recentCount}</p>
                  <p className="text-xs text-muted-foreground">Analyses</p>
                </div>
              </div>
            </InsightCard>

            <InsightCard className="col-span-2 md:col-span-1">
              <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-foreground">Focus Area</h3>
                  <p className="text-xs text-primary">Ask better questions</p>
                </div>
              </div>
            </InsightCard>
          </section>

          {/* CTA Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border/50 p-6 md:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto flex items-center justify-center glow-primary">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif text-foreground">
                Start a New Analysis
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Record or upload a conversation to get instant AI feedback on your communication skills.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/record">
                  <Mic className="w-5 h-5" />
                  Record Now
                </Link>
              </Button>
            </div>
          </section>

          {/* Quick Links */}
          <section className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link 
              to="/insights" 
              className="rounded-xl bg-card/50 border border-border/50 p-4 hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">View Insights</h4>
                  <p className="text-xs text-muted-foreground">See your progress</p>
                </div>
              </div>
            </Link>

            <Link 
              to="/record" 
              className="rounded-xl bg-card/50 border border-border/50 p-4 hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">New Recording</h4>
                  <p className="text-xs text-muted-foreground">Analyze a conversation</p>
                </div>
              </div>
            </Link>
          </section>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Index;
