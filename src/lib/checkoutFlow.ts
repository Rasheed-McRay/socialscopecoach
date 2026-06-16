import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { logger } from "@/lib/logger";

export const isAndroidNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export const clientPlatformHeader = (): Record<string, string> =>
  isAndroidNative() ? { "x-client-platform": "android" } : {};

/** Open Stripe Checkout / Customer Portal URL. */
export async function openExternalCheckout(url: string) {
  if (isAndroidNative()) {
    await Browser.open({ url, presentationStyle: "popover" });
  } else {
    window.location.href = url;
  }
}

type DeepLinkHandlers = {
  onSuccess: (sessionId: string | null) => void;
  onCancel: () => void;
  onPortalReturn: () => void;
};

let registered = false;

/**
 * Register the appUrlOpen listener once at boot. Handles
 * socialscopecoach://purchase-success, purchase-cancel, portal-return.
 */
export async function registerCheckoutDeepLinks(handlers: DeepLinkHandlers) {
  if (registered || !Capacitor.isNativePlatform()) return;
  registered = true;

  await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    try {
      const url = event.url || "";
      if (!url.startsWith("socialscopecoach://")) return;

      // Close the in-app browser if still open.
      try {
        await Browser.close();
      } catch {
        /* noop */
      }

      const parsed = new URL(url);
      const host = parsed.host || parsed.pathname.replace(/^\/+/, "");
      const sessionId = parsed.searchParams.get("session_id");

      if (host === "purchase-success") {
        handlers.onSuccess(sessionId);
      } else if (host === "purchase-cancel") {
        handlers.onCancel();
      } else if (host === "portal-return") {
        handlers.onPortalReturn();
      }
    } catch (err) {
      logger.error("appUrlOpen handler failed", err);
    }
  });
}
