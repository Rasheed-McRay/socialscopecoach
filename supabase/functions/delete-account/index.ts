// Permanently deletes the authenticated user's account: cascades through
// app tables, removes voice samples from storage, then deletes the auth user.
// Called from the Settings page "Delete account" action.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-ACCOUNT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    log("Deleting account", { userId });

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
    // Cancel any active Stripe subscriptions for this user so they stop being charged.
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      const email = userData.user.email;
      if (stripeKey && email) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email, limit: 10 });
        for (const customer of customers.data) {
          const subs = await stripe.subscriptions.list({
            customer: customer.id,
            status: "all",
            limit: 100,
          });
          for (const sub of subs.data) {
            if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due" || sub.status === "unpaid") {
              try {
                await stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
                log("Cancelled Stripe subscription", { subscriptionId: sub.id, customerId: customer.id });
              } catch (e) {
                log("Failed to cancel subscription (non-fatal)", { subscriptionId: sub.id, error: String(e) });
              }
            }
          }
        }
      } else if (!stripeKey) {
        log("STRIPE_SECRET_KEY not set, skipping subscription cancellation");
      }
    } catch (e) {
      log("Stripe cancellation step failed (non-fatal)", { error: String(e) });
    }


    // Remove voice samples from storage (best-effort)
    try {
      const { data: files } = await admin.storage.from("voice-samples").list(userId, { limit: 100 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await admin.storage.from("voice-samples").remove(paths);
      }
    } catch (e) {
      log("Voice sample cleanup failed (non-fatal)", { error: String(e) });
    }

    // Cascade-delete from app tables. Run sequentially so any single failure
    // is captured but we still continue toward auth user deletion.
    const tables = [
      "daily_analysis_usage",
      "monthly_analysis_usage",
      "daily_scope_completions",
      "saved_reports",
      "user_activity",
      "voice_samples",
      "user_subscriptions",
      "user_roles",
      "profiles",
    ];
    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) log(`Cleanup failed for ${table}`, { error: error.message });
    }

    // Finally, delete the auth user.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      log("Failed to delete auth user", { error: deleteError.message });
      return new Response(JSON.stringify({ error: "Failed to delete account. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Account deleted successfully", { userId });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("Unhandled error", { msg });
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
