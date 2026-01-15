import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedSkillCardProps {
  skillName: string;
  category?: string;
  domain?: string;
  skillType?: string;
  onClick?: () => void;
  index?: number;
}

export function LockedSkillCard({
  skillName,
  category,
  domain,
  skillType,
  onClick,
  index = 0,
}: LockedSkillCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-muted/30 border border-dashed border-border p-4 transition-all duration-300 hover:border-primary/30',
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Lock icon */}
      <div className="absolute top-3 right-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Skill info */}
      <div className="flex items-start gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <span className="font-display font-medium text-muted-foreground line-clamp-2">
          {skillName}
        </span>
      </div>

      {/* Domain tag */}
      {(domain || category) && (
        <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground mb-3">
          {domain || category}
        </Badge>
      )}

      {/* Target info */}
      <div className="space-y-1 text-xs text-muted-foreground mb-3">
        <p className="font-medium">Target Level:</p>
        <p>Complete tasks in this area to unlock</p>
      </div>

      {/* Action button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground hover:text-primary"
        onClick={onClick}
      >
        Learn More →
      </Button>

      {/* Locked overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/40 opacity-50 pointer-events-none" />
    </div>
  );
}
