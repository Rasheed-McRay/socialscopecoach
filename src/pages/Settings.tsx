import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AudioWaveform, LogOut, ArrowLeft, Mic, User, Loader2, Check, Crown, Sparkles, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { VoiceRegistration } from "@/components/VoiceRegistration";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";
import { AdminPanel } from "@/components/AdminPanel";
import { toast } from "sonner";
const Settings = () => {
  const { user, signOut } = useAuth();
  const { tier, isPro, refreshSubscription } = useSubscription();
  const { isOwner, impersonation } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [voiceRegistered, setVoiceRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkSubscriptionStatus();
    }
  }, [user]);

  // Handle checkout success/cancel
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success("Welcome to Pro! Your subscription is now active.");
      checkSubscriptionStatus();
      // Clean up URL
      navigate('/settings', { replace: true });
    } else if (checkoutStatus === 'canceled') {
      toast.info("Checkout was canceled");
      navigate('/settings', { replace: true });
    }
  }, [searchParams]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      if (data?.subscribed) {
        await refreshSubscription();
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("voice_registered, display_name")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setVoiceRegistered(data?.voice_registered || false);
      setDisplayName(data?.display_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;
    
    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Display name updated");
    } catch (error) {
      console.error("Error updating display name:", error);
      toast.error("Failed to update display name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleVoiceComplete = () => {
    setShowVoiceSetup(false);
    setVoiceRegistered(true);
  };

  const handleUpgradeToPro = async () => {
    if (!user) return;
    
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open subscription management");
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <Link
                to="/record"
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <AudioWaveform className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-semibold text-foreground">SocialScope</h1>
                  <p className="text-xs text-muted-foreground">Settings</p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/record")} className="gap-2 md:hidden">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <HeaderNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 md:py-12 pb-28 md:pb-12">
          {showVoiceSetup ? (
            <div className="animate-fade-in">
              <Button
                variant="ghost"
                onClick={() => setShowVoiceSetup(false)}
                className="mb-6 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
              </Button>
              <VoiceRegistration
                onComplete={handleVoiceComplete}
                showSkip={false}
                isOnboarding={false}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              {/* Admin Panel - Owner Only */}
              <AdminPanel />

              {/* Impersonation Banner */}
              {impersonation.active && (
                <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-center">
                  <p className="text-sm text-amber-200">
                    Viewing as: <strong>{impersonation.tier}</strong> user with <strong>{impersonation.accessLevel}</strong> access
                  </p>
                </div>
              )}

              {/* Account Section */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account
                  </CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground mb-2">Display Name</p>
                    <div className="flex gap-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="flex-1"
                        maxLength={50}
                      />
                      <Button 
                        onClick={handleSaveDisplayName} 
                        disabled={isSavingName}
                        size="icon"
                      >
                        {isSavingName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="destructive" onClick={signOut} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Section */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Subscription
                  </CardTitle>
                  <CardDescription>Manage your subscription plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPro ? (
                    <>
                      <div className="p-4 rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="font-semibold text-lg">Pro Plan</span>
                          <Check className="w-4 h-4 text-amber-500 ml-auto" />
                        </div>
                        <p className="text-sm text-muted-foreground">You have access to all premium features</p>
                        <p className="text-2xl font-bold mt-2">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleManageSubscription}
                        disabled={isManagingSubscription}
                        className="w-full gap-2"
                      >
                        {isManagingSubscription ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        Manage Subscription
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative p-4 rounded-xl border-2 border-primary bg-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Basic</span>
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          </div>
                          <p className="text-xs text-muted-foreground">Free tier with essential features</p>
                          <p className="text-lg font-bold mt-2">Free</p>
                        </div>
                        <div className="relative p-4 rounded-xl border-2 border-border hover:border-amber-500/50 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">Pro</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Advanced features & insights</p>
                          <p className="text-lg font-bold mt-2">$9.99<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleUpgradeToPro}
                        disabled={isCheckingOut}
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Crown className="w-4 h-4" />
                        )}
                        Upgrade to Pro
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Voice Profile Section */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Profile
                  </CardTitle>
                  <CardDescription>
                    Register your voice for personalized conversation analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Voice Registration</p>
                      <p className="text-sm text-muted-foreground">
                        {voiceRegistered
                          ? "Your voice is registered for personalized analysis"
                          : "No voice samples registered yet"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        voiceRegistered
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {voiceRegistered ? "Active" : "Not set up"}
                    </span>
                  </div>
                  <Button
                    variant={voiceRegistered ? "secondary" : "default"}
                    onClick={() => setShowVoiceSetup(true)}
                    className="w-full gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    {voiceRegistered ? "Manage Voice Samples" : "Set Up Voice Profile"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Settings;