import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Gift } from "lucide-react";

export function SubscriptionBadge() {
  const { tier, isPromoTrialActive, loading } = useSubscription();

  if (loading) return null;

  const isPaidPro = tier === "pro";
  const isProViaPromo = isPromoTrialActive && !isPaidPro;

  // Show promo trial badge
  if (isProViaPromo) {
    return (
      <Badge
        variant="default"
        className="gap-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600"
      >
        <Gift className="w-3 h-3" />
        Pro Trial
      </Badge>
    );
  }

  return (
    <Badge
      variant={isPaidPro ? "default" : "secondary"}
      className={`gap-1 text-xs font-medium ${
        isPaidPro
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600"
          : "bg-secondary/80 text-muted-foreground border-border/50"
      }`}
    >
      {isPaidPro ? (
        <Crown className="w-3 h-3" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {isPaidPro ? "Pro" : "Basic"}
    </Badge>
  );
}
