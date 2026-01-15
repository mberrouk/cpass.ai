import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { Badge } from '@/components/ui/badge';
import { MapPin, Share2, ChevronRight, Leaf, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  fullName: string;
  avatarUrl?: string;
  location?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  monthsOnPlatform: number;
  domains?: string[];
  onShareClick?: () => void;
  onLearnTiersClick?: () => void;
}

const tierSteps = [
  { tier: 'bronze' as const, label: 'Bronze', emoji: '🥉' },
  { tier: 'silver' as const, label: 'Silver', emoji: '🥈' },
  { tier: 'gold' as const, label: 'Gold', emoji: '🥇' },
  { tier: 'platinum' as const, label: 'Platinum', emoji: '🏆' },
];

export function DashboardHeader({
  fullName,
  avatarUrl,
  location,
  tier,
  monthsOnPlatform,
  domains = [],
  onShareClick,
  onLearnTiersClick,
}: DashboardHeaderProps) {
  const initials = fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'W';
  const currentTierIndex = tierSteps.findIndex(t => t.tier === tier);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-tier-gold/80 p-6 text-primary-foreground">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-white/30">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-bold">{fullName}</h1>
                <TierBadge tier={tier} size="sm" />
              </div>
              {location && (
                <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                  <MapPin className="w-3 h-3" /> {location}
                </p>
              )}
              <p className="text-white/70 text-sm mt-0.5">
                Building credentials for {monthsOnPlatform} month{monthsOnPlatform !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={onShareClick}
          >
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
        </div>

        {/* Domain tags */}
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {domains.map((domain, i) => (
              <Badge key={i} variant="outline" className="bg-white/10 border-white/30 text-white">
                {domain.includes('Crop') ? <Leaf className="w-3 h-3 mr-1" /> : <Package className="w-3 h-3 mr-1" />}
                {domain}
              </Badge>
            ))}
          </div>
        )}

        {/* Tier journey */}
        <div className="mt-4">
          <p className="text-sm text-white/80 mb-2">Your Journey:</p>
          <div className="flex items-center gap-2">
            {tierSteps.map((step, i) => {
              const isCompleted = i < currentTierIndex;
              const isCurrent = i === currentTierIndex;
              const isNext = i === currentTierIndex + 1;
              
              return (
                <div key={step.tier} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    isCompleted ? 'bg-white/30 text-white' :
                    isCurrent ? 'bg-white text-primary' :
                    'bg-white/10 text-white/60'
                  )}>
                    <span>{step.emoji}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < tierSteps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-1 text-white/50" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Progress text */}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
            {tierSteps.map((step, i) => {
              const isCompleted = i < currentTierIndex;
              const isCurrent = i === currentTierIndex;
              
              if (isCompleted) {
                return <span key={step.tier}>{step.label} (Completed)</span>;
              }
              if (isCurrent) {
                return <span key={step.tier} className="text-white font-medium">→ {step.label} (You are here)</span>;
              }
              if (i === currentTierIndex + 1) {
                return <span key={step.tier}>→ {step.label} (+Certification)</span>;
              }
              return null;
            })}
          </div>
        </div>

        {/* Learn about tiers link */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-white hover:bg-white/20 p-0 h-auto"
          onClick={onLearnTiersClick}
        >
          Learn About Tier Progression <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
