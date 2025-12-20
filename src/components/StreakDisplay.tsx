import { useEffect } from 'react';
import { useAnalysisStreak } from '@/hooks/useAnalysisStreak';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Flame, Crown, Sparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const STREAK_REQUIRED = 3;

interface StreakDisplayProps {
  triggerCheck?: boolean;
  onCheckComplete?: () => void;
}

export function StreakDisplay({ triggerCheck, onCheckComplete }: StreakDisplayProps) {
  const { 
    currentStreak, 
    promoTrialClaimed, 
    promoTrialExpiresAt, 
    isPromoTrialActive,
    daysUntilPromoUnlock,
    loading,
    claimPromoTrial,
    refreshStreak 
  } = useAnalysisStreak();
  const { isPro, tier } = useSubscription();

  // Auto-claim promo trial when trigger is set and user qualifies
  useEffect(() => {
    if (triggerCheck) {
      const checkAndClaim = async () => {
        await refreshStreak();
      };
      checkAndClaim();
    }
  }, [triggerCheck, refreshStreak]);

  // Separate effect to handle auto-claiming after streak refresh
  useEffect(() => {
    if (triggerCheck && !loading && currentStreak >= STREAK_REQUIRED && !promoTrialClaimed && tier === 'basic') {
      const autoClaim = async () => {
        await claimPromoTrial();
        onCheckComplete?.();
      };
      autoClaim();
    } else if (triggerCheck && !loading) {
      onCheckComplete?.();
    }
  }, [triggerCheck, loading, currentStreak, promoTrialClaimed, tier]);

  if (loading) {
    return null;
  }

  // If user is already a paid Pro subscriber (not via promo), don't show streak promo
  if (tier === 'pro') {
    return null;
  }

  // Calculate days remaining in promo trial
  const getDaysRemaining = () => {
    if (!promoTrialExpiresAt) return 0;
    const now = new Date();
    const expires = new Date(promoTrialExpiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Active promo trial display
  if (isPromoTrialActive) {
    const daysRemaining = getDaysRemaining();
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
        <Crown className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-foreground">
          Pro Trial: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
        </span>
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-0 text-xs">
          Free Week
        </Badge>
      </div>
    );
  }

  // Already claimed but expired - show subscribe CTA
  if (promoTrialClaimed && !isPromoTrialActive) {
    return null; // Don't show anything, they've used their trial
  }

  // Show streak progress for free users
  const progressPercent = (currentStreak / STREAK_REQUIRED) * 100;
  const canClaim = currentStreak >= STREAK_REQUIRED && !promoTrialClaimed;

  return (
    <div className="space-y-2 px-3 py-3 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-lg border border-orange-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="font-bold text-lg">{currentStreak}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            day streak
          </span>
        </div>
        
        {canClaim ? (
          <Button 
            size="sm" 
            onClick={claimPromoTrial}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Claim Free Week
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="w-3 h-3" />
            {daysUntilPromoUnlock} day{daysUntilPromoUnlock !== 1 ? 's' : ''} to unlock
          </Badge>
        )}
      </div>
      
      {!canClaim && (
        <>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            Use the app {daysUntilPromoUnlock} more day{daysUntilPromoUnlock !== 1 ? 's' : ''} to unlock a free week of Pro!
          </p>
        </>
      )}
    </div>
  );
}
