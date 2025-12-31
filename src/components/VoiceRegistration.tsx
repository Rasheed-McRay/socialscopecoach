import { useState, useEffect } from "react";
import { Mic, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceRecorder } from "./VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface VoiceRegistrationProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  isOnboarding?: boolean;
}

interface VoiceSample {
  sample_number: number;
  audio_url: string;
  duration_seconds: number;
}

const REQUIRED_SAMPLES = 3;
const TOTAL_SAMPLES = 5;

export const VoiceRegistration = ({
  onComplete,
  onSkip,
  showSkip = true,
  isOnboarding = false,
}: VoiceRegistrationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingSample, setUploadingSample] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchVoiceSamples();
    }
  }, [user]);

  const fetchVoiceSamples = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("voice_samples")
        .select("sample_number, audio_url, duration_seconds")
        .eq("user_id", user.id)
        .order("sample_number");

      if (error) throw error;
      setSamples(data || []);
    } catch (error) {
      console.error("Error fetching voice samples:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (
    sampleNumber: number,
    audioBlob: Blob,
    duration: number
  ) => {
    if (!user) return;

    setUploadingSample(sampleNumber);

    try {
      // Check for existing sample and delete old file from storage
      const { data: existingSample } = await supabase
        .from("voice_samples")
        .select("audio_url")
        .eq("user_id", user.id)
        .eq("sample_number", sampleNumber)
        .maybeSingle();

      if (existingSample?.audio_url) {
        // Extract file path from signed URL (format: user-id/sample-N-timestamp.webm)
        try {
          const url = new URL(existingSample.audio_url);
          const pathMatch = url.pathname.match(/voice-samples\/([^?]+)/);
          if (pathMatch && pathMatch[1]) {
            const oldFilePath = decodeURIComponent(pathMatch[1]);
            await supabase.storage.from("voice-samples").remove([oldFilePath]);
          }
        } catch (e) {
          console.error("Failed to delete old voice sample file:", e);
          // Continue anyway - don't block new upload
        }
      }

      // Upload new audio to storage
      const fileName = `${user.id}/sample-${sampleNumber}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-samples")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("voice-samples")
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error("Failed to generate signed URL for voice sample");
      }

      const audioUrl = signedUrlData.signedUrl;

      // Delete existing sample record
      await supabase
        .from("voice_samples")
        .delete()
        .eq("user_id", user.id)
        .eq("sample_number", sampleNumber);

      // Insert new sample record
      const { error: insertError } = await supabase
        .from("voice_samples")
        .insert({
          user_id: user.id,
          sample_number: sampleNumber,
          audio_url: audioUrl,
          duration_seconds: duration,
        });

      if (insertError) throw insertError;

      // Update local state and check for completion
      setSamples((prev) => {
        const filtered = prev.filter((s) => s.sample_number !== sampleNumber);
        const newSamples = [...filtered, { sample_number: sampleNumber, audio_url: audioUrl, duration_seconds: duration }].sort(
          (a, b) => a.sample_number - b.sample_number
        );
        
        // Check for first-time completion using the new state
        const previousRequiredCount = prev.filter(s => s.sample_number <= REQUIRED_SAMPLES).length;
        const newRequiredCount = newSamples.filter(s => s.sample_number <= REQUIRED_SAMPLES).length;
        const wasNotComplete = previousRequiredCount < REQUIRED_SAMPLES;
        const isNowComplete = newRequiredCount >= REQUIRED_SAMPLES;
        
        if (wasNotComplete && isNowComplete) {
          // Only grant bonus if user hasn't received it before (voice_registered = false)
          // This prevents abuse by re-recording voice samples
          supabase
            .from("profiles")
            .select("voice_registered")
            .eq("user_id", user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile && !profile.voice_registered) {
                // First-time completion - grant bonus
                supabase
                  .from("profiles")
                  .update({ 
                    voice_registered: true,
                    voice_bonus_remaining: 5 
                  })
                  .eq("user_id", user.id)
                  .then(() => {
                    toast({
                      title: "🎉 Voice profile complete!",
                      description: "You've earned 5 free analyses as a reward!",
                    });
                  });
              } else {
                // Already registered before - just show completion toast
                toast({
                  title: "Voice profile updated",
                  description: "Your voice samples have been re-recorded.",
                });
              }
            });
        }
        
        return newSamples;
      });

      toast({
        title: "Sample recorded",
        description: `Voice sample ${sampleNumber} saved successfully.`,
      });
    } catch (error) {
      console.error("Error saving voice sample:", error);
      toast({
        title: "Error",
        description: "Failed to save voice sample. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSample(null);
    }
  };

  const handleComplete = async () => {
    const requiredSamplesCount = samples.filter(s => s.sample_number <= REQUIRED_SAMPLES).length;
    if (requiredSamplesCount >= REQUIRED_SAMPLES && onComplete) {
      // Ensure voice_registered is set in DB and cache before navigating
      if (user) {
        await supabase
          .from("profiles")
          .update({ voice_registered: true })
          .eq("user_id", user.id);
        sessionStorage.setItem(`voice_registered_${user.id}`, 'true');
      }
      onComplete();
    }
  };

  const completedCount = samples.filter(s => s.sample_number <= REQUIRED_SAMPLES).length;
  const progressPercent = (completedCount / REQUIRED_SAMPLES) * 100;
  const isRegistrationComplete = completedCount >= REQUIRED_SAMPLES;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass shadow-elevated">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center">
          <Mic className="w-8 h-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-serif">
          {isOnboarding ? "Set Up Your Voice Profile" : "Voice Registration"}
        </CardTitle>
        <CardDescription className="text-muted-foreground max-w-md mx-auto">
          Record {REQUIRED_SAMPLES} voice samples so we can identify your voice in conversations
          and provide personalized analysis.
        </CardDescription>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="text-lg">🎁</span>
          Complete all {REQUIRED_SAMPLES} samples to unlock 5 free analyses!
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {REQUIRED_SAMPLES} required samples
            </span>
            {isRegistrationComplete && (
              <span className="text-primary flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Complete
              </span>
            )}
          </div>
          <Progress value={Math.min(progressPercent, 100)} className="h-2" />
        </div>

        {/* Voice recorders - Required samples */}
        <div className="space-y-4">
          {Array.from({ length: REQUIRED_SAMPLES }, (_, i) => i + 1).map((num) => {
            const existingSample = samples.find((s) => s.sample_number === num);

            return (
              <VoiceRecorder
                key={num}
                sampleNumber={num}
                isComplete={!!existingSample}
                isUploading={uploadingSample === num}
                onRecordingComplete={async (blob, duration) => {
                  await handleRecordingComplete(num, blob, duration);
                }}
              />
            );
          })}
        </div>

        {/* Optional samples section - shown after required are complete */}
        {isRegistrationComplete && (
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Add more samples for better voice recognition accuracy
            </p>
            <div className="space-y-4">
              {Array.from({ length: TOTAL_SAMPLES - REQUIRED_SAMPLES }, (_, i) => i + REQUIRED_SAMPLES + 1).map((num) => {
                const existingSample = samples.find((s) => s.sample_number === num);

                return (
                  <div key={num} className="relative">
                    <span className="absolute -top-2 right-2 text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground z-10">
                      Optional
                    </span>
                    <VoiceRecorder
                      sampleNumber={num}
                      isComplete={!!existingSample}
                      isUploading={uploadingSample === num}
                      onRecordingComplete={async (blob, duration) => {
                        await handleRecordingComplete(num, blob, duration);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4">
          <Button
            onClick={handleComplete}
            disabled={!isRegistrationComplete}
            className="w-full gap-2 h-11"
            variant="gradient"
          >
            {isRegistrationComplete ? (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              `Record more samples`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
