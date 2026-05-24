import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false, tier: "basic" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    // Filter for active or trialing subscriptions
    const activeSubscriptions = subscriptions.data.filter(
      (sub: Stripe.Subscription) => sub.status === 'active' || sub.status === 'trialing'
    );

    const hasActiveSub = activeSubscriptions.length > 0;
    let subscriptionEnd = null;
    let isTrialing = false;
    let trialEnd = null;

    if (hasActiveSub) {
      const subscription = activeSubscriptions[0];
      isTrialing = subscription.status === 'trialing';
      
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      if (subscription.current_period_end) {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      // Get subscription start date from Stripe
      const subscriptionStartDate = subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : new Date().toISOString();
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        isTrialing,
        trialEnd,
        startDate: subscriptionStartDate,
        endDate: subscriptionEnd 
      });

      // Update user_subscriptions table to pro
      const { error: updateSubError } = await supabaseClient
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          tier: 'pro',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (updateSubError) {
        logStep("Error updating user_subscriptions", { error: updateSubError.message });
      } else {
        logStep("Updated user_subscriptions to pro");
      }

      // Also update user_roles table tier and subscription_started_at to sync
      const { error: updateRoleError } = await supabaseClient
        .from('user_roles')
        .update({ 
          tier: 'premium',
          access_level: 'standard',
          subscription_started_at: subscriptionStartDate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (updateRoleError) {
        logStep("Error updating user_roles", { error: updateRoleError.message });
      } else {
        logStep("Updated user_roles to premium tier with subscription start date");
      }
    } else {
      logStep("No active subscription found");
      
      // Update user_subscriptions table to basic
      const { error: updateSubError } = await supabaseClient
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          tier: 'basic',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (updateSubError) {
        logStep("Error updating user_subscriptions", { error: updateSubError.message });
      }

      // Also update user_roles table tier to sync (only if not owner/developer)
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('tier, role')
        .eq('user_id', user.id)
        .single();

      // Don't downgrade developers or owners
      if (roleData && roleData.tier !== 'developer' && roleData.role !== 'owner') {
        const { error: updateRoleError } = await supabaseClient
          .from('user_roles')
          .update({ 
            tier: 'free',
            access_level: 'restricted',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (updateRoleError) {
          logStep("Error updating user_roles", { error: updateRoleError.message });
        } else {
          logStep("Updated user_roles to free tier");
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: hasActiveSub ? "pro" : "basic",
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
      trial_end: trialEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Unable to verify subscription. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
