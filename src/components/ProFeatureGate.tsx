import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";

interface ProFeatureGateProps {
  children: ReactNode;
  featureName: string;
  description?: string;
  /** If true, shows a compact inline lock instead of full-page gate */
  inline?: boolean;
}

export function ProFeatureGate({ 
  children, 
  featureName, 
  description,
  inline = false 
}: ProFeatureGateProps) {
  const { isPro, loading } = useSubscription();
  const navigate = useNavigate();

  // Don't block while loading - assume user has access to avoid flash of locked content
  // If they don't have access, it will show after load completes
  if (loading) {
    return <>{children}</>;
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="rounded-xl bg-card border border-primary/20 p-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Pro Feature</span>
        </div>
        <p className="text-xs text-muted-foreground">{featureName} is available for Pro users</p>
        <Button 
          size="sm" 
          variant="default"
          onClick={() => navigate("/settings")}
          className="gap-1.5"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="rounded-2xl bg-card border border-primary/20 p-8 text-center space-y-6 backdrop-blur-sm">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-semibold text-foreground">
              {featureName}
            </h1>
            <p className="text-muted-foreground">
              {description || "This feature is available exclusively for Pro subscribers."}
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pro Benefits
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                30 conversation analyses per month
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Daily Scope practice prompts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Progress tracking & insights
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Save unlimited reports
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={() => navigate("/settings")}
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/record")}
              className="text-muted-foreground"
            >
              Back to Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
