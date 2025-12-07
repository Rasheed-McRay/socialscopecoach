import { useRef, useState, useCallback } from "react";
import { Upload, Mic, Square, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AudioUploaderProps {
  onAudioReady: (mediaBlob: Blob, fileName: string) => void;
  isProcessing: boolean;
}

export function AudioUploader({ onAudioReady, isProcessing }: AudioUploaderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
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
        onAudioReady(blob, `recording-${Date.now()}.webm`);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const isValidMediaFile = (file: File): boolean => {
    return file.type.startsWith("audio/") || file.type.startsWith("video/");
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file && isValidMediaFile(file)) {
        onAudioReady(file, file.name);
      }
    },
    [onAudioReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        variant="glass"
        className={cn(
          "relative overflow-hidden transition-all duration-300 cursor-pointer group",
          dragOver && "border-primary ring-2 ring-primary/20",
          isProcessing && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-12 text-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-1">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <Video className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          </div>
          <h3 className="text-xl font-medium mb-2">Drop your audio or video file here</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Supports MP3, WAV, M4A, WebM, MP4, MOV, AVI
          </p>
          <Button variant="outline" size="sm" disabled={isProcessing}>
            Browse Files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">or</span>
        </div>
      </div>

      {/* Record Button */}
      <Card variant="glass" className="p-8">
        <div className="text-center">
          {isRecording ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-destructive/30 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-destructive animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-mono font-semibold text-foreground">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-sm text-muted-foreground">Recording...</p>
              </div>
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
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary flex items-center justify-center">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Record a conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Use your microphone to record live audio
                </p>
              </div>
              <Button
                variant="gradient"
                size="lg"
                onClick={startRecording}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
