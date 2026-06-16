## Goal

For the Android build only, move Stripe checkout and customer-portal flows out of the WebView and into the Capacitor in-app browser, then deep-link back into the app and re-verify subscription status via the existing `check-subscription` edge function. The web build keeps the current behavior.

This is the pattern Google currently tolerates for external payment for digital goods: the purchase UI is not rendered inside the app, it happens on the website in a system-style browser.

## Scope

- Android (Capacitor) only. Detected via `Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'`.
- Web build: no change — `window.location.href = data.url` continues.
- Existing `create-checkout` and `customer-portal` edge functions are reused; only `success_url` / `cancel_url` / `return_url` change when the request comes from the Android app.
- Verification reuses `check-subscription` (already in place and already invoked on app resume).

## User flow (Android)

1. User taps Upgrade on `/paywall` or Settings.
2. App calls `create-checkout` with a header indicating it's the Android client.
3. App opens the returned Stripe URL via `@capacitor/browser` (`presentationStyle: 'popover'`).
4. Stripe completes the payment and redirects to `https://socialscopecoach.app/checkout-return?session_id=...` (a thin web page we control).
5. That page immediately redirects to `socialscopecoach://purchase-success?session_id=...`.
6. The Android app's `App.addListener('appUrlOpen', ...)` closes the in-app browser, navigates to `/checkout-success`, and calls `refreshSubscription()` (which invokes `check-subscription`) to verify with Stripe before unlocking Pro.
7. Cancel deep link: `socialscopecoach://purchase-cancel` → close browser, stay on `/paywall`.

Same pattern for `customer-portal` with `return_url` pointing at the same `checkout-return` bridge → `socialscopecoach://portal-return`.

## Why a web bridge page instead of setting `success_url` directly to the custom scheme

Stripe-hosted Checkout requires `success_url` / `cancel_url` to be `http(s)`. We can't put `socialscopecoach://` there. A 2-line static page on our domain that does `window.location.replace('socialscopecoach://purchase-success?...' + location.search)` is the standard workaround.

## Changes

### 1. Dependencies
- Add `@capacitor/browser` (also ensure `@capacitor/app` is present — it already is, per the resume-check work).
- After install, user runs `npx cap sync android` locally.

### 2. `capacitor.config.ts`
- Add `plugins.App.urlScheme: 'socialscopecoach'`.
- Leave AndroidManifest intact — Capacitor's App plugin handles the intent filter via the scheme.

### 3. New helper: `src/lib/checkoutFlow.ts`
- `isAndroidNative()` guard.
- `openCheckout(url)`: on Android → `Browser.open({ url, presentationStyle: 'popover' })`; on web → `window.location.href = url`.
- `openPortal(url)`: same.
- Owns the `App.addListener('appUrlOpen', ...)` registration (registered once at app boot from `AppShell`). On `socialscopecoach://purchase-success`: close browser, navigate to `/checkout-success` with the session_id, call `refreshSubscription()`. On `socialscopecoach://purchase-cancel` or `portal-return`: close browser and refresh subscription silently.

### 4. Edge functions
- `create-checkout`: when request header `x-client-platform: android` is present, override `success_url` to `https://socialscopecoach.app/checkout-return?status=success&session_id={CHECKOUT_SESSION_ID}` and `cancel_url` to `https://socialscopecoach.app/checkout-return?status=cancel`. Keep existing allowlist for web.
- `customer-portal`: same idea — `return_url` becomes `https://socialscopecoach.app/checkout-return?status=portal` when the header is present.

### 5. New public route: `/checkout-return`
- Tiny React page (no auth, no chrome). On mount, reads `status` and `session_id` from the query string and `window.location.replace('socialscopecoach://' + target + '?session_id=...')`. Shows "Returning to app…" fallback text in case the scheme doesn't fire (web users who somehow land here get a link back to `/`).
- Mapped in `App.tsx` and added to `ProtectedRoute`'s public path list.

### 6. Wire the new flow into existing call sites
- `src/pages/Paywall.tsx` `handleCheckout` and `src/pages/Settings.tsx` `handleUpgradeToPro` / `handleManageSubscription`: invoke the edge function with `headers: { 'x-client-platform': isAndroidNative() ? 'android' : 'web' }`, then call `openCheckout(data.url)` / `openPortal(data.url)` instead of setting `window.location.href` directly.

### 7. Server-side verification
- The existing `check-subscription` already hits Stripe by the user's email and returns the authoritative subscribed state. We treat the deep link only as a trigger; nothing about the deep link itself grants Pro. `SubscriptionContext.refreshSubscription()` is what flips the user to Pro in UI.

## Out of scope (call out, do not implement)

- iOS — not part of this change. The scheme will still work if iOS is added later, but App Store rules are stricter and would need a separate review pass.
- Rewriting any Stripe pricing, product ids, or webhook logic.
- Server-side session lookup by `session_id` — not needed because `check-subscription` already verifies against Stripe by customer email.
- Removing the web `window.location.href` fallback.

## Manual steps the user must do after merge

1. `git pull` and `npm install`.
2. `npx cap sync android`.
3. Rebuild the Android app (`npx cap run android` or release build).
4. No Stripe dashboard changes required (success URLs are set per-session by the edge function).
