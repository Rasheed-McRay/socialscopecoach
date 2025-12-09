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
        "relative rounded-xl bg-card border border-primary/20 p-2.5 transition-all duration-200 cursor-pointer",
        "hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]",
        "active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
}
