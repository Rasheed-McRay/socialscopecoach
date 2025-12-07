import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/components/AnalysisReport";

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Transcription failed");
  }

  const data = await response.json();
  return data.transcript;
}

export async function analyzeConversation(transcript: string): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-conversation", {
    body: { transcript },
  });

  if (error) {
    throw new Error(error.message || "Analysis failed");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as AnalysisResult;
}
