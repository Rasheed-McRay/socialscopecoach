import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface OptionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export const OptionCard = ({ icon: Icon, title, description, selected, onClick }: OptionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
        "flex items-start gap-4 group",
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/80"
      )}
    >
      <div
        className={cn(
          "p-3 rounded-lg transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className={cn(
          "font-semibold transition-colors",
          selected ? "text-primary" : "text-foreground"
        )}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "border-primary bg-primary" : "border-muted-foreground/50"
        )}
      >
        {selected && (
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        )}
      </div>
    </button>
  );
};
