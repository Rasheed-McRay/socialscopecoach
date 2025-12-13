import { useState, useEffect } from "react";
import { Flame, Trophy, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ProFeatureGate } from "@/components/ProFeatureGate";

interface AnalysisResult {
  socialScore?: number;
  confidenceScore?: number;
  strengths?: string[];
}

interface Report {
  id: string;
  created_at: string;
  analysis_result: AnalysisResult;
}

const AppProgress = () => {
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

  const chartData = reports.map((report, index) => ({
    day: index + 1,
    score: report.analysis_result?.socialScore || 0,
    date: new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

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

  const bestScores = {
    socialSkill: Math.max(...reports.map(r => r.analysis_result?.socialScore || 0), 0),
    confidence: Math.max(...reports.map(r => r.analysis_result?.confidenceScore || 0), 0),
  };

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
    return topStrength.split(":")[0].trim();
  };

  const streak = calculateStreak();
  const biggestStrength = findBiggestStrength();

  return (
    <ProFeatureGate 
      featureName="Progress Tracking" 
      description="Track your social skill improvement over time."
    >
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {/* Title */}
        <section className="animate-fade-in">
          <h2 className="text-xl font-serif text-foreground">Your Progress</h2>
          <p className="text-sm text-muted-foreground">Track improvement over time</p>
        </section>

        {/* Score Chart */}
        <Card className="glass animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Complete your first analysis to see progress!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold text-foreground">{streak}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{reports.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Best Scores */}
        <Card className="glass animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Best Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-2xl font-bold text-primary">{bestScores.socialSkill || "—"}</p>
                <p className="text-xs text-muted-foreground">Social</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-2xl font-bold text-primary">{bestScores.confidence || "—"}</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biggest Strength */}
        <Card className="glass animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-4 h-4 text-yellow-500" />
              Top Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-base font-semibold text-foreground">{biggestStrength}</p>
          </CardContent>
        </Card>
      </div>
    </ProFeatureGate>
  );
};

export default AppProgress;
