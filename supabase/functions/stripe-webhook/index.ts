// Stripe webhook: downgrades / upgrades users automatically on subscription
// lifecycle events. Deployed with verify_jwt = false (see supabase/config.toml)
// because Stripe calls this endpoint without a Supabase JWT — we verify the
// request via the Stripe-Signature header instead.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

const OWNER_EMAIL = "rmcclaryraynor@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("Missing required secrets");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("Signature verification failed", { msg });
    return new Response(JSON.stringify({ error: `Invalid signature: ${msg}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log("Event received", { type: event.type, id: event.id });

  async function resolveUserIdFromCustomer(customerId: string): Promise<{ userId: string | null; email: string | null }> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return { userId: null, email: null };
      const email = (customer as Stripe.Customer).email ?? null;
      if (!email) return { userId: null, email: null };
      const { data } = await supabase.auth.admin.listUsers();
      const match = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      return { userId: match?.id ?? null, email };
    } catch (e) {
      log("Failed to resolve user from customer", { customerId, error: String(e) });
      return { userId: null, email: null };
    }
  }

  async function setTierFromSubscription(userId: string, email: string | null, sub: Stripe.Subscription) {
    const isOwnerEmail = email?.toLowerCase() === OWNER_EMAIL;
    const isActive = sub.status === "active" || sub.status === "trialing";

    if (isActive) {
      await supabase.from("user_subscriptions").upsert(
        { user_id: userId, tier: "pro", updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      await supabase
        .from("user_roles")
        .update({
          tier: "premium",
          access_level: "standard",
          subscription_started_at: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      log("Upgraded user to pro/premium", { userId });
      return;
    }

    // Inactive / canceled / unpaid / past_due — downgrade unless owner/developer
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("tier, role")
      .eq("user_id", userId)
      .single();

    if (isOwnerEmail || roleData?.role === "owner" || roleData?.tier === "developer") {
      log("Skipping downgrade for owner/developer", { userId });
      return;
    }

    await supabase.from("user_subscriptions").upsert(
      { user_id: userId, tier: "basic", updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    await supabase
      .from("user_roles")
      .update({
        tier: "free",
        access_level: "restricted",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    log("Downgraded user to free", { userId, status: sub.status });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        let subscription: Stripe.Subscription | null = null;
        let customerId: string | null = null;

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          customerId = (session.customer as string) ?? null;
          if (session.subscription) {
            subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          }
        } else {
          subscription = event.data.object as Stripe.Subscription;
          customerId = subscription.customer as string;
        }

        if (!customerId) {
          log("No customer on event", { type: event.type });
          break;
        }

        const { userId, email } = await resolveUserIdFromCustomer(customerId);
        if (!userId) {
          log("Could not resolve user for customer", { customerId });
          break;
        }

        if (subscription) {
          await setTierFromSubscription(userId, email, subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (!customerId) break;
        const { userId, email } = await resolveUserIdFromCustomer(customerId);
        if (!userId) break;
        // Force a re-sync from Stripe's source of truth
        const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
        if (subs.data[0]) await setTierFromSubscription(userId, email, subs.data[0]);
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("Handler error", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
