import { Link, useLocation } from "react-router-dom";
import { Sun, Lightbulb, Mic, NotebookText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Sun, label: "Home", path: "/app" },
  { icon: Lightbulb, label: "Insights", path: "/insights" },
  { icon: Mic, label: "Record", path: "/app", isCenter: true },
  { icon: NotebookText, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-2 mb-2">
        <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-elevated">
          <div className="flex items-center justify-around py-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="relative -mt-5"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center glow-primary shadow-elevated transition-transform hover:scale-105 active:scale-95">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-1.5 rounded-lg transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 transition-all",
                      isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )} />
                  </div>
                  <span className="text-[9px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
