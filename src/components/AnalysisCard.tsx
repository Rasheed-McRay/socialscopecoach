import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  date: string;
  description?: string;
  socialScore?: number;
  confidenceScore?: number;
  onClick?: () => void;
}

export function AnalysisCard({ 
  title, 
  date, 
  description,
  socialScore,
  confidenceScore,
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
        {/* Score badges on left */}
        {(socialScore !== undefined || confidenceScore !== undefined) && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {socialScore !== undefined && (
              <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-base md:text-lg font-bold text-primary">{socialScore}</span>
              </div>
            )}
            {confidenceScore !== undefined && (
              <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg bg-accent/10 border border-accent/20">
                <span className="text-base md:text-lg font-bold text-accent">{confidenceScore}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base md:text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {description}
            </p>
          )}
          
          <span className="text-xs md:text-sm text-muted-foreground/70 mt-1.5 block">
            {date}
          </span>
        </div>
        
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
