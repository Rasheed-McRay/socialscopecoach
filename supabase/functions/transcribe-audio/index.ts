import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRANSCRIPTION_PROMPT = `You are an expert conversation transcriber. Transcribe this recording with RICH CONTEXTUAL DETAIL.

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

4. VISUAL CONTEXT (for video only - if you can see the speakers)
- Note relevant body language: [leaning in], [nodding], [looking away], [gesturing]
- Note facial expressions: [smiling], [frowning], [confused expression]
- Note engagement: [making eye contact], [distracted], [checking phone]

5. APPROXIMATE TIMESTAMPS
- Include timestamps every 30-60 seconds: [0:00], [0:30], [1:00], etc.

6. COMPLETENESS
- Transcribe EVERYTHING including filler words (um, uh, like, you know)
- Include false starts and self-corrections
- Note any background sounds that affect the conversation

Example format:
[0:00] Speaker A: [confident, warm tone] [leaning in] Hey! So I wanted to talk to you about, um, the project.
[0:05] Speaker B: [enthusiastic] [nodding] Oh yeah! [speaking quickly] I've been thinking about that actually—
[0:08] Speaker A: [interruption] —sorry, go ahead.
[0:10] Speaker B: [laughs] No, you first.
[pause - 2 seconds]

Provide a complete and detailed transcription.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    
    // Check for both audio and video files
    const audioFile = formData.get("audio") as File | null;
    const videoFile = formData.get("video") as File | null;
    const mediaFile = audioFile || videoFile;
    const isVideo = !!videoFile;

    if (!mediaFile) {
      return new Response(
        JSON.stringify({ error: "No audio or video file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received ${isVideo ? 'video' : 'audio'} file:`, mediaFile.name, "size:", mediaFile.size, "type:", mediaFile.type);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Convert media to base64 for the AI model
    const arrayBuffer = await mediaFile.arrayBuffer();
    const base64Media = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Determine the MIME type
    let mimeType = mediaFile.type || (isVideo ? "video/mp4" : "audio/webm");
    if (mimeType === "audio/mp3") mimeType = "audio/mpeg";

    console.log(`Transcribing ${isVideo ? 'video' : 'audio'} with mime type:`, mimeType);

    // Build the content array based on media type
    const contentArray: any[] = [
      {
        type: "text",
        text: TRANSCRIPTION_PROMPT,
      },
    ];

    if (isVideo) {
      // For video, use inline_data format
      contentArray.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Media}`,
        },
      });
    } else {
      // For audio, use input_audio format
      contentArray.push({
        type: "input_audio",
        input_audio: {
          data: base64Media,
          format: mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "wav",
        },
      });
    }

    // Use Gemini for transcription (it handles audio and video natively)
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
            content: contentArray,
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
