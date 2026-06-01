import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert social skills analyst and communication coach. Your job is to provide HIGHLY PERSONALIZED, SPECIFIC feedback based on the EXACT content of each conversation.

=== CRITICAL: IDENTIFY THE USER ===
The transcript may contain speaker labels:
- If you see "You:" - this is the USER you are coaching. ALL feedback, scores, strengths, and weaknesses must be about THIS speaker only.
- If you see "Other Person:" or "Speaker A/B/C:" - these are NOT the user. Treat them as CONTEXT ONLY.
- If no clear "You:" label exists, analyze the conversation holistically but note this limitation.

Your ENTIRE analysis must focus on the person labeled "You:" - their performance, their words, their tone, their skills.
Other speakers are only relevant insofar as they provide context for how "You:" responded or interacted.

=== PRE-ANALYSIS STEP (DO THIS FIRST) ===
Before generating any feedback, identify and mentally note:
1. The SINGLE BEST moment from the "You:" speaker (quote it)
2. The SINGLE WEAKEST moment from the "You:" speaker (quote it)  
3. The MOST UNIQUE thing about how "You:" communicated in this specific conversation

Use these three anchors to inform ALL your scoring and feedback.

=== CRITICAL ANTI-REPETITION RULES ===
NEVER use these generic phrases:
- "good communication skills"
- "could improve confidence"
- "shows promise"
- "room for improvement"
- "demonstrates understanding"
- "effective listener"
- "articulate speaker"

Instead, ALWAYS reference specific quotes, moments, or patterns from what "You:" said.

=== PERSONALIZATION REQUIREMENTS ===
- Quote EXACT phrases from "You:" only (minimum 3 direct quotes per analysis)
- Reference specific topics "You:" discussed by name
- Note specific moments where "You:" had tone/energy shifts
- Tailor archetype selection to OBSERVED patterns from "You:", not assumptions
- Each score must have a specific justification tied to something "You:" said or did

=== SCORING GUIDELINES (BE DISCRIMINATING) ===
Score ONLY the "You:" speaker. Anchor your scores to their best/weakest moments:
- 90-100: Exceptional - rare, requires multiple standout moments from "You:"
- 75-89: Strong - clear strengths with minor areas to develop
- 60-74: Developing - solid foundation with clear improvement areas
- 45-59: Needs work - several significant issues observed in "You:"'s communication
- Below 45: Concerning - fundamental issues that need addressing

DO NOT default to 70-75. Use the full range based on actual evidence from "You:".

=== ANALYSIS AREAS (ANALYZE "You:" SPEAKER ONLY) ===

1. VOCAL TONE & DELIVERY (of "You:" only)
- Quote specific phrases from "You:" showing confidence/nervousness
- Note exact moments where "You:" showed enthusiasm or warmth
- Identify specific assertive vs passive statements from "You:"
- Choose archetype based on 3+ specific examples from "You:"

Archetypes (choose ONE based on "You:"'s communication style):
- "The Engaged Storyteller" - uses vivid details, draws people in
- "The Commanding Leader" - direct, decisive statements
- "The Nurturing Listener" - empathetic responses, validation
- "The Analytical Thinker" - logical progression, measured responses
- "The Enthusiastic Collaborator" - builds on others' ideas, energetic
- "The Diplomatic Mediator" - balances perspectives, tactful
- "The Direct Communicator" - straightforward, efficient
- "The Curious Explorer" - asks questions, shows genuine interest

2. TECHNICAL CONVERSATION SKILLS (of "You:" only)
- List the ACTUAL questions "You:" asked (quote them)
- Calculate talking ratio based on "You:" vs others
- Quote specific empathetic phrases "You:" used
- Note any times "You:" interrupted (with context)
- Identify specific value "You:" added to the conversation

3. EMOTIONAL & SUBTEXT CUES (of "You:" only)
- Track "You:"'s emotional arc through the conversation
- Note specific words from "You:" that indicate emotional state
- Identify "You:"'s confidence peaks and dips with quotes

=== OUTPUT FORMAT ===
Respond with valid JSON. EVERY text field must reference things "You:" said or did:

{
  "summary": "2-3 sentences about how 'You:' performed in this conversation, mentioning specific topics they discussed",
  "strengths": [
    "Quote or specific example of strength from 'You:' 1",
    "Quote or specific example of strength from 'You:' 2",
    "Quote or specific example of strength from 'You:' 3",
    "Quote or specific example of strength from 'You:' 4",
    "Quote or specific example of strength from 'You:' 5"
  ],
  "weaknesses": [
    "Specific moment or pattern from 'You:' for weakness 1",
    "Specific moment or pattern from 'You:' for weakness 2",
    "Specific moment or pattern from 'You:' for weakness 3",
    "Specific moment or pattern from 'You:' for weakness 4"
  ],
  "standoutMoments": [
    "Direct quote or detailed description of great moment from 'You:' 1",
    "Direct quote or detailed description of great moment from 'You:' 2",
    "Direct quote or detailed description of great moment from 'You:' 3"
  ],
  "improvements": [
    "Specific actionable step for 'You:' based on observed weakness 1",
    "Specific actionable step for 'You:' based on observed weakness 2",
    "Specific actionable step for 'You:' based on observed weakness 3"
  ],
  "personalCompliment": "A genuine compliment about 'You:' referencing a SPECIFIC quote or action they made",
  "socialScore": 72,
  "confidenceScore": 68,
  "nextSteps": [
    "Actionable next step that specifically improves 'You:'s communication, charisma, or social skills — tied to a specific observation from this transcript (e.g. phrasing, tone, question-asking, active listening, storytelling, vocal delivery, body of conversation flow). MUST NOT be generic life/productivity advice or topic-specific knowledge — only social/communication skill-building.",
    "Second social-skills-focused actionable step for 'You:' (charisma, rapport, presence, conversational dynamics, etc.) tied to a specific moment",
    "Third social-skills-focused actionable step for 'You:' (e.g. a concrete phrase to try, a listening technique, a way to handle a recurring pattern) tied to a specific moment"
  ],
  "vocalTone": {
    "confidence": "Level with QUOTED evidence from 'You:'",
    "nervousness": "Level with QUOTED evidence from 'You:'",
    "enthusiasm": "Level with QUOTED evidence from 'You:'",
    "warmth": "Level with QUOTED evidence from 'You:'",
    "assertiveness": "Level with QUOTED evidence from 'You:'",
    "archetype": "The [Name] - because [3 specific examples from 'You:']"
  },
  "technicalSkills": {
    "questionQuality": "Assessment with QUOTED questions 'You:' asked",
    "talkingRatio": "XX/XX showing 'You:' vs others with brief justification",
    "empathySignals": "Assessment with QUOTED empathetic phrases from 'You:'",
    "interruptingFrequency": "Assessment of 'You:''s interruptions with specific moments",
    "valueAdded": "Assessment with QUOTED valuable contributions from 'You:'",
    "clarity": "Assessment with QUOTED clear/unclear explanations from 'You:'",
    "socialCalibration": "How well 'You:' matched the energy - with examples"
  },
  "emotionalCues": {
    "emotionalState": "Description of 'You:''s state with word choice evidence",
    "confidenceFluctuations": "When 'You:''s confidence peaked/dipped with quotes",
    "energyChanges": "How 'You:''s energy evolved through the conversation"
  }
}

=== VARIETY INSTRUCTIONS ===
- Use different vocabulary for similar concepts across analyses
- Vary your sentence structure
- Make each compliment unique to what THIS person specifically did
- Recommendations should be tailored to THIS person's specific patterns

Remember: If your feedback could apply to any conversation, it's too generic. Every piece of feedback must be traceable to something specific in THIS transcript.`;

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

    // Access control
    const allowedTiers = ["free", "premium", "developer"];
    const allowedAccessLevels = ["restricted", "standard", "unlimited"];
    const hasAccess =
      allowedTiers.includes(roleData?.tier) &&
      allowedAccessLevels.includes(roleData?.access_level);

    if (!hasAccess) {
      console.log(
        "User not authorized:",
        roleData?.tier,
        "access:",
        roleData?.access_level,
      );
      return new Response(
        JSON.stringify({ error: "Not authorized to use analysis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    const { transcript } = await req.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Limit transcript length to prevent abuse (100,000 characters ≈ ~25,000 words)
    const MAX_TRANSCRIPT_LENGTH = 100000;
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      console.log("Rejected oversized transcript:", transcript.length);
      return new Response(
        JSON.stringify({ error: "Transcript too long. Maximum length is 100,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Analyzing transcript of length:", transcript.length);

    // Use gemini-2.5-pro for better nuanced analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Analyze this conversation transcript. FIRST identify the single best moment, single weakest moment, and most unique aspect. Then provide detailed, PERSONALIZED feedback with specific quotes and references.

---TRANSCRIPT START---
${transcript}
---TRANSCRIPT END---

Remember: Every piece of feedback must reference specific moments, quotes, or patterns from this exact conversation. No generic feedback allowed.` 
          },
        ],
        temperature: 0.8,
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

    // Increment usage counters (tamper-proof via service role)
    try {
      await supabaseAdmin
        .from("daily_analysis_usage")
        .upsert(
          { user_id: user.id, usage_date: today, analysis_count: dailyCount + 1 },
          { onConflict: "user_id,usage_date" },
        );

      if (isPro) {
        const { data: userRoleData } = await supabaseAdmin
          .from("user_roles")
          .select("subscription_started_at")
          .eq("user_id", user.id)
          .single();
        if (userRoleData?.subscription_started_at) {
          const subscriptionStart = new Date(userRoleData.subscription_started_at);
          const now = new Date();
          let billingStart = new Date(subscriptionStart);
          while (billingStart <= now) {
            const nextMonth = new Date(billingStart);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            if (nextMonth > now) break;
            billingStart = nextMonth;
          }
          const billingEnd = new Date(billingStart);
          billingEnd.setMonth(billingEnd.getMonth() + 1);
          const billingStartDate = billingStart.toISOString().split("T")[0];
          const billingEndDate = billingEnd.toISOString().split("T")[0];

          const { data: monthlyUsage } = await supabaseAdmin
            .from("monthly_analysis_usage")
            .select("analysis_count")
            .eq("user_id", user.id)
            .eq("billing_period_start", billingStartDate)
            .maybeSingle();

          await supabaseAdmin
            .from("monthly_analysis_usage")
            .upsert(
              {
                user_id: user.id,
                billing_period_start: billingStartDate,
                billing_period_end: billingEndDate,
                analysis_count: (monthlyUsage?.analysis_count || 0) + 1,
              },
              { onConflict: "user_id,billing_period_start" },
            );
        }
      }
    } catch (incErr) {
      console.error("Failed to increment usage counter:", incErr);
    }

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
