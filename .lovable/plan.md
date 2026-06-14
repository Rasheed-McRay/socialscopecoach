# MVP Launch Readiness Plan — SocialScopeCoach

Target: **public web launch (socialscopecoach.com) + Google Play Android**, free + paid tiers.

The audit found the core loop (Record → Analyze → Progress → Daily Scope → Paywall) is solid. The gaps are around **billing integrity, legal/compliance, error resilience, social/SEO polish, and Android packaging**. Below is what I recommend cutting, fixing, and adding — grouped so you can approve or veto per item.

---

## 1. Cut (safe to remove, shrinks bundle and surface area)

**Dead code / unused features**
- Delete edge function `supabase/functions/generate-focus-examples/` — never invoked from the client. (Removes the security finding we just fixed too.)
- Delete `src/components/NavLink.tsx` — unused wrapper.

**Unused shadcn UI primitives + their npm deps** (none referenced by app pages):
- Files: `calendar`, `carousel`, `command`, `context-menu`, `drawer`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `resizable`, `accordion`, `aspect-ratio`, `collapsible`.
- Packages: `react-day-picker`, `embla-carousel-react`, `cmdk`, `vaul`, `input-otp`, `react-resizable-panels`, `@radix-ui/react-{accordion,aspect-ratio,collapsible,context-menu,hover-card,menubar,navigation-menu}`, plus `tar`.

**Keep (don't cut)**: every page route, every other component, all other edge functions, Stripe flow, onboarding, voice setup, admin panel (already owner-gated).

---

## 2. Launch Blockers (must fix before going public)

### Billing integrity
- **Add a Stripe webhook edge function** (`stripe-webhook`) listening to `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Without it, cancellations and failed renewals never downgrade users — they keep Pro forever. `check-subscription` stays as the on-demand fallback.
- **Protect `/checkout-success`**: require a Stripe `session_id` query param and verify it server-side before showing the success UI. Today a user can bookmark the URL and see "Pro Member" confetti.

### Legal / compliance (required for Play Store + GDPR)
- **Add a "Delete account" action in Settings** (calls a `delete-account` edge function that wipes user_roles, profiles, subscriptions, activity, recordings, then `auth.admin.deleteUser`). Both legal pages already promise this.
- **Add a "Download my data" export** (or remove the promise from Privacy Policy). Simple JSON download of the user's own rows is enough.
- **Fill in jurisdiction + legal contact email** in `PrivacyPolicy.tsx` and `TermsOfService.tsx`.

### Social/SEO basics
- Replace the Lovable `og:image` and `twitter:image` in `index.html` with a project-hosted 1200×630 image in `/public/`.
- Add `og:url` (currently missing) and `<link rel="canonical">`.
- Move the favicon off the external `storage.googleapis.com` URL into `/public/`, and add a real `apple-touch-icon.png` (the tag currently 404s).

### Resilience
- Add a top-level **`<ErrorBoundary>`** in `App.tsx` so a thrown error in any page shows a recovery screen instead of a white page.

### Android packaging
- Initialize the native project (`npx cap add android`) and commit `android/`.
- Change `capacitor.config.ts` `appId` from the Lovable dev ID to a real reverse-domain ID, e.g. `com.socialscopecoach.app`.
- Add a 1024×1024 app icon and splash, generate Android resources.
- Verify `RECORD_AUDIO`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`, `WAKE_LOCK` are in `AndroidManifest.xml` per `ANDROID.md`.
- **Resume-from-browser sync**: after Stripe checkout opens in the system browser, call `check-subscription` on `App.addListener('appStateChange')` so the user's Pro status appears as soon as they return.

---

## 3. High-Value Polish (strongly recommended, not strictly blocking)

- **Wrap all `console.log/error` in `import.meta.env.DEV`** (or a tiny `logger` util). ~40 calls leak to production today.
- **Per-page `<title>` and meta description** via a `usePageMeta` hook — improves browser tabs, history, and search snippets.
- **Paywall skip path**: confirm free users can dismiss `/paywall` to use the free tier. If "free" is a real tier, surface it on the paywall instead of only the $9.99 plan.
- **Empty / loading / error states** for `DailyScopeAnalysis` and other cards that currently render nothing when data is null.
- **Network-offline banner** (simple `navigator.onLine` listener) so a dropped connection during recording shows a clear message instead of a silent failure.
- **Persist impersonation** in sessionStorage so an owner refreshing during QA doesn't pop back to owner mode unexpectedly.

---

## 4. Deferred (post-launch, document but don't build now)

- Google OAuth sign-in.
- Push notifications (`@capacitor/push-notifications`) — only if you commit to actually sending them; otherwise remove the promise from Privacy Policy.
- Offline mode / service-worker caching (manifest-only PWA is fine for v1).
- iOS build.

---

## 5. Pre-Publish Checklist (run in order, after the above)

1. `bun remove` the unused deps; run a build and confirm bundle shrinks and nothing breaks.
2. Re-run the security scan; confirm zero criticals.
3. Manual smoke test: signup → onboarding → voice setup → record → analyze → daily scope → upgrade → cancel from Stripe portal → confirm webhook downgrades within seconds.
4. Test "Delete account" end-to-end.
5. Verify socialscopecoach.com and socialscopecoach.app share preview shows the new OG image (use opengraph.xyz).
6. Build Android release, install on a physical device, run a full 10-minute recording in the background to confirm the foreground service holds.
7. Publish web; submit Android to Play Console internal testing track first.

---

## Technical Notes

- Stripe webhook secret must be added via the secrets tool (`STRIPE_WEBHOOK_SECRET`); the function must be deployed with `verify_jwt = false` in `supabase/config.toml` since Stripe calls it unauthenticated, and must verify the signature using the raw request body.
- `delete-account` edge function must use `SUPABASE_SERVICE_ROLE_KEY` and call `auth.admin.deleteUser(user.id)` last, after cascading app-table cleanup.
- For the data export, a single function that returns `{ profile, roles, subscription, activity, analyses }` for `auth.uid()` is enough; trigger a JSON download client-side.
- Error boundary: a class component wrapping `<RouterProvider>` (or `<BrowserRouter>` children) with a friendly fallback and a "Reload" button.
- Per-page titles: a small `useEffect` hook that sets `document.title` is sufficient — no need for `react-helmet`.

---

**Scope estimate**: cuts + blockers ≈ 1 focused build session. High-value polish ≈ a second session. After your approval, I'll implement section by section so you can review each chunk.