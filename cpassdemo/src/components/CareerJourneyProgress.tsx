import { cn } from '@/lib/utils';

interface CareerJourneyProgressProps {
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress?: number;
  nextMilestone?: string;
  requirements?: string[];
}

const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;

export function CareerJourneyProgress({
  currentTier,
  progress = 0,
  nextMilestone,
  requirements,
}: CareerJourneyProgressProps) {
  const currentIndex = tiers.indexOf(currentTier);

  return (
    <div className="p-4 bg-card rounded-lg border border-border space-y-4">
      <h3 className="font-semibold">Career Journey</h3>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {tiers.map((tier, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={tier} className="flex flex-col items-center z-10">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-border text-muted-foreground',
                    isCurrent && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  {isCompleted ? '●' : '○'}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1 capitalize',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {tier}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border -z-0">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(currentIndex / (tiers.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Next milestone info */}
      {currentTier !== 'platinum' && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next Milestone:</span>
            <span className="font-medium capitalize">
              {nextMilestone || `${tiers[currentIndex + 1]} Tier`}
            </span>
          </div>
          
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}/100 points</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {requirements && requirements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To reach next tier:</p>
              <ul className="text-xs space-y-1">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {currentTier === 'platinum' && (
        <div className="pt-2 border-t border-border text-center">
          <p className="text-sm font-medium text-success">
            🎉 Achievement Unlocked! You've reached the highest tier
          </p>
        </div>
      )}
    </div>
  );
}
