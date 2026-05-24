/**
 * Lightweight Capacitor runtime detection.
 * Avoids importing @capacitor/core in browser-only builds.
 */
export const isNativeApp = (): boolean => {
  if (typeof window === "undefined") return false;
  // Capacitor injects this global when running inside a native WebView.
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export const getPlatform = (): "ios" | "android" | "web" => {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.() ?? "web";
  return p === "ios" || p === "android" ? p : "web";
};

/**
 * Returns a friendly toast message pair for a getUserMedia / mic error,
 * tailored to whether we're in the native app (Settings > App > Permissions)
 * or a browser (lock icon in URL bar).
 */
export const describeMicError = (
  error: unknown,
): { title: string; description: string } => {
  const native = isNativeApp();
  const name = error instanceof Error ? error.name : "";

  if (name === "NotAllowedError") {
    return {
      title: "Microphone access denied",
      description: native
        ? "Open your phone Settings, find SocialScope Coach, and enable the Microphone permission."
        : "Please allow microphone access in your browser settings.",
    };
  }
  if (name === "NotFoundError") {
    return {
      title: "No microphone found",
      description: native
        ? "Your device microphone could not be detected. Restart the app and try again."
        : "Please connect a microphone and try again.",
    };
  }
  if (name === "NotReadableError") {
    return {
      title: "Microphone unavailable",
      description: "Your microphone may be in use by another app. Close other apps and try again.",
    };
  }
  return {
    title: "Unable to access microphone",
    description: "Please check your microphone settings and try again.",
  };
};
