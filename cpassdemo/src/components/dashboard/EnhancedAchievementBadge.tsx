import { ProgressBarCustom } from './ProgressBarCustom';
import { Trophy, BookOpen, Star, CheckCircle2, TrendingUp, Sprout, Diamond, Target, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedAchievementBadgeProps {
  id: string;
  name: string;
  description?: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  color?: string;
  earnedDate?: string;
  index?: number;
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  books: BookOpen,
  star: Star,
  checkmark: CheckCircle2,
  graph: TrendingUp,
  sprout: Sprout,
  diamond: Diamond,
  target: Target,
  crown: Crown,
};

const colorMap: Record<string, string> = {
  orange: 'bg-warning/20 text-warning border-warning/30',
  purple: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  gray: 'bg-muted text-muted-foreground border-border',
  gold: 'bg-tier-gold/20 text-tier-gold border-tier-gold/30',
  dark: 'bg-foreground/10 text-muted-foreground border-foreground/20',
};

export function EnhancedAchievementBadge({
  id,
  name,
  description,
  icon,
  unlocked,
  progress,
  color = 'gray',
  earnedDate,
  index = 0,
}: EnhancedAchievementBadgeProps) {
  const IconComponent = iconMap[icon] || Trophy;
  const colorClass = unlocked ? colorMap[color] : colorMap.dark;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-300',
        unlocked ? 'hover:shadow-md hover:-translate-y-1' : 'opacity-75',
        colorClass,
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Lock icon for locked badges */}
      {!unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          unlocked ? colorClass : 'bg-muted'
        )}>
          <IconComponent className={cn('w-6 h-6', unlocked ? '' : 'text-muted-foreground')} />
        </div>
      </div>

      {/* Name */}
      <h4 className={cn(
        'font-display font-semibold text-center text-sm',
        unlocked ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {name}
      </h4>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground text-center mt-1">{description}</p>
      )}

      {/* Progress bar for locked badges */}
      {!unlocked && progress !== undefined && (
        <div className="mt-3">
          <ProgressBarCustom
            current={Math.round(progress * 100)}
            total={100}
            showPercentage
            size="sm"
          />
        </div>
      )}

      {/* Earned date for unlocked badges */}
      {unlocked && earnedDate && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Earned {new Date(earnedDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
