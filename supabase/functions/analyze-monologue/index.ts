import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert communication coach specializing in self-expression and personal monologues. Your job is to analyze a person's spoken response to a daily reflection prompt and provide HIGHLY PERSONALIZED feedback.

=== CONTEXT ===
The user is responding to a daily self-reflection prompt. This is a MONOLOGUE - not a conversation. They have 60 seconds to express their thoughts on the prompt.

=== PRE-ANALYSIS STEP ===
Before generating feedback, identify:
1. The STRONGEST moment of self-expression (quote it)
2. The WEAKEST moment or missed opportunity (quote it)
3. What makes THIS response unique to this person

=== SCORING GUIDELINES ===
Provide an overall RATING from 1-100:
- 90-100: Exceptional - articulate, genuine, insightful, well-structured
- 75-89: Strong - clear thoughts with good self-expression
- 60-74: Developing - gets the point across but could be more compelling
- 45-59: Needs work - unclear or unfocused response
- Below 45: Concerning - very difficult to follow or off-topic

=== WHAT TO ANALYZE ===

1. CLARITY OF THOUGHT
- How well-organized was the response?
- Did they have a clear point or perspective?
- Was there logical flow?

2. AUTHENTICITY & DEPTH
- Did they share genuine thoughts or give surface-level answers?
- Was there personal insight or just generic responses?
- Did they reveal something meaningful about themselves?

3. DELIVERY & EXPRESSION
- Confidence in their voice
- Enthusiasm and engagement with the topic
- Pace and timing (too rushed, too slow, just right?)

4. VOCABULARY & ARTICULATION
- Word choice quality
- Filler word usage (um, uh, like, you know)
- Sentence structure variety

=== OUTPUT FORMAT ===
Respond with valid JSON:

{
  "rating": 72,
  "summary": "2-3 sentences summarizing how they responded to the prompt, referencing SPECIFIC things they said",
  "highlights": [
    "Direct quote or specific moment that was strong",
    "Another strong moment with quote"
  ],
  "improvements": [
    "Specific actionable improvement based on what they said",
    "Another specific improvement"
  ],
  "clarityScore": 75,
  "authenticityScore": 68,
  "deliveryScore": 70,
  "vocabularyScore": 72,
  "personalNote": "A genuine, specific compliment about something unique they said or how they said it - reference their actual words",
  "quickTip": "One actionable tip they can apply to tomorrow's response"
}

=== IMPORTANT ===
- This is about SELF-EXPRESSION, not conversation skills
- Focus on how well they articulated their personal perspective
- Be encouraging but honest
- Every piece of feedback must reference something specific from their response
- No generic feedback that could apply to anyone`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, prompt } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_TRANSCRIPT_LENGTH = 50000;
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      console.log("Rejected oversized transcript:", transcript.length);
      return new Response(
        JSON.stringify({ error: "Transcript too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Analyzing monologue for prompt:", prompt);
    console.log("Transcript length:", transcript.length);

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
            content: `The user was asked to respond to this daily prompt:
"${prompt}"

Here is their 60-second spoken response:

---TRANSCRIPT START---
${transcript}
---TRANSCRIPT END---

Analyze their self-expression and provide personalized feedback with a rating.` 
          },
        ],
        temperature: 0.7,
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

    console.log("Monologue analysis completed successfully");

    const analysis = JSON.parse(analysisText);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-monologue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
