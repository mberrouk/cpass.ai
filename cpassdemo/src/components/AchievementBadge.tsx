import { Award, Star, Trophy, Zap, Target, Shield } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  type: 'skills' | 'experience' | 'certification' | 'milestone' | 'excellence' | 'verified';
  earned?: boolean;
  earnedDate?: string;
  index?: number;
}

const badgeConfig = {
  skills: { icon: Star, color: 'from-amber-400 to-orange-500' },
  experience: { icon: Zap, color: 'from-blue-400 to-cyan-500' },
  certification: { icon: Shield, color: 'from-emerald-400 to-green-500' },
  milestone: { icon: Target, color: 'from-purple-400 to-pink-500' },
  excellence: { icon: Trophy, color: 'from-yellow-400 to-amber-500' },
  verified: { icon: Award, color: 'from-primary to-secondary' },
};

export const AchievementBadge = ({
  title,
  description,
  type,
  earned = true,
  earnedDate,
  index = 0,
}: AchievementBadgeProps) => {
  const config = badgeConfig[type] || badgeConfig.milestone;
  const Icon = config.icon;

  return (
    <div 
      className={`group relative p-4 rounded-xl border transition-all duration-300 animate-scale-in
        ${earned 
          ? 'bg-card border-border hover:shadow-glow-accent hover:-translate-y-1' 
          : 'bg-muted/30 border-border/50 opacity-50'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} 
            flex items-center justify-center shadow-lg ${earned ? '' : 'grayscale'}
          `}
        >
          <Icon className="w-7 h-7 text-primary-foreground" />
          {earned && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
          {earned && earnedDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Earned {new Date(earnedDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Shine effect on hover */}
      {earned && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      )}
    </div>
  );
};
