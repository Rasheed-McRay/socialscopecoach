import { useLocation, useNavigate } from "react-router-dom";
import { Telescope, Lightbulb, Mic, NotebookText, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { toast } from "sonner";

const navItems = [
  { icon: Telescope, label: "Scope", path: "/scope" },
  { icon: Lightbulb, label: "Insights", path: "/insights" },
  { icon: Mic, label: "Record", path: "/record" },
  { icon: NotebookText, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface HeaderNavProps {
  isRecording?: boolean;
  isAnalyzing?: boolean;
  hasUnsavedAnalysis?: boolean;
  onLeaveUnsaved?: (path: string) => void;
}

export function HeaderNav({ isRecording = false, isAnalyzing = false, hasUnsavedAnalysis = false, onLeaveUnsaved }: HeaderNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (path === location.pathname) {
      return;
    }
    if (isRecording) {
      e.preventDefault();
      toast.warning("Recording in progress", {
        description: "Please stop or finish your recording before navigating away.",
      });
      return;
    }
    if (isAnalyzing) {
      e.preventDefault();
      toast.warning("Analysis in progress", {
        description: "Please wait for the analysis to finish or cancel it first.",
      });
      return;
    }
    if (hasUnsavedAnalysis && onLeaveUnsaved) {
      e.preventDefault();
      onLeaveUnsaved(path);
      return;
    }
    navigate(path);
  };

  return (
    <div className="hidden md:flex items-center gap-3">
      <SubscriptionBadge />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <DropdownMenuItem 
                key={item.label} 
                onClick={(e) => handleNavClick(e, item.path)}
                className={cn(
                  "flex items-center gap-3 w-full cursor-pointer",
                  isActive && "text-primary font-medium"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
