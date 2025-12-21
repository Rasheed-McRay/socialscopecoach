import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioWaveform, Flame, Trophy, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { HeaderNav } from "@/components/HeaderNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ProFeatureGate } from "@/components/ProFeatureGate";

interface AnalysisResult {
  socialScore?: number;
  confidenceScore?: number;
  listeningScore?: number;
  engagementScore?: number;
  emotionalIntelligenceScore?: number;
  strengths?: string[];
}

interface Report {
  id: string;
  created_at: string;
  analysis_result: AnalysisResult;
}

const Progress = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_reports")
        .select("id, created_at, analysis_result")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReports((data as Report[]) || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate chart data
  const chartData = reports.map((report, index) => ({
    day: index + 1,
    score: report.analysis_result?.socialScore || 0,
    date: new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Calculate longest streak (consecutive days with analyses)
  const calculateStreak = () => {
    if (reports.length === 0) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < reports.length; i++) {
      const prevDate = new Date(reports[i - 1].created_at);
      const currDate = new Date(reports[i].created_at);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  // Calculate best scores
  const bestScores = {
    socialSkill: Math.max(...reports.map(r => r.analysis_result?.socialScore || 0), 0),
    confidence: Math.max(...reports.map(r => r.analysis_result?.confidenceScore || 0), 0),
  };

  // Find biggest strength
  const findBiggestStrength = () => {
    const strengthCounts: Record<string, number> = {};
    
    reports.forEach(report => {
      report.analysis_result?.strengths?.forEach((strength: string) => {
        strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
      });
    });

    const entries = Object.entries(strengthCounts);
    if (entries.length === 0) return "Not yet determined";
    
    const topStrength = entries.sort((a, b) => b[1] - a[1])[0][0];
    // Remove examples after colon
    return topStrength.split(":")[0].trim();
  };

  const streak = calculateStreak();
  const biggestStrength = findBiggestStrength();

  return (
    <ProFeatureGate 
      featureName="Progress Tracking" 
      description="Track your social skill improvement over time and see your growth trends."
    >
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
                <Link to="/record" className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                    <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-base font-serif font-semibold text-foreground">SocialScope</h1>
                    <p className="text-[9px] text-muted-foreground">Your Progress</p>
                  </div>
                </Link>
                
                <HeaderNav />
              </div>
            </div>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </header>

          {/* Spacer for fixed header */}
          <div className="h-[60px] safe-area-top flex-shrink-0" />

          {/* Main Content */}
          <main className="px-4 md:px-8 py-6 md:py-10 pb-28 space-y-6 max-w-4xl mx-auto flex-1">
            {/* Title */}
            <section className="animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-serif text-foreground">Your Progress</h2>
              <p className="text-muted-foreground">Track your social skill improvement over time</p>
            </section>

            {/* Score Chart */}
            <Card className="glass animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Complete your first analysis to see your progress!</p>
                  </div>
                )}
                <p className="text-center text-sm text-muted-foreground mt-2">Days</p>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Longest Streak */}
              <Card className="glass">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-3xl font-bold text-foreground">{streak}</p>
                  <p className="text-sm text-muted-foreground">Days</p>
                </CardContent>
              </Card>

              {/* Total Analyses */}
              <Card className="glass">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Analyses</p>
                  <p className="text-3xl font-bold text-foreground">{reports.length}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* Best Scores */}
            <Card className="glass animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Best Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-3xl font-bold text-primary">{bestScores.socialSkill || "—"}</p>
                    <p className="text-sm text-muted-foreground">Social Skill</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-3xl font-bold text-primary">{bestScores.confidence || "—"}</p>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biggest Strength */}
            <Card className="glass animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Biggest Strength
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-xl font-semibold text-foreground">{biggestStrength}</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProFeatureGate>
  );
};

export default Progress;