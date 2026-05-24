## Ship to Google Play — what happens now

Your project is already wired for Capacitor 8 (config, permissions docs, native mic error handling, build scripts, `ANDROID.md`). Nothing more needs to change in the codebase to produce a Play Store build. The remaining work is **local on your machine** + **Play Console setup** — Lovable's sandbox can't compile Android binaries.

If you want, I can also do a few small polish passes before you build. Pick any you want and I'll do them in build mode:

### Optional code polish (I'll do if you say yes)
1. **App icon + splash screen** — right now Android will ship with the default Capacitor logo. I can add a source icon under `assets/` and wire up `@capacitor/assets` so one command generates every required Android icon size + splash.
2. **Privacy policy link in Settings** — Play Console requires a public privacy URL. You already have `/privacy-policy`; I can make sure it's linked from Settings so reviewers can find it in-app.
3. **Version bump helper** — add a tiny script that bumps `versionCode`/`versionName` in `android/app/build.gradle` so future Play uploads don't fail with "version already exists".
4. **Stripe checkout on native** — confirm `create-checkout` opens in the system browser (not the in-app WebView) on Android, so Google Play policy is satisfied and the return URL works.

### What you do locally (one-time, ~1–2 hours)
Full walkthrough is in `ANDROID.md`. Short version:

1. Install **Android Studio** + create a **Google Play Console** account ($25).
2. Export project to GitHub (button top-right in Lovable), `git clone`, `npm install`.
3. `npx cap add android` — generates the `android/` folder.
4. Add the 3 permissions to `android/app/src/main/AndroidManifest.xml` (exact diff in `ANDROID.md`): `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `WAKE_LOCK`.
5. `npm run android:build` then `npm run android:open`.
6. In Android Studio: **Build → Generate Signed Bundle → AAB**. Create a keystore and **back up the `.jks` file forever** — losing it locks you out of updating the app.
7. Upload the `.aab` to **Play Console → Internal testing → Create release**. Add your email as a tester. Live in ~30 min, no full review needed.

### Play Console forms you'll fill in
- **Privacy policy URL** → `https://socialscopecoach.app/privacy-policy`
- **Data safety** → declare: email (auth), audio recordings (feature, processed by your backend, not shared for ads), usage data
- **Permissions justification** → "RECORD_AUDIO required because the core feature records the user's voice to analyze speech"
- **Content rating questionnaire** → straightforward, ~5 minutes
- **Target audience + ads** → no ads

### What you should NOT do
- Don't link to Stripe checkout from inside the app in a way that pushes users to pay outside Play — Google's payments policy is strict on this. Subscriptions sold on your **website** before users install the app are fine; in-app upgrade buttons that open external checkout are a gray area. Worth reading Google's current Payments policy before you ship.
- Don't lose the keystore `.jks` file.

---

**Tell me which option you want:**
- "Do all the polish first" → I'll do items 1–4 above, then you build locally.
- "Just icons + privacy link" → I'll do 1 and 2 only.
- "Skip polish, I'll build now" → Nothing more to change; follow `ANDROID.md`.
- "Draft Play Store listing copy too" (short description, full description, screenshots prompt) — I can add that.