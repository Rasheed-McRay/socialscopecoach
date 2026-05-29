import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { describeMicError } from "@/lib/nativeRuntime";
import { hapticTap, hapticSuccess } from "@/lib/haptics";
interface VoiceRecorderProps {
  sampleNumber: number;
  isComplete: boolean;
  onRecordingComplete: (audioBlob: Blob, duration: number) => Promise<void>;
  isUploading?: boolean;
}

const SAMPLE_PROMPTS = [
  "Tell us about your favorite hobby or pastime for 15-20 seconds.",
  "Describe what you did yesterday in a conversational way.",
  "Talk about a place you'd love to visit and why.",
  "Share a funny or memorable story from your life.",
  "Explain something you're passionate about to a friend.",
];

const MIN_DURATION = 10;
const MAX_DURATION = 30;

export const VoiceRecorder = ({
  sampleNumber,
  isComplete,
  onRecordingComplete,
  isUploading = false,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);

  const prompt = SAMPLE_PROMPTS[sampleNumber - 1];

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingTimeRef.current;
        
        if (duration >= MIN_DURATION) {
          await onRecordingComplete(audioBlob, duration);
        }
      };

      mediaRecorder.start();
      hapticTap();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime;
          if (newTime >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      const { title, description } = describeMicError(error);
      toast.error(title, { description });
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      hapticSuccess();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const progressPercent = (recordingTime / MAX_DURATION) * 100;
  const canStop = recordingTime >= MIN_DURATION;

  if (isComplete && !isRecording) {
    return (
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Sample {sampleNumber} recorded</p>
            <p className="text-sm text-muted-foreground">Voice sample saved successfully</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={startRecording}
          disabled={isUploading}
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Re-record this sample
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
          {sampleNumber}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Recording prompt:</p>
          <p className="text-foreground">{prompt}</p>
        </div>
      </div>

      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recording... {recordingTime}s</span>
            <span className={cn(
              "text-xs",
              canStop ? "text-primary" : "text-muted-foreground"
            )}>
              {canStop ? "Ready to save" : `${MIN_DURATION - recordingTime}s minimum`}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isUploading}
            className="w-full gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Recording
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant={canStop ? "default" : "secondary"}
            disabled={!canStop}
            className="w-full gap-2"
          >
            <Square className="w-4 h-4" />
            {canStop ? "Stop & Save" : `Wait ${MIN_DURATION - recordingTime}s...`}
          </Button>
        )}
      </div>
    </div>
  );
};
