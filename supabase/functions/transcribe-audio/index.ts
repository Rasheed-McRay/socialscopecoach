import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received audio file:", audioFile.name, "size:", audioFile.size, "type:", audioFile.type);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Convert audio to base64 for the AI model
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Determine the MIME type
    let mimeType = audioFile.type || "audio/webm";
    if (mimeType === "audio/mp3") mimeType = "audio/mpeg";

    console.log("Transcribing audio with mime type:", mimeType);

    // Use Gemini for transcription (it handles audio natively)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this audio recording. If there are multiple speakers, label them as "Speaker A:", "Speaker B:", etc. Include all dialogue and any notable pauses or emotional indicators in brackets like [laughs] or [pause]. Provide a complete and accurate transcription.`,
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "wav",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    const transcript = data.choices?.[0]?.message?.content;

    if (!transcript) {
      throw new Error("No transcription generated");
    }

    console.log("Transcription completed, length:", transcript.length);

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in transcribe-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Transcription failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
