import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBarCustom } from './ProgressBarCustom';
import { CheckCircle2, AlertCircle, Briefcase, ExternalLink, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobCardProps {
  jobTitle: string;
  iscoCode?: string;
  skillsMatched: number;
  skillsRequired: number;
  missingSkills?: string[];
  relevantCertifications?: { name: string; readyPercentage: number }[];
  onClick?: () => void;
  onFindPositions?: () => void;
  index?: number;
}

const getMatchColor = (percentage: number) => {
  if (percentage >= 100) return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/50' };
  if (percentage >= 80) return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/50' };
  if (percentage >= 60) return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/50' };
  return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
};

export function JobCard({
  jobTitle,
  iscoCode,
  skillsMatched,
  skillsRequired,
  missingSkills = [],
  relevantCertifications = [],
  onClick,
  onFindPositions,
  index = 0,
}: JobCardProps) {
  const percentage = skillsRequired > 0 ? Math.round((skillsMatched / skillsRequired) * 100) : 0;
  const matchColors = getMatchColor(percentage);
  const isReady = percentage >= 100;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300',
        matchColors.border,
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={cn('p-1.5 sm:p-2 rounded-lg', matchColors.bg)}>
            <Briefcase className={cn('w-4 h-4 sm:w-5 sm:h-5', matchColors.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-semibold text-foreground text-base sm:text-lg truncate">{jobTitle}</h4>
            {iscoCode && (
              <p className="text-xs sm:text-sm text-muted-foreground">ISCO Code: {iscoCode}</p>
            )}
          </div>
        </div>
        <Badge className={cn('text-base sm:text-lg font-bold px-2 sm:px-3 py-1 shrink-0', matchColors.bg, matchColors.text)}>
          {percentage}%
        </Badge>
      </div>

      {/* Progress */}
      <ProgressBarCustom
        current={skillsMatched}
        total={skillsRequired}
        color={isReady ? 'success' : percentage >= 80 ? 'primary' : 'warning'}
        showFraction
        size="lg"
        className="mb-3 sm:mb-4"
      />

      {/* Status message */}
      <div className="mb-3 sm:mb-4">
        {isReady ? (
          <div className="flex items-start sm:items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">You're ready to apply!</p>
              <p className="text-xs sm:text-sm">You have all the required skills for this position.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start sm:items-center gap-2 text-warning">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">Almost ready! {skillsRequired - skillsMatched} skills away</p>
            </div>
          </div>
        )}
      </div>

      {/* Missing skills */}
      {!isReady && missingSkills.length > 0 && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-xs sm:text-sm font-medium text-foreground mb-2">Skills missing:</p>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            {missingSkills.slice(0, 3).map((skill, i) => (
              <li key={i}>• {skill}</li>
            ))}
            {missingSkills.length > 3 && (
              <li className="text-xs">And {missingSkills.length - 3} more...</li>
            )}
          </ul>
        </div>
      )}

      {/* Relevant certifications */}
      {relevantCertifications.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2">
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Certifications that help:</span>
          </div>
          <div className="space-y-1">
            {relevantCertifications.map((cert, i) => (
              <p key={i} className="text-xs sm:text-sm">
                • {cert.name} ({cert.readyPercentage}% ready)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={onClick}>
          <span className="truncate">View Full Requirements</span> <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
        </Button>
        <Button size="sm" className="flex-1 text-xs sm:text-sm" onClick={onFindPositions}>
          <span className="truncate">Find Open Positions</span> <span className="ml-1 shrink-0">→</span>
        </Button>
      </div>
    </div>
  );
}
