import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AudioWaveform, Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { usePageTitle } from "@/hooks/usePageTitle";

const FEATURES = [
  "30 conversation analyses per month",
  "Daily Scope practice prompts",
  "Progress tracking & insights",
  "Save unlimited reports",
  "Voice recognition analysis",
];

const Paywall = () => {
  usePageTitle("Upgrade to Pro");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);


  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleCheckout = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      logger.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-center">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <AudioWaveform className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-serif font-semibold text-foreground">SocialScope</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              You're all set up!
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Unlock Your Social Potential
            </h1>
            <p className="text-muted-foreground">
              Start improving your conversations today with personalized AI analysis.
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="glass border-2 border-primary/20 shadow-elevated">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">SocialScope Pro</CardTitle>
              <CardDescription>Everything you need to master social skills</CardDescription>
              <div className="pt-2">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features */}
              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </div>


              {/* Fine print */}
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime. No commitment required.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Paywall;
