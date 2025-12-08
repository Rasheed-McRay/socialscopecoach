import { useState, useEffect } from "react";
import { Mic, CheckCircle, X, Loader2, ArrowRight } from "lucide-react";
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
      // Upload audio to storage
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

      // Delete existing sample for this number if exists
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

      // Update local state
      setSamples((prev) => {
        const filtered = prev.filter((s) => s.sample_number !== sampleNumber);
        return [...filtered, { sample_number: sampleNumber, audio_url: audioUrl, duration_seconds: duration }].sort(
          (a, b) => a.sample_number - b.sample_number
        );
      });

      toast({
        title: "Sample recorded",
        description: `Voice sample ${sampleNumber} saved successfully.`,
      });

      // Check if we've hit the required samples
      const newSampleCount = samples.filter(s => s.sample_number !== sampleNumber).length + 1;
      if (newSampleCount >= REQUIRED_SAMPLES) {
        // Update profile to mark voice as registered
        await supabase
          .from("profiles")
          .update({ voice_registered: true })
          .eq("user_id", user.id);
      }
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

  const handleComplete = () => {
    if (samples.length >= REQUIRED_SAMPLES && onComplete) {
      onComplete();
    }
  };

  const completedCount = samples.length;
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
          and provide personalized analysis. You can add up to {TOTAL_SAMPLES} samples for better accuracy.
        </CardDescription>
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

        {/* Voice recorders */}
        <div className="space-y-4">
          {Array.from({ length: TOTAL_SAMPLES }, (_, i) => i + 1).map((num) => {
            const existingSample = samples.find((s) => s.sample_number === num);
            const isRequired = num <= REQUIRED_SAMPLES;
            
            // Only show optional samples if required ones are done
            if (!isRequired && completedCount < REQUIRED_SAMPLES) {
              return null;
            }

            return (
              <div key={num} className="relative">
                {!isRequired && (
                  <span className="absolute -top-2 right-2 text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                    Optional
                  </span>
                )}
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

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {showSkip && !isRegistrationComplete && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Skip for now
            </Button>
          )}
          
          <Button
            onClick={handleComplete}
            disabled={!isRegistrationComplete}
            className="flex-1 gap-2"
            variant="gradient"
          >
            {isRegistrationComplete ? (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              `Record ${REQUIRED_SAMPLES - completedCount} more sample${REQUIRED_SAMPLES - completedCount > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
