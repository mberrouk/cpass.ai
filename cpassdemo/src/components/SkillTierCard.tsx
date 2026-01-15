import { cn } from '@/lib/utils';
import { TierBadge } from './TierBadge';
import { CheckCircle2, Star, Users, Calendar } from 'lucide-react';

type TierType = 'bronze' | 'silver' | 'gold' | 'platinum';

interface SkillTierCardProps {
  skillName: string;
  tier: TierType | string;
  proficiencyRating?: number;
  frequency?: string;
  yearsExperience?: string | number;
  verificationSource?: string;
  verifiedBy?: string;
  credibilityScore?: number;
  platformName?: string;
  taskCount?: number;
  avgRating?: number;
  lastPracticed?: string;
  attestations?: number;
  certificationReady?: string[];
  isFoundation?: boolean;
}

export function SkillTierCard({
  skillName,
  tier,
  proficiencyRating,
  frequency,
  yearsExperience,
  verificationSource,
  verifiedBy,
  credibilityScore,
  platformName,
  taskCount,
  avgRating,
  lastPracticed,
  attestations,
  certificationReady,
  isFoundation,
}: SkillTierCardProps) {
  const getProficiencyLabel = (rating: number) => {
    if (rating <= 3) return 'Beginner';
    if (rating <= 6) return 'Intermediate';
    if (rating <= 9) return 'Advanced';
    return 'Expert';
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      several_weekly: 'Several times/week',
      weekly: 'Weekly',
      monthly: 'Monthly',
      seasonal: 'Seasonally',
      rarely: 'Rarely',
    };
    return labels[freq] || freq;
  };

  const normalizedTier = (tier?.toLowerCase() || 'bronze') as TierType;

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 space-y-3 transition-all hover:shadow-md',
      normalizedTier === 'platinum' && 'border-tier-platinum bg-tier-platinum/5',
      normalizedTier === 'gold' && 'border-tier-gold bg-tier-gold/5',
      normalizedTier === 'silver' && 'border-tier-silver bg-tier-silver/5',
      normalizedTier === 'bronze' && 'border-tier-bronze bg-tier-bronze/5',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{skillName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {verificationSource || 'Self-reported'}
            {isFoundation && <span className="text-primary">• Foundation</span>}
          </p>
        </div>
        <TierBadge tier={normalizedTier} size="sm" showLabel={false} />
      </div>

      {/* Stats */}
      <div className="space-y-2 text-sm">
        {proficiencyRating && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Proficiency:</span>
            <span className="font-medium">{proficiencyRating}/10 ({getProficiencyLabel(proficiencyRating)})</span>
          </div>
        )}
        
        {frequency && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frequency:</span>
            <span className="font-medium">{getFrequencyLabel(frequency)}</span>
          </div>
        )}

        {yearsExperience && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Experience:</span>
            <span className="font-medium">
              {typeof yearsExperience === 'number' ? `${yearsExperience}+ years` : yearsExperience}
            </span>
          </div>
        )}

        {platformName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform:</span>
            <span className="font-medium">{platformName}</span>
          </div>
        )}

        {taskCount !== undefined && taskCount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasks Completed:</span>
            <span className="font-medium">{taskCount}</span>
          </div>
        )}

        {avgRating && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Rating:</span>
            <span className="font-medium flex items-center gap-1">
              {avgRating}/5 <Star className="w-3 h-3 fill-tier-gold text-tier-gold" />
            </span>
          </div>
        )}

        {lastPracticed && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Performed:</span>
            <span className="font-medium">{lastPracticed}</span>
          </div>
        )}

        {attestations !== undefined && attestations > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attestations:</span>
            <span className="font-medium flex items-center gap-1">
              <Users className="w-3 h-3" /> {attestations} supervisors
            </span>
          </div>
        )}
      </div>

      {/* Verified by section */}
      {verifiedBy && normalizedTier !== 'bronze' && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Verified by:</p>
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span>{verifiedBy}</span>
          </div>
        </div>
      )}

      {/* Credibility score */}
      {credibilityScore !== undefined && (
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Credibility:</span>
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-sm font-bold',
              credibilityScore >= 80 && 'text-success',
              credibilityScore >= 60 && credibilityScore < 80 && 'text-warning',
              credibilityScore < 60 && 'text-muted-foreground',
            )}>
              {credibilityScore}/100
            </span>
            {credibilityScore >= 90 && (
              <span className="text-xs">⭐⭐⭐⭐⭐</span>
            )}
          </div>
        </div>
      )}

      {/* Certification ready */}
      {certificationReady && certificationReady.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Certification Ready:</p>
          {certificationReady.map((cert, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="w-3 h-3" />
              <span>{cert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
