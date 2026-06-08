## Problem

After logging in from the Landing page (`/`), the owner account `rmcclaryraynor@gmail.com` is briefly bounced to `/paywall` even though the `user_roles` row is correctly set to `role=owner, tier=developer, access_level=unlimited`.

## Root Cause

`src/contexts/RoleContext.tsx` initializes its `loading` state to `false`:

```ts
const [loading, setLoading] = useState(false);
```

While the role is being fetched, the context exposes the defaults `role='user'`, `tier='free'`, `accessLevel='restricted'`, `isOwner=false`. `ProtectedRoute` only blocks rendering while `roleLoading` is true — so on the first render after the Landing-page login redirect to `/record`, it sees `roleLoading=false` + `isOwner=false` + `isPro=false` and immediately navigates to `/paywall`.

`SubscriptionContext` does not have this bug because it starts with `loading=true`.

## Fix

Single, minimal change in `src/contexts/RoleContext.tsx`:

1. Initialize `loading` to `true` so `ProtectedRoute` waits for the first `user_roles` fetch to complete before evaluating owner/paywall logic.
2. Ensure `loading` is set to `false` in every branch of `fetchRole` (including the no-user / signed-out branch) so the loader doesn't hang.

That eliminates the race for the owner account on the Landing → `/record` path and for every other route gated by `ProtectedRoute`.

## Verification

- Sign in as `rmcclaryraynor@gmail.com` from `/` → should land on `/record` with no flash of `/paywall`.
- Sign in as a non-owner free user → still routed to `/paywall` as expected.
- Sign out / signed-out routes (`/auth`, `/`) still render without an infinite loading spinner.
