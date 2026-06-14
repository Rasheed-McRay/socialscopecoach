## Data Export (JSON Download)

Fulfills the Privacy Policy promise to let users download their own data.

### 1. New edge function: `export-user-data`

- Path: `supabase/functions/export-user-data/index.ts`
- Auth: validates JWT in code (uses `SUPABASE_ANON_KEY` + user's bearer token to resolve `auth.uid()`), then switches to `SUPABASE_SERVICE_ROLE_KEY` for the actual reads.
- Returns a single JSON object for the calling user:
  ```
  {
    exported_at, user: { id, email },
    profile, roles, subscription,
    daily_analysis_usage, monthly_analysis_usage,
    daily_scope_completions, saved_reports,
    user_activity, voice_samples
  }
  ```
- Standard CORS headers, 200 on success, 401 on missing/invalid auth, 500 on server error.
- No `config.toml` change needed (defaults are fine; JWT verified in code like the other functions).

### 2. Settings UI

In `src/pages/Settings.tsx`, add an "Export my data" button placed next to / above the existing "Delete account" action. On click:

1. Get the current session.
2. `supabase.functions.invoke('export-user-data')`.
3. Build a `Blob` from the JSON, create an object URL, trigger a download as `socialscopecoach-data-YYYY-MM-DD.json`, revoke the URL.
4. Toast success / error. Disable button + spinner while in flight.

No new dependencies, no schema changes, no migrations.

### Out of scope

- No audio file downloads (just the `voice_samples` rows with their `audio_url`s — bucket is private, so links won't resolve publicly; acceptable for v1 and noted in the export).
- No async/email delivery — synchronous download only.
