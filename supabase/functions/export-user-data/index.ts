import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const tables = [
      "profiles",
      "user_roles",
      "user_subscriptions",
      "daily_analysis_usage",
      "monthly_analysis_usage",
      "daily_scope_completions",
      "saved_reports",
      "user_activity",
      "voice_samples",
    ] as const;

    const results: Record<string, unknown> = {};
    for (const t of tables) {
      const { data, error } = await admin.from(t).select("*").eq("user_id", user.id);
      if (error) {
        console.error(`export ${t} failed`, error);
        results[t] = { error: error.message };
      } else {
        results[t] = data;
      }
    }

    const payload = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      note: "voice_samples.audio_url points to a private storage bucket and may not be publicly accessible.",
      ...results,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("export-user-data error", err);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
