import { Progress } from "@/components/ui/progress";
import { Award, ChevronRight } from "lucide-react";

interface TierJourneyBarProps {
  currentTier: string;
  totalPoints: number;
  verifiedSkills: number;
}

const tiers = [
  { name: 'Bronze', minPoints: 0, color: 'bg-tier-bronze', textColor: 'text-tier-bronze' },
  { name: 'Silver', minPoints: 100, color: 'bg-tier-silver', textColor: 'text-tier-silver' },
  { name: 'Gold', minPoints: 250, color: 'bg-tier-gold', textColor: 'text-tier-gold' },
  { name: 'Platinum', minPoints: 500, color: 'bg-tier-platinum', textColor: 'text-tier-platinum' },
];

export const TierJourneyBar = ({ currentTier, totalPoints, verifiedSkills }: TierJourneyBarProps) => {
  const currentTierIndex = tiers.findIndex(t => t.name.toLowerCase() === currentTier.toLowerCase());
  const nextTier = tiers[currentTierIndex + 1];
  
  const currentTierData = tiers[currentTierIndex] || tiers[0];
  const pointsInCurrentTier = totalPoints - currentTierData.minPoints;
  const pointsToNextTier = nextTier ? nextTier.minPoints - currentTierData.minPoints : 0;
  const progress = nextTier ? Math.min((pointsInCurrentTier / pointsToNextTier) * 100, 100) : 100;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-lg animate-fade-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Career Journey
        </h2>
        <span className="text-sm text-muted-foreground">
          {verifiedSkills} verified skills
        </span>
      </div>

      {/* Tier progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${currentTierData.textColor}`}>
            <div className={`w-3 h-3 rounded-full ${currentTierData.color}`} />
            <span className="font-semibold">{currentTierData.name}</span>
          </div>
          {nextTier && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${nextTier.textColor} opacity-60`}>
                <div className={`w-3 h-3 rounded-full ${nextTier.color}`} />
                <span className="font-semibold">{nextTier.name}</span>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <Progress value={progress} className="h-3 bg-muted" />
          <div 
            className={`absolute top-0 left-0 h-3 rounded-full ${currentTierData.color} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {totalPoints} points
          </span>
          {nextTier && (
            <span className="text-muted-foreground">
              {nextTier.minPoints - totalPoints} points to {nextTier.name}
            </span>
          )}
        </div>
      </div>

      {/* Tier milestones */}
      <div className="mt-6 flex justify-between">
        {tiers.map((tier, idx) => (
          <div key={tier.name} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${idx <= currentTierIndex ? tier.color + ' text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}
              `}
            >
              {idx + 1}
            </div>
            <span className={`text-xs mt-1 ${idx <= currentTierIndex ? tier.textColor : 'text-muted-foreground'}`}>
              {tier.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
