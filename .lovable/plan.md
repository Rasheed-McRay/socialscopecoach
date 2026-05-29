# Remove the free trial

You currently offer a "Start 7-Day Free Trial" button on the Paywall alongside "Subscribe Now". This plan removes the trial entirely so every new user goes straight to a paid subscription.

Note: the existing trial is 7 days, not 2 weeks. I'll remove it completely — let me know if you actually meant to shorten it instead.

## Changes

1. **`src/pages/Paywall.tsx`**
   - Remove the "Start 7-Day Free Trial" button and its loading state.
   - Keep only the "Subscribe Now" CTA as the primary button (restyled with the gold gradient so it stays prominent).
   - Simplify `handleCheckout` to no longer take a `withTrial` argument.

2. **`supabase/functions/create-checkout/index.ts`**
   - Stop reading `withTrial` from the request body.
   - Remove the `subscription_data.trial_period_days` block and the "has had trial" lookup that disables repeat trials.
   - Redeploy the function.

3. **`src/pages/CheckoutSuccess.tsx`** (only if it mentions the trial in copy) — update wording to remove trial references.

4. **`src/contexts/SubscriptionContext.tsx`** — leave `isTrialing` / `trialEnd` logic in place. It only activates if Stripe reports a trial, so existing trialing users aren't cut off mid-trial. New checkouts simply won't create trials anymore.

## Out of scope

- Existing customers currently in a Stripe trial keep their trial until it ends naturally. If you want to cancel those mid-trial too, say so and I'll add that.
- The promo/streak-based 7-day Pro trial system (separate from the Stripe checkout trial) is untouched. Tell me if that should also go.
