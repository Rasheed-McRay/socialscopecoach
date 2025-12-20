import { useAnalysisStreak } from '@/hooks/useAnalysisStreak';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProTrialBanner() {
  const { isPromoTrialActive, promoTrialExpiresAt, loading } = useAnalysisStreak();
  const { isPro } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (loading || dismissed) return null;
  
  // Only show for active promo trial users
  if (!isPromoTrialActive) return null;
  
  // Don't show if user is already a paid subscriber
  if (isPro && !isPromoTrialActive) return null;

  const getDaysRemaining = () => {
    if (!promoTrialExpiresAt) return 0;
    const now = new Date();
    const expires = new Date(promoTrialExpiresAt);
    const diffTime = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4" />
        <span className="text-sm font-medium">
          Pro Trial Active — {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="secondary" 
          size="sm"
          className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => navigate('/settings')}
        >
          Upgrade to keep Pro
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
