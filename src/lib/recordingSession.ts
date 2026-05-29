/**
 * Cross-platform keep-awake + Android foreground-service wrapper.
 * - Web/PWA: falls back to the Wake Lock API (best-effort).
 * - Native iOS: keeps screen on via the community plugin.
 * - Native Android: keeps screen on AND starts a foreground service with a
 *   persistent notification so MediaRecorder isn't killed in the background.
 *
 * All methods are safe to call from any platform.
 */
import { isNativeApp, getPlatform } from "@/lib/nativeRuntime";

let webWakeLock: WakeLockSentinel | null = null;
let foregroundServiceStarted = false;

const FG_NOTIFICATION_ID = 4242;

export const startRecordingSession = async () => {
  if (!isNativeApp()) {
    // Web fallback: screen wake lock only.
    try {
      if ("wakeLock" in navigator) {
        webWakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log("Wake lock not available:", err);
    }
    return;
  }

  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    await KeepAwake.keepAwake();
  } catch (err) {
    console.log("KeepAwake unavailable:", err);
  }

  if (getPlatform() === "android") {
    try {
      const { ForegroundService } = await import(
        "@capawesome-team/capacitor-android-foreground-service"
      );
      await ForegroundService.startForegroundService({
        id: FG_NOTIFICATION_ID,
        title: "SocialScope is recording",
        body: "Tap to return to the app",
        smallIcon: "ic_stat_icon_config_sample",
        silent: true,
      });
      foregroundServiceStarted = true;
    } catch (err) {
      console.log("Foreground service unavailable:", err);
    }
  }
};

export const stopRecordingSession = async () => {
  if (webWakeLock) {
    try {
      await webWakeLock.release();
    } catch {
      /* no-op */
    }
    webWakeLock = null;
  }

  if (!isNativeApp()) return;

  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    await KeepAwake.allowSleep();
  } catch {
    /* no-op */
  }

  if (foregroundServiceStarted && getPlatform() === "android") {
    try {
      const { ForegroundService } = await import(
        "@capawesome-team/capacitor-android-foreground-service"
      );
      await ForegroundService.stopForegroundService();
    } catch {
      /* no-op */
    }
    foregroundServiceStarted = false;
  }
};
