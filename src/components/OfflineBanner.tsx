import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Fixed-top banner shown when navigator reports offline.
 * Stays visible until connection returns; auto-hides after a brief
 * "Back online" confirmation when reconnected.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(t);
    };
    const goOffline = () => {
      setOnline(false);
      setShowReconnected(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[100] px-4 py-2 text-center text-sm font-medium text-white shadow-md pt-[calc(env(safe-area-inset-top)+0.5rem)] ${
        online ? "bg-emerald-600" : "bg-amber-600"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {!online && <WifiOff className="w-4 h-4" />}
        {online ? "Back online" : "You're offline — some features may not work"}
      </span>
    </div>
  );
}
