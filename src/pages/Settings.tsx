import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AudioWaveform, LogOut, ArrowLeft, Mic, User, Loader2, Check, Crown, Sparkles, ExternalLink, CreditCard, Settings2, RotateCcw, Shield, FileText, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { VoiceRegistration } from "@/components/VoiceRegistration";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { HeaderNav } from "@/components/HeaderNav";
import { AdminPanel } from "@/components/AdminPanel";
import { toast } from "sonner";

const GOAL_LABELS: Record<string, string> = {
  confidence: "Become more confident",
  professional: "Improve professionally",
  social: "Better social skills",
  anxiety: "Reduce social anxiety",
  listening: "Become a better listener",
};

const CONTEXT_LABELS: Record<string, string> = {
  work: "Work & Meetings",
  social: "Casual Conversations",
  dating: "Dating & Romance",
  networking: "Networking Events",
  public_speaking: "Public Speaking",
};

const SKILL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  unsure: "Not sure",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Few times a week",
  occasional: "When I have conversations",
};

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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [preferences, setPreferences] = useState<{
    primary_goal: string | null;
    improvement_context: string | null;
    skill_level: string | null;
    practice_frequency: string | null;
  } | null>(null);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

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
        .select("voice_registered, display_name, primary_goal, improvement_context, skill_level, practice_frequency")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setVoiceRegistered(data?.voice_registered || false);
      setDisplayName(data?.display_name || "");
      setPreferences({
        primary_goal: data?.primary_goal || null,
        improvement_context: data?.improvement_context || null,
        skill_level: data?.skill_level || null,
        practice_frequency: data?.practice_frequency || null,
      });
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

  const handleRedoOnboarding = async () => {
    if (!user) return;
    
    setIsResettingOnboarding(true);
    try {
      // Reset onboarding status in database
      const { error } = await supabase
        .from("profiles")
        .update({ 
          onboarding_completed: false,
          primary_goal: null,
          improvement_context: null,
          skill_level: null,
          practice_frequency: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear session cache
      sessionStorage.setItem(`onboarding_completed_${user.id}`, 'false');
      
      // Navigate to onboarding
      navigate("/onboarding");
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      toast.error("Failed to reset preferences");
    } finally {
      setIsResettingOnboarding(false);
    }
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
      if (data?.error?.includes('No Stripe customer')) {
        toast.info("Your subscription was granted by an admin. No billing to manage.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      // Handle case where user was granted pro access without Stripe
      if (error?.message?.includes('No Stripe customer') || error?.context?.body?.includes('No Stripe customer')) {
        toast.info("Your subscription was granted by an admin. No billing to manage.");
      } else {
        toast.error("Failed to open subscription management");
      }
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

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Header */}
        <header className="fixed-header bg-background/95 backdrop-blur-lg border-b border-border/50">
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

        {/* Spacer for fixed header */}
        <div className="h-[72px] safe-area-top flex-shrink-0" />

        {/* Main Content */}
        <main className="container py-8 md:py-12 pb-28 md:pb-12 flex-1">
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

              {/* Preferences Section */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Preferences
                  </CardTitle>
                  <CardDescription>Your personalization settings from onboarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preferences?.primary_goal || preferences?.improvement_context || preferences?.skill_level || preferences?.practice_frequency ? (
                    <>
                      <div className="grid gap-3">
                        {preferences.primary_goal && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Goal</span>
                            <span className="font-medium">{GOAL_LABELS[preferences.primary_goal] || preferences.primary_goal}</span>
                          </div>
                        )}
                        {preferences.improvement_context && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Focus Area</span>
                            <span className="font-medium">{CONTEXT_LABELS[preferences.improvement_context] || preferences.improvement_context}</span>
                          </div>
                        )}
                        {preferences.skill_level && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Skill Level</span>
                            <span className="font-medium">{SKILL_LABELS[preferences.skill_level] || preferences.skill_level}</span>
                          </div>
                        )}
                        {preferences.practice_frequency && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Practice Frequency</span>
                            <span className="font-medium">{FREQUENCY_LABELS[preferences.practice_frequency] || preferences.practice_frequency}</span>
                          </div>
                        )}
                      </div>
                      <Separator />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferences set yet.</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleRedoOnboarding}
                    disabled={isResettingOnboarding}
                    className="w-full gap-2"
                  >
                    {isResettingOnboarding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Redo Onboarding
                  </Button>
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
                    Register your voice for personalized conversation analysis.
                    {!voiceRegistered && " Complete setup to unlock 5 free analyses!"}
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

              {/* Legal Section */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Legal
                  </CardTitle>
                  <CardDescription>Privacy and terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/privacy">
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Privacy Policy
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/terms">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Terms of Service
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;