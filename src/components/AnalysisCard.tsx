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
        "relative rounded-xl p-[1px] transition-all duration-300 cursor-pointer",
        "bg-gradient-to-r from-primary/30 via-primary/10 to-transparent",
        "hover:from-primary/50 hover:via-primary/20 hover:to-primary/5",
        "active:scale-[0.98]",
        "group"
      )}
    >
      {/* Outer glow on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg bg-primary/15" />
      
      {/* Card content */}
      <div className="relative bg-gradient-to-br from-card via-card to-background/80 rounded-[10px] px-3 py-2 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-1">
              {date}
            </p>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[10px]">{toneEmoji}</span>
              <span className="text-[9px] font-medium text-primary">{tone}</span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
