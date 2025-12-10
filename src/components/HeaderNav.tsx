import { Link, useLocation } from "react-router-dom";
import { Sun, Lightbulb, Mic, NotebookText, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Sun, label: "Home", path: "/app" },
  { icon: Lightbulb, label: "Insights", path: "/insights" },
  { icon: Mic, label: "Record", path: "/record" },
  { icon: NotebookText, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function HeaderNav() {
  const location = useLocation();

  return (
    <div className="hidden md:block">
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
              <DropdownMenuItem key={item.label} asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 w-full cursor-pointer",
                    isActive && "text-primary font-medium"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
