import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const getLevelFromRating = (rating: number): string => {
  if (rating >= 9) return 'Expert';
  if (rating >= 7) return 'Advanced';
  if (rating >= 4) return 'Intermediate';
  if (rating >= 2) return 'Beginner';
  return 'Foundation';
};

export function StarRating({ rating, maxRating = 5, size = 'md', showLabel = false }: StarRatingProps) {
  // Convert 1-10 rating to 1-5 stars
  const normalizedRating = Math.round((rating / 10) * maxRating);
  const iconSize = sizeConfig[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              iconSize,
              i < normalizedRating
                ? 'fill-tier-gold text-tier-gold'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">
          {getLevelFromRating(rating)}
        </span>
      )}
    </div>
  );
}
