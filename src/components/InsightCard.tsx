import { cn } from "@/lib/utils";

interface InsightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InsightCard({ children, className, onClick }: InsightCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-[1px] transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-primary/40 via-primary/20 to-transparent",
        "hover:from-primary/60 hover:via-primary/30 hover:to-primary/10",
        "group",
        className
      )}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-primary/20" />
      
      {/* Card content */}
      <div className="relative bg-gradient-to-br from-card to-background rounded-[15px] p-3 shadow-card">
        {/* Inner subtle shadow */}
        <div className="absolute inset-0 rounded-[15px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
