/**
 * One-time native runtime initialization: status bar + splash screen.
 * No-ops on web.
 */
import { isNativeApp } from "@/lib/nativeRuntime";
import { logger } from "@/lib/logger";

export const initNativeRuntime = async () => {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Dark UI background → light icons.
    await StatusBar.setStyle({ style: Style.Dark });
    // Match the app background so there's no contrasting band.
    await StatusBar.setBackgroundColor({ color: "#0a1020" }).catch(() => {
      /* iOS doesn't support setBackgroundColor */
    });
  } catch (err) {
    logger.log("StatusBar unavailable:", err);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Give React a moment to mount before fading.
    setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => undefined);
    }, 300);
  } catch (err) {
    logger.log("SplashScreen unavailable:", err);
  }
};
