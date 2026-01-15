import { cn } from '@/lib/utils';

interface TrustScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-tier-gold';
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const getScoreStatus = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Building';
  return 'Starting';
};

const sizeConfig = {
  sm: { size: 80, stroke: 6, text: 'text-lg' },
  md: { size: 120, stroke: 8, text: 'text-2xl' },
  lg: { size: 160, stroke: 10, text: 'text-3xl' },
};

export function TrustScoreGauge({ score, size = 'md', showLabel = true }: TrustScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.size - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          className="transform -rotate-90"
          width={config.size}
          height={config.size}
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            strokeWidth={config.stroke}
            stroke="currentColor"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            strokeWidth={config.stroke}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            className={cn(colorClass, 'transition-all duration-1000 ease-out')}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display font-bold', config.text, colorClass)}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn('font-medium', colorClass)}>{getScoreStatus(score)} Standing</p>
        </div>
      )}
    </div>
  );
}
