import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_TRANSCRIPTION_PROMPT = `You are an expert conversation transcriber. Transcribe this audio recording with RICH CONTEXTUAL DETAIL.

TRANSCRIPTION REQUIREMENTS:

1. EMOTIONAL & TONAL MARKERS (include in brackets)
- Confidence indicators: [speaking confidently], [hesitant], [uncertain], [assertive]
- Emotional states: [laughs], [nervous laughter], [sighs], [excited], [frustrated], [warm tone]
- Energy levels: [high energy], [low energy], [enthusiastic], [monotone], [trailing off]
- Pacing: [speaking quickly], [speaking slowly], [measured pace], [rushing]

2. CONVERSATIONAL DYNAMICS (include in brackets)
- [pause - X seconds] for notable pauses
- [long pause] for extended silences
- [interruption] when someone cuts in
- [overlapping speech] when people talk over each other
- [voice rising] or [voice dropping] for pitch changes
- [emphasis on "word"] for stressed words

3. APPROXIMATE TIMESTAMPS
- Include timestamps every 30-60 seconds: [0:00], [0:30], [1:00], etc.

4. COMPLETENESS
- Transcribe EVERYTHING including filler words (um, uh, like, you know)
- Include false starts and self-corrections
- Note any background sounds that affect the conversation`;

const SPEAKER_ID_WITH_VOICE = `
1. SPEAKER IDENTIFICATION (CRITICAL)
- Reference voice samples of the user have been provided
- CAREFULLY compare each speaker's voice in the conversation against these reference samples
- Label the speaker who matches the reference voice samples as "You:"
- Label other speakers as "Other Person:" (or "Other Person 1:", "Other Person 2:" if multiple)
- Be consistent with speaker labels throughout
- If uncertain about a match, still make your best judgment based on voice characteristics`;

const SPEAKER_ID_WITHOUT_VOICE = `
1. SPEAKER IDENTIFICATION
- Label speakers as "Speaker A:", "Speaker B:", etc.
- Be consistent with speaker labels throughout`;

const EXAMPLE_WITH_VOICE = `
Example format:
[0:00] You: [confident, warm tone] Hey! So I wanted to talk to you about, um, the project.
[0:05] Other Person: [enthusiastic] Oh yeah! [speaking quickly] I've been thinking about that actually—
[0:08] You: [interruption] —sorry, go ahead.
[0:10] Other Person: [laughs] No, you first.
[pause - 2 seconds]

Provide a complete and detailed transcription.`;

const EXAMPLE_WITHOUT_VOICE = `
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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Use anon key client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.log("Invalid authentication:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Server-side tier validation using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("tier, access_level")
      .eq("user_id", user.id)
      .single();

    if (roleError) {
      console.log("Error fetching user role:", roleError.message);
      return new Response(
        JSON.stringify({ error: "Unable to verify subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authorized with tier:", roleData?.tier, "access:", roleData?.access_level);

    // Server-side usage limit validation
    const isPro = roleData?.tier === "premium" || roleData?.tier === "developer";
    const today = new Date().toISOString().split("T")[0];
    
    // Check daily usage
    const { data: dailyUsage } = await supabaseAdmin
      .from("daily_analysis_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();

    const dailyCount = dailyUsage?.analysis_count || 0;

    if (!isPro) {
      // Free users: 1 analysis per day
      if (dailyCount >= 1) {
        console.log("Free user daily limit exceeded:", dailyCount);
        return new Response(
          JSON.stringify({ error: "Daily analysis limit reached. Upgrade to Pro for more analyses." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Pro users: Check monthly usage (30 per billing period) + 1 daily bonus
      const { data: userRoleData } = await supabaseAdmin
        .from("user_roles")
        .select("subscription_started_at")
        .eq("user_id", user.id)
        .single();

      if (userRoleData?.subscription_started_at) {
        const subscriptionStart = new Date(userRoleData.subscription_started_at);
        const now = new Date();
        
        // Calculate current billing period
        let billingStart = new Date(subscriptionStart);
        while (billingStart <= now) {
          const nextMonth = new Date(billingStart);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          if (nextMonth > now) break;
          billingStart = nextMonth;
        }
        const billingStartDate = billingStart.toISOString().split("T")[0];

        const { data: monthlyUsage } = await supabaseAdmin
          .from("monthly_analysis_usage")
          .select("analysis_count")
          .eq("user_id", user.id)
          .eq("billing_period_start", billingStartDate)
          .maybeSingle();

        const monthlyCount = monthlyUsage?.analysis_count || 0;

        // Pro users get 30 monthly + 1 daily bonus
        if (monthlyCount >= 30 && dailyCount >= 1) {
          console.log("Pro user limits exceeded - monthly:", monthlyCount, "daily:", dailyCount);
          return new Response(
            JSON.stringify({ error: "Monthly analysis limit reached. Your quota resets on your next billing cycle." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log("Usage check passed - daily:", dailyCount, "isPro:", isPro);

    // Fetch user's voice samples for speaker identification
    const { data: voiceSamples, error: voiceSamplesError } = await supabaseAdmin
      .from("voice_samples")
      .select("audio_url, sample_number")
      .eq("user_id", user.id)
      .order("sample_number", { ascending: true });

    if (voiceSamplesError) {
      console.log("Error fetching voice samples:", voiceSamplesError.message);
    }

    const hasVoiceSamples = voiceSamples && voiceSamples.length > 0;
    console.log("Voice samples found:", hasVoiceSamples ? voiceSamples.length : 0);

    // Fetch voice sample audio data if available
    const voiceSampleAudioData: Array<{ data: string; format: string }> = [];
    
    if (hasVoiceSamples) {
      for (const sample of voiceSamples) {
        try {
          // Extract file path from signed URL
          const url = new URL(sample.audio_url);
          const pathMatch = url.pathname.match(/voice-samples\/([^?]+)/);
          
          if (pathMatch && pathMatch[1]) {
            const filePath = decodeURIComponent(pathMatch[1]);
            
            // Download the voice sample from storage
            const { data: fileData, error: downloadError } = await supabaseAdmin
              .storage
              .from("voice-samples")
              .download(filePath);
            
            if (downloadError) {
              console.log(`Error downloading voice sample ${sample.sample_number}:`, downloadError.message);
              continue;
            }
            
            // Convert to base64
            const arrayBuffer = await fileData.arrayBuffer();
            const base64Audio = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );
            
            voiceSampleAudioData.push({
              data: base64Audio,
              format: "wav", // webm files, but Gemini handles them
            });
            
            console.log(`Loaded voice sample ${sample.sample_number}, size: ${arrayBuffer.byteLength} bytes`);
          }
        } catch (e) {
          console.error(`Failed to process voice sample ${sample.sample_number}:`, e);
        }
      }
    }

    const hasVoiceData = voiceSampleAudioData.length > 0;
    console.log("Voice sample audio data loaded:", hasVoiceData ? voiceSampleAudioData.length : 0);

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

    // Build the transcription prompt based on voice sample availability
    const speakerIdSection = hasVoiceData ? SPEAKER_ID_WITH_VOICE : SPEAKER_ID_WITHOUT_VOICE;
    const exampleSection = hasVoiceData ? EXAMPLE_WITH_VOICE : EXAMPLE_WITHOUT_VOICE;
    const transcriptionPrompt = `${BASE_TRANSCRIPTION_PROMPT}\n${speakerIdSection}\n${exampleSection}`;

    // Build the message content
    const messageContent: any[] = [];

    // Add voice samples first if available (as reference)
    if (hasVoiceData) {
      messageContent.push({
        type: "text",
        text: `Here are ${voiceSampleAudioData.length} voice reference samples of the user. Use these to identify which speaker in the conversation is the user:`,
      });

      for (let i = 0; i < voiceSampleAudioData.length; i++) {
        messageContent.push({
          type: "input_audio",
          input_audio: {
            data: voiceSampleAudioData[i].data,
            format: voiceSampleAudioData[i].format,
          },
        });
      }

      messageContent.push({
        type: "text",
        text: `\n\nNow transcribe the following conversation recording. Remember to label the speaker matching the reference voice samples as "You:" and others as "Other Person:"\n\n${transcriptionPrompt}`,
      });
    } else {
      messageContent.push({
        type: "text",
        text: transcriptionPrompt,
      });
    }

    // Add the main audio to transcribe
    messageContent.push({
      type: "input_audio",
      input_audio: {
        data: base64Audio,
        format: mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "wav",
      },
    });

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
            content: messageContent,
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

    console.log("Transcription completed, length:", transcript.length, "with voice matching:", hasVoiceData);

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
