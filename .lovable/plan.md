## Goal

Get your existing app onto the Google Play Store for Android validation. Capacitor 8 + the Android platform are already in `package.json`, so the heavy lifting is configuration, permissions, and a clean build pipeline — not new code.

## Quick clarification on the build choices

- **APK vs Play Store (AAB)**: An APK is a single installable file you send to testers directly. The Play Store requires an **AAB** (Android App Bundle) and a Google Play Console account ($25 one-time). Since you want Play Store, we target AAB and use the **Internal Testing** track first — it goes live in hours, only people you invite can install, and you don't need a full store review to start validating.
- **Online-only is fine**: The app will be bundled into the APK/AAB (required by Play Store), but it'll still call your live Lovable Cloud backend for AI, auth, recordings, etc. "Bundled" just means the React UI ships inside the app instead of being downloaded from a URL every launch — Play Store rejects apps that are pure WebView wrappers around a remote site.

## What I'll change in the project

### 1. Capacitor config (`capacitor.config.ts`)
Remove the `server.url` hot-reload block so production builds use the bundled `dist/`. Keep a commented-out dev version you can re-enable locally when iterating. Rename `appName` from `socialscope` to `SocialScope Coach` to match your published brand.

### 2. Android permissions & manifest
Add a small `AndroidManifest.xml` patch instruction (applied after `npx cap add android` runs locally) for:
- `RECORD_AUDIO` — required, app records voice
- `INTERNET` — default, but confirm
- `MODIFY_AUDIO_SETTINGS` — needed for clean mic capture on some devices
- `WAKE_LOCK` — your recording flow already uses the Wake Lock API

### 3. App icon & splash
Generate proper Android icon set and splash from a single source image so the app doesn't ship with the default Capacitor logo. I'll add an `assets/` source image and document the `@capacitor/assets` generator command.

### 4. Recording UX guard for native
Detect Capacitor runtime and surface a clearer permission-denied message when Android denies microphone access (currently the web `getUserMedia` error isn't friendly on native).

### 5. Build scripts
Add `npm run android:build` and `npm run android:open` convenience scripts wrapping `vite build && cap sync android` and `cap open android`.

### 6. README section
Add a "Ship to Google Play" section with the exact local commands.

## What you'll need to do locally (one-time setup)

Lovable's cloud sandbox can't build native Android — you need a local machine for this part. You'll do this once after I make the changes above:

1. Install **Android Studio** (free, ~5 GB) — provides JDK + Android SDK
2. Export this project to GitHub via Lovable's GitHub button, `git clone` it locally
3. `npm install`
4. `npx cap add android` — generates the `android/` folder
5. Apply the `AndroidManifest.xml` permissions (I'll provide an exact diff)
6. `npm run android:build` — bundles web + syncs to native
7. `npx cap open android` — opens Android Studio
8. In Android Studio: **Build → Generate Signed Bundle → AAB**, create a keystore (back it up — losing it locks you out of updating the app forever)
9. Upload the `.aab` to **Play Console → Internal testing → Create release**

## Things to flag before launch

- **Auth**: You're using email/password only — no native OAuth deep-link work needed. If you add Google sign-in later, that needs Capacitor-specific setup.
- **Stripe checkout**: Opens in the system browser via Capacitor's default behavior, which works, but in-app purchases are not used (Play Store doesn't require IAP for subscriptions sold elsewhere as long as you don't link to external checkout from inside the app — worth reviewing Google's payments policy for your specific case before launch).
- **Privacy policy URL**: Play Console requires a public privacy policy URL since the app records audio. Your `/privacy-policy` route works once the app is published.
- **Data safety form**: Play Console will ask what data you collect (audio, email, usage) — straightforward to fill in.
- **Target SDK**: Capacitor 8 targets a recent Android SDK that Play requires — no action needed.

## Out of scope for this pass

iOS build (you have `@capacitor/ios` installed but didn't ask for it), push notifications, in-app updates, Play Store listing copy/screenshots.

## After plan approval

I'll make the config/script/permissions/README changes in one pass, then you can pull the repo and run the local build steps above. Want me to also draft starter Play Store listing copy (short description, full description, feature graphic prompt) as part of this, or keep that for a separate round?
