import { cn } from '@/lib/utils';
import { Medal, Award, Trophy, Diamond } from 'lucide-react';

interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  bronze: {
    icon: Medal,
    label: 'Bronze',
    emoji: '🥉',
    bgClass: 'bg-tier-bronze/10',
    borderClass: 'border-tier-bronze',
    textClass: 'text-tier-bronze',
  },
  silver: {
    icon: Medal,
    label: 'Silver',
    emoji: '🥈',
    bgClass: 'bg-tier-silver/10',
    borderClass: 'border-tier-silver',
    textClass: 'text-tier-silver',
  },
  gold: {
    icon: Trophy,
    label: 'Gold',
    emoji: '🥇',
    bgClass: 'bg-tier-gold/10',
    borderClass: 'border-tier-gold',
    textClass: 'text-tier-gold',
  },
  platinum: {
    icon: Diamond,
    label: 'Platinum',
    emoji: '🏆',
    bgClass: 'bg-tier-platinum/10',
    borderClass: 'border-tier-platinum',
    textClass: 'text-tier-platinum',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function TierBadge({ tier, size = 'md', showLabel = true }: TierBadgeProps) {
  const config = tierConfig[tier];
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 font-medium',
        config.bgClass,
        config.borderClass,
        config.textClass,
        sizeConfig[size]
      )}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
