# Mobile polish: native feel + reliable background recording

Implementing picks 1, 2, 3, 4, 14 plus addressing background-recording on Android.

## 1. Native splash + status bar (pick #1)
- Add `@capacitor/splash-screen` and `@capacitor/status-bar`.
- In `src/main.tsx` (or a new `src/lib/nativeRuntime.ts` boot hook): on `Capacitor.isNativePlatform()`, set status bar style to dark-content over the app background color, then hide splash after first paint.
- Add a small `splash` config block in `capacitor.config.ts` (background color matching `--background`, no spinner, 1500ms fade).

## 2. Haptics on key actions (pick #2)
- Add `@capacitor/haptics`.
- Create `src/lib/haptics.ts` with `tap()`, `success()`, `warn()` that no-op on web.
- Wire in:
  - `VoiceRecorder` / `HomeRecorder`: `tap()` on record start, `success()` on stop.
  - `Record.tsx`: `success()` when analysis completes, `warn()` at the 9-minute limit.
  - Streak milestone toast: `success()`.

## 3. Reliable keep-awake (pick #3)
- Add `@capacitor-community/keep-awake`.
- Replace the Wake Lock API calls during recording with a small wrapper that prefers the native plugin on device and falls back to `navigator.wakeLock` on web.
- Release on stop, cancel, error, and unmount.

## 4. Disable browser-y feel (pick #4)
- `src/index.css`: global `overscroll-behavior: none`, `-webkit-tap-highlight-color: transparent`, `user-select: none` on `body` with explicit `user-select: text` on inputs, textareas, transcripts, and any selectable analysis text.
- `capacitor.config.ts`: `ios.scrollEnabled: true` only where needed; set `backgroundColor` to match `--background` so there's no white flash.

## 5. Production capacitor.config sanity (pick #14)
- Current `capacitor.config.ts` already has the `server.url` block commented out — confirmed good. Add an inline comment warning future-me never to commit it uncommented.
- Set top-level `backgroundColor` to the dark background hex used in `index.css` (kills white flash between splash and React mount).

## 6. Background recording on Android (your reported issue)
Root cause: Android WebView aggressively suspends MediaRecorder when the app is backgrounded or the screen locks, regardless of Wake Lock. The fix is a **foreground service** that keeps the recording mic/process alive.

- Add `@capawesome-team/capacitor-android-foreground-service` (or `cordova-plugin-foreground-service` if Capawesome doesn't fit).
- On record start (native only): start a foreground service with a small persistent notification ("SocialScope is recording…"). Stop the service on record end/cancel/error.
- iOS equivalent uses background audio mode in `Info.plist` (`UIBackgroundModes: ["audio"]`) — add a note in `ANDROID.md` to also update iOS plist when that build happens.
- Add `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MICROPHONE` permissions to `AndroidManifest.xml` (user does this once after `npx cap sync`).

## 7. Update ANDROID.md / RELEASING.md
- Document the new plugins so the user knows to run `npm i` → `npx cap sync android` after pulling.
- Add a "before publishing to Play" checklist: confirm `server.url` commented, bump `versionCode`/`versionName`, signed bundle build.

## Files touched
- `capacitor.config.ts` — splash + backgroundColor
- `package.json` — 4 new plugins
- `src/main.tsx` — native boot hook
- `src/lib/haptics.ts` — new
- `src/lib/keepAwake.ts` — new (replaces inline Wake Lock usage)
- `src/components/VoiceRecorder.tsx`, `HomeRecorder.tsx`, `Record.tsx`, `DailyScopeAnalysis.tsx` — haptics + keep-awake + foreground service hooks
- `src/index.css` — overscroll/select rules
- `ANDROID.md` — new permissions + sync steps

## Out of scope
- iOS-specific testing (no Mac access assumed; just doc the plist change).
- Lazy-loading routes, bundle splitting, image conversion (separate pass).
- Changing the Wake Lock memory rule — the rule still holds for web/PWA; native path just upgrades it.

## What the user does after I'm done
1. `git pull`
2. `npm install`
3. `npx cap sync android`
4. Open `android/app/src/main/AndroidManifest.xml`, add the two `FOREGROUND_SERVICE*` permissions (I'll paste the exact lines in ANDROID.md).
5. Bump `versionCode`/`versionName` in `android/app/build.gradle`.
6. `./gradlew bundleRelease` → upload to Play.
