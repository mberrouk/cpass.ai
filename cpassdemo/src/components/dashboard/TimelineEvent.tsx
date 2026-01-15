import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimelineEventProps {
  date: string;
  skillName: string;
  evidenceDetails?: string[];
  trustScoreImpact?: number;
  tierAtTime?: string;
  verificationSource?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

const getTierBadgeColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum': return 'bg-tier-platinum/20 text-tier-platinum border-tier-platinum/30';
    case 'gold': return 'bg-tier-gold/20 text-tier-gold border-tier-gold/30';
    case 'silver': return 'bg-tier-silver/20 text-tier-silver border-tier-silver/30';
    default: return 'bg-tier-bronze/20 text-tier-bronze border-tier-bronze/30';
  }
};

const getSourceLabel = (source?: string) => {
  switch (source) {
    case 'self-reported': return '🥉 Self-Report';
    case 'supervisor-verified': return '🥈 Supervisor';
    case 'platform-verified': return '🥇 Platform';
    case 'certification': return '🏆 Certified';
    default: return '🥉 Self-Report';
  }
};

export function TimelineEvent({
  date,
  skillName,
  evidenceDetails = [],
  trustScoreImpact,
  tierAtTime,
  verificationSource,
  isFirst,
  isLast,
}: TimelineEventProps) {
  const formattedDate = new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-3 h-3 rounded-full border-2 bg-background z-10',
          verificationSource === 'self-reported' ? 'border-tier-bronze' :
          verificationSource === 'supervisor-verified' ? 'border-tier-silver' :
          verificationSource === 'platform-verified' ? 'border-tier-gold' :
          'border-tier-bronze'
        )} />
        {!isLast && (
          <div className="w-0.5 h-full bg-border -mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
          <Badge variant="outline" className={getTierBadgeColor(tierAtTime)}>
            {getSourceLabel(verificationSource)}
          </Badge>
        </div>

        {/* Skill name */}
        <h4 className="font-display font-semibold text-foreground mb-2">{skillName}</h4>

        {/* Evidence */}
        {evidenceDetails.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Evidence:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {evidenceDetails.map((detail, i) => (
                <li key={i}>• {detail}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center gap-4 text-sm">
          {trustScoreImpact !== undefined && (
            <span className="text-success">+{trustScoreImpact} Trust Score</span>
          )}
          {tierAtTime && (
            <span className="text-muted-foreground">
              Tier at time: {tierAtTime.charAt(0).toUpperCase() + tierAtTime.slice(1)} Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
