import { useLocation, useNavigate } from "react-router-dom";
import { Telescope, Lightbulb, Mic, NotebookText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { icon: Telescope, label: "Scope", path: "/scope" },
  { icon: Lightbulb, label: "Insights", path: "/insights" },
  { icon: Mic, label: "Record", path: "/record", isCenter: true },
  { icon: NotebookText, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface BottomNavProps {
  isRecording?: boolean;
}

export function BottomNav({ isRecording = false }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (isRecording && path !== location.pathname) {
      e.preventDefault();
      toast.warning("Recording in progress", {
        description: "Please stop or finish your recording before navigating away.",
      });
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom md:hidden">
      <div className="mx-2 mb-2">
        <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-elevated">
          <div className="flex items-center justify-around py-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <button
                    key={item.label}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className="relative -mt-5"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center glow-primary shadow-elevated transition-transform hover:scale-105 active:scale-95">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={(e) => handleNavClick(e, item.path)}
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
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
