import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRANSCRIPTION_PROMPT = `You are an expert conversation transcriber. Transcribe this audio recording with RICH CONTEXTUAL DETAIL.

TRANSCRIPTION REQUIREMENTS:

1. SPEAKER IDENTIFICATION
- Label speakers as "Speaker A:", "Speaker B:", etc.
- Be consistent with speaker labels throughout

2. EMOTIONAL & TONAL MARKERS (include in brackets)
- Confidence indicators: [speaking confidently], [hesitant], [uncertain], [assertive]
- Emotional states: [laughs], [nervous laughter], [sighs], [excited], [frustrated], [warm tone]
- Energy levels: [high energy], [low energy], [enthusiastic], [monotone], [trailing off]
- Pacing: [speaking quickly], [speaking slowly], [measured pace], [rushing]

3. CONVERSATIONAL DYNAMICS (include in brackets)
- [pause - X seconds] for notable pauses
- [long pause] for extended silences
- [interruption] when someone cuts in
- [overlapping speech] when people talk over each other
- [voice rising] or [voice dropping] for pitch changes
- [emphasis on "word"] for stressed words

4. APPROXIMATE TIMESTAMPS
- Include timestamps every 30-60 seconds: [0:00], [0:30], [1:00], etc.

5. COMPLETENESS
- Transcribe EVERYTHING including filler words (um, uh, like, you know)
- Include false starts and self-corrections
- Note any background sounds that affect the conversation

Example format:
[0:00] Speaker A: [confident, warm tone] Hey! So I wanted to talk to you about, um, the project.
[0:05] Speaker B: [enthusiastic] Oh yeah! [speaking quickly] I've been thinking about that actually—
[0:08] Speaker A: [interruption] —sorry, go ahead.
[0:10] Speaker B: [laughs] No, you first.
[pause - 2 seconds]

Provide a complete and detailed transcription.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log("Invalid authentication:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Limit file size to 25MB to prevent abuse
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > MAX_FILE_SIZE) {
      console.log("Rejected oversized file:", audioFile.size);
      return new Response(
        JSON.stringify({ error: "Audio file too large. Maximum size is 25MB." }),
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
                text: TRANSCRIPTION_PROMPT,
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

    // Check for silent/empty audio indicators
    const silentIndicators = [
      "no speech",
      "no audio",
      "silence",
      "no conversation",
      "no dialogue",
      "no sound",
      "empty audio",
      "nothing to transcribe",
      "no discernible",
      "cannot transcribe",
      "unable to transcribe",
    ];
    
    const lowerTranscript = transcript.toLowerCase();
    const isSilent = silentIndicators.some(indicator => lowerTranscript.includes(indicator)) 
      && transcript.length < 200; // Only flag as silent if it's a short response
    
    if (isSilent) {
      return new Response(
        JSON.stringify({ error: "No speech detected in the audio. Please upload a recording with audible conversation." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
