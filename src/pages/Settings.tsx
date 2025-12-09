import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioWaveform, LogOut, ArrowLeft, Mic, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VoiceRegistration } from "@/components/VoiceRegistration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [voiceRegistered, setVoiceRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("voice_registered")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setVoiceRegistered(data?.voice_registered || false);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceComplete = () => {
    setShowVoiceSetup(false);
    setVoiceRegistered(true);
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
                to="/app"
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

              <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 md:py-12">
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
    </div>
  );
};

export default Settings;