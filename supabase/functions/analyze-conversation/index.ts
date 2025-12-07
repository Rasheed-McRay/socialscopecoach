import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert social skills analyst and communication coach. Analyze the provided conversation transcript with extreme detail.

Your analysis must cover:

1. VOCAL TONE & DELIVERY
- Confidence level (Low/Moderate/High/Very High)
- Nervousness indicators (Low/Moderate/High)
- Enthusiasm/excitement level
- Warmth vs coldness
- Assertiveness vs passiveness
- Vocal archetype (e.g., "The Engaged Storyteller", "The Commanding Leader", "The Nurturing Listener", "The Analytical Thinker")

2. TECHNICAL CONVERSATION SKILLS
- Quality of questions asked
- Ratio of talking vs listening (estimate percentage)
- Empathy signals detected
- Interrupting frequency
- How often they "added value" to the conversation
- Clarity of explanations
- Social calibration (energy matching with conversation partner)

3. EMOTIONAL & SUBTEXT CUES
- Overall emotional state during conversation
- Confidence fluctuations (when did they seem more/less confident)
- Energy and rapport changes throughout

4. SCORING (0-100)
- Social Skills Score based on: communication clarity, social awareness, tonality consistency, engagement quality, rapport building
- Confidence Score based on: vocal presence, assertiveness, self-assurance indicators

5. OUTPUT REQUIREMENTS
You must respond with a valid JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the conversation",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4"],
  "standoutMoments": ["moment 1 with timestamp/context if available", "moment 2", "moment 3"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "personalCompliment": "A genuine, specific compliment about their communication style to create positive feedback",
  "socialScore": 75,
  "confidenceScore": 70,
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "vocalTone": {
    "confidence": "Level description",
    "nervousness": "Level description",
    "enthusiasm": "Level description",
    "warmth": "Level description",
    "assertiveness": "Level description",
    "archetype": "The [Archetype Name]"
  },
  "technicalSkills": {
    "questionQuality": "Assessment with brief explanation",
    "talkingRatio": "XX/XX - brief description",
    "empathySignals": "Assessment",
    "interruptingFrequency": "Assessment",
    "valueAdded": "Assessment",
    "clarity": "Assessment",
    "socialCalibration": "Assessment"
  },
  "emotionalCues": {
    "emotionalState": "Description",
    "confidenceFluctuations": "Description",
    "energyChanges": "Description"
  }
}

Be insightful, specific, and constructive. Focus on actionable feedback that helps the person improve their social and communication skills.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Analyzing transcript of length:", transcript.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Analyze this conversation transcript and provide detailed social skills feedback:\n\n${transcript}` 
          },
        ],
        response_format: { type: "json_object" },
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
      
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error("No analysis generated");
    }

    console.log("Analysis completed successfully");

    // Parse the JSON response
    const analysis = JSON.parse(analysisText);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-conversation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
