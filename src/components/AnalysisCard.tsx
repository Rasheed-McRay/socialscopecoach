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
        "rounded-xl bg-card border border-border/50 px-3 py-2.5 transition-all duration-200 cursor-pointer",
        "hover:border-primary/30 hover:bg-card/80",
        "active:scale-[0.99]",
        "group"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {date}
          </p>
          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10">
            <span className="text-[11px]">{toneEmoji}</span>
            <span className="text-[10px] font-medium text-primary">{tone}</span>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
