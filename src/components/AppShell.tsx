import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

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
  const showNav = NAV_ROUTES.includes(location.pathname);

  return (
    <>
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
