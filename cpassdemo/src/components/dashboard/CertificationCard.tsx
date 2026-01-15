import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBarCustom } from './ProgressBarCustom';
import { CheckCircle2, AlertCircle, GraduationCap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificationCardProps {
  certName: string;
  certType?: string;
  skillsMatched: number;
  skillsRequired: number;
  missingSkills?: string[];
  onClick?: () => void;
  index?: number;
}

export function CertificationCard({
  certName,
  certType,
  skillsMatched,
  skillsRequired,
  missingSkills = [],
  onClick,
  index = 0,
}: CertificationCardProps) {
  const percentage = skillsRequired > 0 ? (skillsMatched / skillsRequired) * 100 : 0;
  const isReady = percentage >= 100;
  const isClose = percentage >= 80 && percentage < 100;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card border p-4 shadow-sm hover:shadow-md transition-all duration-300',
        isReady ? 'border-success/50' : isClose ? 'border-warning/50' : 'border-border',
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className={cn('w-5 h-5', isReady ? 'text-success' : 'text-muted-foreground')} />
          <div>
            <h4 className="font-display font-semibold text-foreground">{certName}</h4>
            {certType && (
              <p className="text-xs text-muted-foreground">{certType}</p>
            )}
          </div>
        </div>
        {isReady ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <AlertCircle className={cn('w-5 h-5', isClose ? 'text-warning' : 'text-muted-foreground')} />
        )}
      </div>

      {/* Progress */}
      <ProgressBarCustom
        current={skillsMatched}
        total={skillsRequired}
        color={isReady ? 'success' : isClose ? 'warning' : 'primary'}
        showFraction
        size="md"
        className="mb-3"
      />

      {/* Status */}
      <div className="mb-3">
        {isReady ? (
          <Badge className="bg-success/10 text-success border-success/30">
            ✓ Ready!
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {skillsRequired - skillsMatched} more skill{skillsRequired - skillsMatched !== 1 ? 's' : ''} needed
          </span>
        )}
      </div>

      {/* Missing skills preview */}
      {!isReady && missingSkills.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 mb-3">
          {missingSkills.slice(0, 2).map((skill, i) => (
            <p key={i}>• {skill}</p>
          ))}
          {missingSkills.length > 2 && (
            <p>• And {missingSkills.length - 2} more...</p>
          )}
        </div>
      )}

      {/* Action */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={onClick}
      >
        View Requirements <ExternalLink className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}
