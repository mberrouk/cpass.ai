import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, Phone, Award } from "lucide-react";
import { WorkerProfile } from "@/lib/supabase";

interface ProfileHeaderProps {
  profile: WorkerProfile;
}

const getTierColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum': return 'bg-tier-platinum text-foreground';
    case 'gold': return 'bg-tier-gold text-foreground';
    case 'silver': return 'bg-tier-silver text-foreground';
    case 'bronze': return 'bg-tier-bronze text-primary-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg animate-fade-up">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-lg">
          <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-display font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {profile.full_name}
            </h1>
            {profile.tier && (
              <Badge className={`${getTierColor(profile.tier)} font-semibold`}>
                <Award className="w-3 h-3 mr-1" />
                {profile.tier} Tier
              </Badge>
            )}
          </div>

          {profile.bio && (
            <p className="text-muted-foreground max-w-xl">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {profile.location}
              </span>
            )}
            {profile.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" />
                {profile.phone}
              </span>
            )}
          </div>
        </div>

        {profile.total_points !== undefined && (
          <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="text-3xl font-display font-bold text-primary">
              {profile.total_points?.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Points
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
