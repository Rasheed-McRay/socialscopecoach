import { cn } from "@/lib/utils";

interface ScoreDialProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreDial({ score, label, size = "md" }: ScoreDialProps) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-11 h-11 md:w-16 md:h-16",
    md: "w-14 h-14 md:w-20 md:h-20",
    lg: "w-18 h-18 md:w-24 md:h-24",
  };

  const textSizes = {
    sm: "text-sm md:text-lg",
    md: "text-base md:text-xl",
    lg: "text-lg md:text-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        {/* Background glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-md" />
        
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            className="opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(28 90% 55%)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-foreground", textSizes[size])}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
