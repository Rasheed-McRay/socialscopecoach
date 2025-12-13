import { Link, useLocation } from "react-router-dom";
import { Home, Lightbulb, Mic, NotebookText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Lightbulb, label: "Insights", path: "/app/insights" },
  { icon: Mic, label: "Record", path: "/app/record", isCenter: true },
  { icon: NotebookText, label: "Progress", path: "/app/progress" },
  { icon: Settings, label: "Settings", path: "/app/settings" },
];

export function AppBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-3 mb-3">
        <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-elevated">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="relative -mt-6"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center glow-primary shadow-elevated transition-transform active:scale-95",
                      isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                    )}>
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
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-all",
                      isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
