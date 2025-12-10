import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";

export function SubscriptionBadge() {
  const { tier, loading } = useSubscription();

  if (loading) return null;

  const isPro = tier === "pro";

  return (
    <Badge
      variant={isPro ? "default" : "secondary"}
      className={`gap-1 text-xs font-medium ${
        isPro
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600"
          : "bg-secondary/80 text-muted-foreground border-border/50"
      }`}
    >
      {isPro ? (
        <Crown className="w-3 h-3" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {isPro ? "Pro" : "Basic"}
    </Badge>
  );
}
