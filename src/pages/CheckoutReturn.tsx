import { useEffect } from "react";

/**
 * Web bridge page. Stripe redirects here on success/cancel/portal return;
 * we immediately forward into the Android app via the custom URL scheme.
 * On web, users see a friendly fallback link.
 */
export default function CheckoutReturn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") ?? "success";
    const sessionId = params.get("session_id");

    const host =
      status === "cancel"
        ? "purchase-cancel"
        : status === "portal"
        ? "portal-return"
        : "purchase-success";

    const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const deepLink = `socialscopecoach://${host}${qs}`;

    // Fire the deep link. On Android in-app browser this reopens the app.
    window.location.replace(deepLink);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-xl font-semibold">Returning to the app…</h1>
        <p className="text-sm text-muted-foreground">
          If nothing happens, you can safely close this tab and reopen SocialScope.
        </p>
        <a href="/" className="text-primary underline text-sm">
          Back to home
        </a>
      </div>
    </div>
  );
}
