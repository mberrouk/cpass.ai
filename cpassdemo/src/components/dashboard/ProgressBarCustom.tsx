import { cn } from '@/lib/utils';

interface ProgressBarCustomProps {
  current: number;
  total: number;
  color?: 'primary' | 'success' | 'warning' | 'gold' | 'bronze' | 'silver' | 'platinum';
  showFraction?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorConfig = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  gold: 'bg-tier-gold',
  bronze: 'bg-tier-bronze',
  silver: 'bg-tier-silver',
  platinum: 'bg-tier-platinum',
};

const sizeConfig = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBarCustom({
  current,
  total,
  color = 'primary',
  showFraction = false,
  showPercentage = false,
  size = 'md',
  className,
}: ProgressBarCustomProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeConfig[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorConfig[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {(showFraction || showPercentage) && (
        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
          {showFraction && <span>{current}/{total}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
    </div>
  );
}
