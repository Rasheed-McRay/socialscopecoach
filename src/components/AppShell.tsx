import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { registerCheckoutDeepLinks } from "@/lib/checkoutFlow";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface AppShellProps {
  children: ReactNode;
  isRecording?: boolean;
  isAnalyzing?: boolean;
  hasUnsavedAnalysis?: boolean;
  onUnsavedNavigate?: (path: string) => void;
}

// Routes that should show the bottom navigation
const NAV_ROUTES = ["/scope", "/insights", "/record", "/progress", "/settings"];

export function AppShell({ 
  children, 
  isRecording = false, 
  isAnalyzing = false,
  hasUnsavedAnalysis = false,
  onUnsavedNavigate,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const showNav = NAV_ROUTES.includes(location.pathname);

  useEffect(() => {
    registerCheckoutDeepLinks({
      onSuccess: (sessionId) => {
        const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
        navigate(`/checkout-success${qs}`);
        refreshSubscription();
      },
      onCancel: () => {
        refreshSubscription();
      },
      onPortalReturn: () => {
        refreshSubscription();
      },
    });
  }, [navigate, refreshSubscription]);

  return (
    <>
      <OfflineBanner />
      {children}
      {showNav && (
        <BottomNav 
          isRecording={isRecording}
          isAnalyzing={isAnalyzing}
          hasUnsavedAnalysis={hasUnsavedAnalysis}
          onUnsavedNavigate={onUnsavedNavigate}
        />
      )}
    </>
  );
}
