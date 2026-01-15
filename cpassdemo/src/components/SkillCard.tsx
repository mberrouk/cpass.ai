import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Star } from "lucide-react";

interface SkillCardProps {
  name: string;
  category?: string;
  proficiencyLevel?: string;
  yearsExperience?: number | string;
  verified?: boolean;
  verifiedAt?: string;
  index?: number;
}

const getProficiencyColor = (level?: string) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'bg-tier-gold/20 text-tier-gold border-tier-gold/30';
    case 'advanced': return 'bg-primary/20 text-primary border-primary/30';
    case 'intermediate': return 'bg-secondary/20 text-secondary-foreground border-secondary/30';
    case 'beginner': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const SkillCard = ({
  name,
  category,
  proficiencyLevel,
  yearsExperience,
  verified,
  verifiedAt,
  index = 0,
}: SkillCardProps) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Verified indicator */}
      {verified && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          {category && (
            <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {proficiencyLevel && (
            <Badge variant="outline" className={`text-xs ${getProficiencyColor(proficiencyLevel)}`}>
              <Star className="w-3 h-3 mr-1" />
              {proficiencyLevel}
            </Badge>
          )}
          {yearsExperience !== undefined && (
            <Badge variant="outline" className="text-xs bg-muted/50">
              <Clock className="w-3 h-3 mr-1" />
              {typeof yearsExperience === 'string' ? yearsExperience : `${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'}`}
            </Badge>
          )}
        </div>

        {verified && verifiedAt && (
          <p className="text-xs text-muted-foreground">
            Verified {new Date(verifiedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
