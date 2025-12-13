import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, ArrowLeft, Mic, User, Loader2, Check, Crown, Sparkles, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { VoiceRegistration } from "@/components/VoiceRegistration";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/AdminPanel";
import { toast } from "sonner";

const AppSettings = () => {
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

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success("Welcome to Pro!");
      checkSubscriptionStatus();
      navigate('/app/settings', { replace: true });
    } else if (checkoutStatus === 'canceled') {
      toast.info("Checkout canceled");
      navigate('/app/settings', { replace: true });
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
      toast.success("Name updated");
    } catch (error) {
      toast.error("Failed to update name");
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
        toast.info("Subscription granted by admin.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      if (error?.message?.includes('No Stripe customer')) {
        toast.info("Subscription granted by admin.");
      } else {
        toast.error("Failed to open portal");
      }
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {showVoiceSetup ? (
        <div className="animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => setShowVoiceSetup(false)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <VoiceRegistration
            onComplete={handleVoiceComplete}
            showSkip={false}
            isOnboarding={false}
          />
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <AdminPanel />

          {impersonation.active && (
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-center">
              <p className="text-sm text-amber-200">
                Viewing as: <strong>{impersonation.tier}</strong>
              </p>
            </div>
          )}

          {/* Account */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Display Name</p>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1"
                    maxLength={50}
                  />
                  <Button 
                    onClick={handleSaveDisplayName} 
                    disabled={isSavingName}
                    size="icon"
                  >
                    {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Separator />
              <Button variant="destructive" onClick={signOut} className="w-full gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="w-4 h-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPro ? (
                <>
                  <div className="p-3 rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Pro Plan</span>
                      <Check className="w-4 h-4 text-amber-500 ml-auto" />
                    </div>
                    <p className="text-xs text-muted-foreground">All premium features</p>
                    <p className="text-xl font-bold mt-1">$9.99<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={isManagingSubscription}
                    className="w-full gap-2"
                  >
                    {isManagingSubscription ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Manage
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border-2 border-primary bg-primary/10">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">Basic</span>
                        <Check className="w-3 h-3 text-primary ml-auto" />
                      </div>
                      <p className="text-lg font-bold">Free</p>
                    </div>
                    <div className="p-3 rounded-xl border-2 border-border">
                      <div className="flex items-center gap-1 mb-1">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="text-sm font-medium">Pro</span>
                      </div>
                      <p className="text-lg font-bold">$9.99<span className="text-[10px] font-normal text-muted-foreground">/mo</span></p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpgradeToPro}
                    disabled={isCheckingOut}
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                    Upgrade to Pro
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Voice Profile */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="w-4 h-4" />
                Voice Profile
              </CardTitle>
              <CardDescription className="text-xs">
                {!voiceRegistered && "Complete setup for 5 free analyses!"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {voiceRegistered ? "Active" : "Not set up"}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  voiceRegistered ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {voiceRegistered ? "Active" : "Inactive"}
                </span>
              </div>
              <Button
                variant={voiceRegistered ? "secondary" : "default"}
                onClick={() => setShowVoiceSetup(true)}
                className="w-full gap-2"
              >
                <Mic className="w-4 h-4" />
                {voiceRegistered ? "Manage Voice" : "Set Up Voice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppSettings;
