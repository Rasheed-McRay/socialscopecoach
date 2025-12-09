import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  date: string;
  description?: string;
  socialScore?: number;
  confidenceScore?: number;
  tone: string;
  toneEmoji: string;
  onClick?: () => void;
}

export function AnalysisCard({ 
  title, 
  date, 
  description,
  socialScore,
  confidenceScore,
  tone, 
  toneEmoji, 
  onClick 
}: AnalysisCardProps) {
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            {/* Score badges */}
            {(socialScore !== undefined || confidenceScore !== undefined) && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {socialScore !== undefined && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    <span className="text-[9px] md:text-[10px] font-medium">{socialScore}</span>
                    <span className="text-[8px] md:text-[9px] opacity-70">S</span>
                  </div>
                )}
                {confidenceScore !== undefined && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                    <span className="text-[9px] md:text-[10px] font-medium">{confidenceScore}</span>
                    <span className="text-[8px] md:text-[9px] opacity-70">C</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {description && (
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
            <span className="text-[10px] md:text-xs text-muted-foreground">
              {date}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] md:text-xs">{toneEmoji}</span>
              <span className="text-[9px] md:text-[11px] font-medium text-primary">{tone}</span>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
