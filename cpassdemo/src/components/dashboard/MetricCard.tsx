import { cn } from '@/lib/utils';
import { TrustScoreGauge } from './TrustScoreGauge';
import { ProgressBarCustom } from './ProgressBarCustom';
import { StarRating } from './StarRating';
import { Trophy, CheckCircle2, Star } from 'lucide-react';

interface MetricCardProps {
  type: 'trust-score' | 'verified-work' | 'proficiency';
  value: number;
  tier?: string;
  skillsCount?: number;
  taskCount?: number;
  avgMonths?: number;
  expertCount?: number;
  advancedCount?: number;
}

export function MetricCard({
  type,
  value,
  tier,
  skillsCount = 0,
  taskCount = 0,
  avgMonths = 0,
  expertCount = 0,
  advancedCount = 0,
}: MetricCardProps) {
  if (type === 'trust-score') {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn(
            'w-2 h-2 rounded-full',
            tier === 'gold' ? 'bg-tier-gold' :
            tier === 'platinum' ? 'bg-tier-platinum' :
            tier === 'silver' ? 'bg-tier-silver' : 'bg-tier-bronze'
          )} />
          <span className="capitalize">{tier} Trust Score</span>
        </div>
        
        <TrustScoreGauge score={value} size="md" showLabel />
        
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 text-tier-gold" />
            <span>Top 5% of {tier} workers</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'verified-work') {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Work</span>
        </div>
        
        <div className="text-center py-2">
          <p className="text-3xl font-display font-bold text-foreground">{taskCount} tasks</p>
          <p className="text-sm text-muted-foreground">
            Self-reported • {avgMonths}-month avg
          </p>
        </div>
        
        <ProgressBarCustom
          current={taskCount}
          total={540}
          color="primary"
          size="sm"
        />
        
        <div className="space-y-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <p>Compare:</p>
          <p>Silver avg 120+ • Gold avg 540+</p>
          <p className="text-primary">At Silver: Multi-source verification unlocks</p>
        </div>
      </div>
    );
  }

  // proficiency
  const avgRating = value;
  const profLevel = avgRating >= 9 ? 'Expert' : avgRating >= 7 ? 'Advanced' : avgRating >= 4 ? 'Intermediate' : 'Foundation';
  
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4" />
        <span>Proficiency Level</span>
      </div>
      
      <div className="text-center py-2">
        <p className="text-3xl font-display font-bold text-foreground">{profLevel}</p>
        <p className="text-sm text-muted-foreground">
          {skillsCount} skills documented • Professional
        </p>
      </div>
      
      <div className="flex justify-center">
        <StarRating rating={avgRating} size="lg" />
      </div>
      
      <div className="space-y-1 pt-2 border-t border-border text-sm">
        <p className="text-muted-foreground">{expertCount} Expert • {advancedCount} Advanced</p>
        <div className="flex items-center gap-1 text-success">
          <CheckCircle2 className="w-4 h-4" />
          <span>Advanced/Expert unlocked at Gold!</span>
        </div>
      </div>
    </div>
  );
}
