import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Parse request body for trial option
    let withTrial = false;
    try {
      const body = await req.json();
      withTrial = body?.withTrial === true;
    } catch {
      // No body or invalid JSON, default to no trial
    }
    logStep("Trial option", { withTrial });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
      
      // Check if customer has had a trial before
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });
      
      const hasHadTrial = subscriptions.data.some((sub: Stripe.Subscription) => sub.trial_start !== null);
      if (hasHadTrial && withTrial) {
        logStep("Customer already had a trial, disabling trial");
        withTrial = false;
      }
    }

    // Validate origin against an allowlist to prevent open-redirect abuse
    const ALLOWED_ORIGINS = [
      "https://socialscopecoach.app",
      "https://socialscopecoach.lovable.app",
      "https://id-preview--29c42402-6efd-4d75-bd72-b8324e49a11b.lovable.app",
    ];
    const requestOrigin = req.headers.get("origin") ?? "";
    const siteUrl = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : (Deno.env.get("SITE_URL") ?? ALLOWED_ORIGINS[0]);

    // Create checkout session for Pro subscription
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1Sct3aAsCGvzAaX4KAriUhUU",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${siteUrl}/checkout-success`,
      cancel_url: `${siteUrl}/paywall`,
    };

    // Add trial period if requested
    if (withTrial) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
      logStep("Adding 7-day trial to subscription");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url, withTrial });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
