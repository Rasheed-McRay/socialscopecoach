import { useRef, useState, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { describeMicError } from "@/lib/nativeRuntime";
import { startRecordingSession, stopRecordingSession } from "@/lib/recordingSession";
import { hapticTap, hapticSuccess, hapticWarn } from "@/lib/haptics";
import { logger } from "@/lib/logger";

const MAX_RECORDING_TIME = 600; // 10 minutes in seconds
const WARNING_TIME = 540; // 9 minutes - warn 1 minute before limit

interface HomeRecorderProps {
  onRecordingComplete: (audioBlob: Blob, fileName: string) => void;
}

export function HomeRecorder({ onRecordingComplete }: HomeRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasWarned, setHasWarned] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remainingTime = MAX_RECORDING_TIME - recordingTime;
  const isInWarningZone = recordingTime >= WARNING_TIME;
  const progressPercent = (recordingTime / MAX_RECORDING_TIME) * 100;

  useEffect(() => {
    if (recordingTime >= MAX_RECORDING_TIME && isRecording) {
      toast.info("Maximum recording time reached (10 minutes)");
      stopRecording();
    } else if (recordingTime >= WARNING_TIME && !hasWarned && isRecording) {
      toast.warning("1 minute remaining");
      hapticWarn();
      setHasWarned(true);
    }
  }, [recordingTime, isRecording, hasWarned]);

  useEffect(() => {
    return () => {
      stopRecordingSession();
    };
  }, []);

  const startRecording = async () => {
    try {
      await startRecordingSession();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob, `recording-${Date.now()}.webm`);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      hapticTap();
      setIsRecording(true);
      setRecordingTime(0);
      setHasWarned(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) return prev;
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      logger.error("Error accessing microphone:", error);
      stopRecordingSession();
      const { title, description } = describeMicError(error);
      toast.error(title, { description });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      hapticSuccess();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecordingSession();
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <div className="text-center space-y-5">
        <div className="relative">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-pulse",
            isInWarningZone ? "bg-amber-500/20" : "bg-destructive/20"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              isInWarningZone ? "bg-amber-500/30" : "bg-destructive/30"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse",
                isInWarningZone ? "bg-amber-500" : "bg-destructive"
              )} />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p className={cn(
            "text-2xl font-mono font-semibold",
            isInWarningZone ? "text-amber-500" : "text-foreground"
          )}>
            {formatTime(recordingTime)}
          </p>
          {isInWarningZone ? (
            <p className="text-sm text-amber-500 font-medium">
              Auto-stop in {formatTime(remainingTime)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Recording...</p>
          )}
        </div>
        <Progress 
          value={progressPercent} 
          className={cn(
            "h-1.5 w-48 mx-auto",
            isInWarningZone && "[&>div]:bg-amber-500"
          )}
        />
        <Button
          variant="destructive"
          size="lg"
          onClick={stopRecording}
          className="gap-2"
        >
          <Square className="w-4 h-4" />
          Stop Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button
        variant="gradient"
        size="lg"
        onClick={startRecording}
        className="gap-2"
      >
        <Mic className="w-5 h-5" />
        Record Now
      </Button>
    </div>
  );
}
