import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { CheckCircle2, Clock, ExternalLink, Sprout, Leaf, TreeDeciduous, Crown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SkillComplexityLevel, 
  WorkerProficiencyLevel,
  getComplexityLabel,
  getProficiencyLabel,
  getComplexityColorClass,
  getWorkerProficiencyLevel
} from '@/lib/skillComplexity';

interface EnhancedSkillCardProps {
  skillName: string;
  skillType?: string;
  category?: string;
  proficiencyRating: number;
  yearsExperience?: string;
  frequency?: string;
  verified?: boolean;
  verificationCount?: number;
  verificationSource?: string;
  lastPracticed?: string;
  hoursLogged?: number;
  taskCount?: number;
  isFoundation?: boolean;
  complexityLevel?: SkillComplexityLevel;
  onClick?: () => void;
  index?: number;
}

// Get icon for complexity level
const getComplexityIcon = (level: SkillComplexityLevel) => {
  switch (level) {
    case 'foundation': return Sprout;
    case 'beginner': return BookOpen;
    case 'intermediate': return Leaf;
    case 'advanced': return TreeDeciduous;
    case 'expert': return Crown;
  }
};

// Get proficiency badge styling
const getProficiencyBadgeStyle = (level: WorkerProficiencyLevel) => {
  switch (level) {
    case 'expert': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'proficient': return 'bg-success/10 text-success border-success/30';
    case 'competent': return 'bg-warning/10 text-warning border-warning/30';
    case 'learning': return 'bg-muted text-muted-foreground border-border';
  }
};

export function EnhancedSkillCard({
  skillName,
  skillType,
  category,
  proficiencyRating,
  yearsExperience,
  frequency,
  verified,
  verificationCount = 0,
  verificationSource,
  lastPracticed,
  hoursLogged = 0,
  taskCount = 0,
  isFoundation,
  complexityLevel = 'foundation',
  onClick,
  index = 0,
}: EnhancedSkillCardProps) {
  const proficiencyLevel = getWorkerProficiencyLevel(proficiencyRating);
  const ComplexityIcon = getComplexityIcon(complexityLevel);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer',
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
    >
      {/* Header with skill name and verification */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ComplexityIcon className={cn('w-4 h-4', 
            complexityLevel === 'foundation' ? 'text-green-600' :
            complexityLevel === 'beginner' ? 'text-blue-600' :
            complexityLevel === 'intermediate' ? 'text-yellow-600' :
            complexityLevel === 'advanced' ? 'text-orange-600' : 'text-purple-600'
          )} />
          <span className="font-display font-semibold text-foreground line-clamp-2">
            {skillName}
          </span>
        </div>
        {verified && (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        )}
      </div>

      {/* Two-badge system: Complexity (objective) + Proficiency (subjective) */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {/* Skill Complexity Badge (Blue - Objective, inherent to skill) */}
        <Badge variant="outline" className={cn('text-xs', getComplexityColorClass(complexityLevel))}>
          {getComplexityLabel(complexityLevel)} Skill
        </Badge>
        
        {/* Worker Proficiency Badge (Gold - Subjective, personal rating) */}
        <Badge variant="outline" className={cn('text-xs', getProficiencyBadgeStyle(proficiencyLevel))}>
          {getProficiencyLabel(proficiencyLevel)}
        </Badge>
      </div>

      {/* Star rating (worker's self-assessment) */}
      <div className="mb-3">
        <StarRating rating={proficiencyRating} size="sm" />
        <span className="text-xs text-muted-foreground ml-2">
          Your proficiency: {proficiencyRating}/10
        </span>
      </div>

      {/* Verification status */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className={verified ? 'text-success' : ''}>
            {verified ? '●' : '○'} Verified {verificationCount}x
          </span>
          {verificationSource && <span>• {verificationSource}</span>}
        </div>
        {lastPracticed && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last: {lastPracticed}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span>⏱ Hours: {hoursLogged}</span>
        <span>✓ Tasks: {taskCount}</span>
      </div>

      {/* View details link */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full text-xs text-primary hover:text-primary"
      >
        View Details <ExternalLink className="w-3 h-3 ml-1" />
      </Button>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
