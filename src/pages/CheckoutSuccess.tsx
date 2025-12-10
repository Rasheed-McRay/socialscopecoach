import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Sparkles, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/contexts/SubscriptionContext";
import confetti from "canvas-confetti";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription, isPro } = useSubscription();
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Refresh subscription status
    const checkSubscription = async () => {
      await refreshSubscription();
      setRefreshing(false);
    };
    checkSubscription();

    return () => clearInterval(interval);
  }, [refreshSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20 shadow-lg shadow-primary/5">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-primary rounded-full">
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Pro!</h1>
            <p className="text-muted-foreground">
              Your subscription is now active. You've unlocked the full potential of SocialScope.
            </p>
          </div>

          {/* Pro badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
            <Sparkles className="w-4 h-4" />
            Pro Member
          </div>

          {/* Benefits reminder */}
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
            <p className="font-medium text-sm">Your Pro benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                30 conversation analyses per month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                Unlimited saved reports
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                Advanced insights and tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                Priority support
              </li>
            </ul>
          </div>

          {/* Status indicator */}
          {refreshing ? (
            <p className="text-sm text-muted-foreground">
              Verifying your subscription...
            </p>
          ) : isPro ? (
            <p className="text-sm text-primary font-medium">
              ✓ Subscription verified
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Subscription is being processed. It may take a moment to reflect.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild size="lg" className="w-full">
              <Link to="/record">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/settings">
                View Account Settings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
