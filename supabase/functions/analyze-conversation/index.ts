import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert social skills analyst and communication coach. Your job is to provide HIGHLY PERSONALIZED, SPECIFIC feedback based on the EXACT content of each conversation.

CRITICAL INSTRUCTIONS FOR PERSONALIZATION:
- Quote specific phrases or sentences from the transcript to support your analysis
- Reference specific moments, topics discussed, or exchanges that occurred
- Tailor your archetype selection based on the actual speaking patterns observed
- Vary your scores meaningfully - avoid defaulting to 70-75 range unless truly warranted
- Each analysis should feel unique to THIS specific conversation

Your analysis must cover:

1. VOCAL TONE & DELIVERY (base on actual transcript evidence)
- Confidence level with specific examples from the text
- Nervousness indicators - cite specific phrases that show this
- Enthusiasm/excitement level - reference actual excited moments
- Warmth vs coldness - quote warm/cold exchanges
- Assertiveness vs passiveness - provide transcript evidence
- Vocal archetype (choose from: "The Engaged Storyteller", "The Commanding Leader", "The Nurturing Listener", "The Analytical Thinker", "The Enthusiastic Collaborator", "The Diplomatic Mediator", "The Direct Communicator", "The Curious Explorer")

2. TECHNICAL CONVERSATION SKILLS
- Quality of questions asked - quote the actual questions
- Ratio of talking vs listening (estimate percentage based on word count)
- Empathy signals detected - cite specific empathetic phrases
- Interrupting patterns - note if present
- Value-added moments - quote where they contributed meaningfully
- Clarity of explanations - reference specific explanations given
- Social calibration - how well did they match the conversation energy?

3. EMOTIONAL & SUBTEXT CUES
- Overall emotional state with evidence from word choice
- Confidence fluctuations - when did confidence peak/dip?
- Energy and rapport changes - trace the conversation arc

4. SCORING (0-100) - BE DISCRIMINATING
- Scores should genuinely reflect the conversation quality
- A score of 90+ means exceptional communication
- A score of 50-70 means average with clear room for improvement
- A score below 50 indicates significant issues
- Provide brief justification for each score

5. OUTPUT REQUIREMENTS
Respond with a valid JSON object. ALL text fields must reference specific moments, quotes, or patterns from the transcript:
{
  "summary": "2-3 sentence overview mentioning specific topics discussed and overall dynamic",
  "strengths": ["strength 1 with quote/example", "strength 2 with quote/example", "strength 3 with quote/example", "strength 4 with quote/example", "strength 5 with quote/example"],
  "weaknesses": ["weakness 1 with specific moment", "weakness 2 with specific moment", "weakness 3 with specific moment", "weakness 4 with specific moment"],
  "standoutMoments": ["Quote or describe specific moment 1", "Quote or describe specific moment 2", "Quote or describe specific moment 3"],
  "improvements": ["specific actionable improvement based on observed pattern 1", "improvement 2", "improvement 3"],
  "personalCompliment": "A genuine, specific compliment referencing something unique they said or did",
  "socialScore": 72,
  "confidenceScore": 68,
  "nextSteps": ["actionable step based on specific weakness observed", "step 2", "step 3"],
  "vocalTone": {
    "confidence": "Level with specific evidence from transcript",
    "nervousness": "Level with specific evidence",
    "enthusiasm": "Level with specific evidence",
    "warmth": "Level with specific evidence",
    "assertiveness": "Level with specific evidence",
    "archetype": "The [Archetype Name] - because [specific reason from transcript]"
  },
  "technicalSkills": {
    "questionQuality": "Assessment citing actual questions asked",
    "talkingRatio": "XX/XX based on observed balance",
    "empathySignals": "Assessment with quoted examples",
    "interruptingFrequency": "Assessment based on transcript flow",
    "valueAdded": "Assessment with specific examples",
    "clarity": "Assessment with specific examples",
    "socialCalibration": "Assessment of energy matching"
  },
  "emotionalCues": {
    "emotionalState": "Description with word choice evidence",
    "confidenceFluctuations": "Description of high/low points",
    "energyChanges": "Description of conversation arc"
  }
}

Remember: Generic feedback is useless. Every piece of feedback should be traceable to something specific in THIS conversation.`;

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
            content: `Analyze this conversation transcript and provide detailed, PERSONALIZED social skills feedback. Reference specific quotes and moments from the transcript in your analysis:\n\n---TRANSCRIPT START---\n${transcript}\n---TRANSCRIPT END---` 
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
