import { Flame, Gift, Crown, Sparkles } from 'lucide-react';
import { useAnalysisStreak } from '@/hooks/useAnalysisStreak';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const StreakProgressCard = () => {
  const navigate = useNavigate();
  const { isPro, loading: subLoading } = useSubscription();
  const {
    currentStreak,
    canClaimTrial,
    trialActive,
    trialClaimed,
    daysUntilTrial,
    trialDaysRemaining,
    loading: streakLoading,
    claimTrial,
    STREAK_REQUIRED,
  } = useAnalysisStreak();

  const loading = subLoading || streakLoading;

  // Don't show for paid Pro users (only show for trial or free users)
  if (loading || (isPro && !trialActive)) return null;

  // Show trial active banner
  if (trialActive) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pro Trial Active</p>
            <p className="text-xs text-muted-foreground">
              {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
            </p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all duration-500"
            style={{ width: `${(trialDaysRemaining / 7) * 100}%` }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-primary/30 hover:bg-primary/10"
          onClick={() => navigate('/settings')}
        >
          <Crown className="w-3 h-3 mr-1.5" />
          Upgrade to keep Pro benefits
        </Button>
      </div>
    );
  }

  // Already claimed and expired - don't show anymore
  if (trialClaimed) return null;

  // Show streak progress for free users
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {currentStreak > 0 ? `${currentStreak}-day streak!` : 'Start your streak'}
            </p>
            <p className="text-xs text-muted-foreground">
              {canClaimTrial
                ? 'Claim your free Pro week!'
                : `${daysUntilTrial} more ${daysUntilTrial === 1 ? 'day' : 'days'} to unlock Pro`}
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <span className="text-lg">🔥</span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: STREAK_REQUIRED }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              i < currentStreak
                ? 'bg-gradient-primary shadow-lg'
                : 'bg-muted border border-border'
            }`}
          >
            {i < currentStreak ? (
              <span className="text-sm">✓</span>
            ) : (
              <span className="text-xs text-muted-foreground">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Claim button or reward preview */}
      {canClaimTrial ? (
        <Button
          onClick={claimTrial}
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
        >
          <Gift className="w-4 h-4 mr-2" />
          Claim 7 Days of Pro
        </Button>
      ) : (
        <p className="text-xs text-center text-muted-foreground">
          Complete analyses 3 days in a row to unlock a free week of Pro features!
        </p>
      )}
    </div>
  );
};