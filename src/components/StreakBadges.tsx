import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEarnedMilestones, getNextMilestone, MILESTONES } from '@/lib/streakUtils';

interface StreakBadgesProps {
  currentStreak: number;
}

export function StreakBadges({ currentStreak }: StreakBadgesProps) {
  const earnedMilestones = getEarnedMilestones(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);
  
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-amber-500" />
          Streak Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {MILESTONES.map((milestone) => {
            const isEarned = earnedMilestones.includes(milestone);
            
            return (
              <div
                key={milestone.days}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  isEarned
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-muted/30 border-border/50 opacity-50'
                }`}
              >
                <span className="text-2xl mb-1">{milestone.emoji}</span>
                <span className={`text-xs font-medium text-center ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {milestone.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {milestone.days} days
                </span>
              </div>
            );
          })}
        </div>
        
        {nextMilestone && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{nextMilestone.days - currentStreak}</span> more day{nextMilestone.days - currentStreak !== 1 ? 's' : ''} to unlock {nextMilestone.emoji} {nextMilestone.name}
          </div>
        )}
        
        {earnedMilestones.length === MILESTONES.length && (
          <div className="mt-4 text-center text-sm text-amber-500 font-medium">
            🎉 All milestones achieved! You're a legend!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
