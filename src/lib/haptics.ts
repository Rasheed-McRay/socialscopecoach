import { isNativeApp } from "@/lib/nativeRuntime";

// Lazy import so web builds don't pull native plugin code into the main bundle.
const getHaptics = async () => {
  if (!isNativeApp()) return null;
  try {
    const mod = await import("@capacitor/haptics");
    return mod;
  } catch {
    return null;
  }
};

export const hapticTap = async () => {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.Haptics.impact({ style: h.ImpactStyle.Light });
  } catch {
    /* no-op */
  }
};

export const hapticSuccess = async () => {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.Haptics.notification({ type: h.NotificationType.Success });
  } catch {
    /* no-op */
  }
};

export const hapticWarn = async () => {
  const h = await getHaptics();
  if (!h) return;
  try {
    await h.Haptics.notification({ type: h.NotificationType.Warning });
  } catch {
    /* no-op */
  }
};
