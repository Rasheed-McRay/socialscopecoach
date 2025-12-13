import { Outlet } from "react-router-dom";
import { AppBottomNav } from "./AppBottomNav";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* App Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <AppBottomNav />
    </div>
  );
}
