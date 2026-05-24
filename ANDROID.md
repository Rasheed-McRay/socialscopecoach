# Ship to Google Play (Android)

This project is wired for Capacitor 8. Native builds can't run inside the
Lovable sandbox — follow these steps on your own machine.

## One-time setup

1. Install **Android Studio** (https://developer.android.com/studio). It bundles the
   JDK + Android SDK you need.
2. Create a **Google Play Console** account ($25 one-time fee).
3. Export this project to GitHub (button in the top-right of Lovable), then:
   ```bash
   git clone <your-repo-url>
   cd <project>
   npm install
   npx cap add android
   ```
   That creates the `android/` folder. It's safe to commit it.

## Add required permissions

Open `android/app/src/main/AndroidManifest.xml` and add these inside
`<manifest>` (next to the existing permission lines):

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<!-- INTERNET is included by default by Capacitor -->
```

## Generate app icon & splash (replace default Capacitor logo)

Before your first build, replace the default Capacitor icon so the Play
Store listing and home-screen icon are branded.

1. Create a folder `assets/` in the project root with two PNGs:
   - `assets/icon.png` — **1024×1024**, opaque, your full logo (no padding)
   - `assets/splash.png` — **2732×2732**, logo centered on your brand background
2. Install the generator (one-time): `npm i -D @capacitor/assets`
3. Run: `npx capacitor-assets generate --android`

This writes every required density (mdpi → xxxhdpi) into
`android/app/src/main/res/`. Re-run any time you change the source PNGs.


## Build & open in Android Studio

Every time you pull new changes from Lovable:

```bash
npm install
npm run android:build   # vite build + cap sync android
npm run android:open    # opens Android Studio
```

To test on a connected device or emulator:

```bash
npm run android:run
```

## Create a signed release bundle (AAB)

Play Store requires an `.aab`, not an `.apk`.

1. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. Click **Create new…** to make a keystore. **Back this `.jks` file up
   somewhere safe** — if you lose it, you can never publish updates to this
   app again. Use a strong password and save it in your password manager.
3. Pick **release** build variant, both signature versions (V1 + V2),
   and click **Finish**.
4. The signed `.aab` is dropped in `android/app/release/`.

## Upload to Play Console (Internal Testing track)

1. In Play Console → **Create app** → fill name, language, app/game, free/paid.
2. **Testing → Internal testing → Create new release** → drop the `.aab`.
3. Add testers by email (or a Google Group).
4. Submit. Internal builds are usually available to testers in 15-60 minutes
   via a Play Store opt-in link — no full review needed.

## Required Play Console forms before launch

- **Privacy policy URL** — point at your live `/privacy-policy` page.
- **Data safety form** — declare: email (auth), audio recordings (feature),
  usage data (analytics). Audio is processed by your backend, not shared
  with third parties for advertising.
- **App content** — target age, ads (no), content rating questionnaire.
- **Permissions justification** — `RECORD_AUDIO` is required because the
  core app feature records the user's voice to analyze speech.

## Local hot-reload while iterating

When developing native features locally, you can point the app at the
Lovable sandbox instead of bundled assets. In `capacitor.config.ts`,
uncomment the `server` block, then `npm run android:run`. Re-comment it
before building a release bundle for Play.

## Things to know

- **Online-only is fine.** The app bundles the React UI but still calls
  the live Lovable Cloud backend at runtime, so an internet connection is
  required to use AI features.
- **Stripe checkout** opens in the system browser. Subscriptions sold
  outside the app generally don't require Google Play Billing, but review
  Google's current payments policy before launch since rules change.
- **Updating the app** later: bump `versionCode` and `versionName` in
  `android/app/build.gradle` for every Play upload.
