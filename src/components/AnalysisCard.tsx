import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  date: string;
  tone: string;
  toneEmoji: string;
  onClick?: () => void;
}

export function AnalysisCard({ title, date, tone, toneEmoji, onClick }: AnalysisCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-xl bg-card border border-border/50 px-3 py-2.5 md:px-5 md:py-4 transition-all duration-200 cursor-pointer",
        "hover:border-primary/30 hover:bg-card/80",
        "active:scale-[0.99]",
        "group"
      )}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            {date}
          </p>
          <div className="inline-flex items-center gap-1 md:gap-1.5 mt-1.5 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-primary/10">
            <span className="text-[11px] md:text-sm">{toneEmoji}</span>
            <span className="text-[10px] md:text-xs font-medium text-primary">{tone}</span>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
