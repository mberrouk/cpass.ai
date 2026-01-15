import { useMemo } from 'react';
import { WorkerProfile, WorkerSkill } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { ProgressBarCustom } from '@/components/dashboard/ProgressBarCustom';
import { TimelineEvent } from '@/components/dashboard/TimelineEvent';
import { Shield, CheckCircle2, User, Users, Globe, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTabProps {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
}

export function ProgressTab({ profile, skills }: ProgressTabProps) {
  // Calculate verification stats from actual skills
  const stats = useMemo(() => {
    // Count by verification source
    const selfReported = skills.filter(s => 
      !s.verification_source || 
      s.verification_source === 'self-reported' ||
      s.skill_verification_tier === 'bronze'
    ).length;
    
    const supervisorVerified = skills.filter(s => 
      s.verification_source === 'supervisor-verified' ||
      s.skill_verification_tier === 'silver'
    ).length;
    
    const multiParty = skills.filter(s => 
      s.verification_source === 'multi-party' ||
      s.skill_verification_tier === 'gold'
    ).length;
    
    const external = skills.filter(s => 
      s.verification_source === 'external' || 
      s.verification_source === 'platform-verified' ||
      s.skill_verification_tier === 'platinum'
    ).length;
    
    return {
      total: skills.length,
      selfReported: selfReported || skills.length, // Default all to self-reported if no verification
      supervisorVerified,
      multiParty,
      external,
    };
  }, [skills]);

  // Calculate trust score from actual skill proficiency ratings
  const trustScore = useMemo(() => {
    if (profile?.trust_score) return profile.trust_score;
    if (skills.length === 0) return 0;
    const avgProficiency = skills.reduce((sum, s) => sum + (s.proficiency_rating || 5), 0) / skills.length;
    return Math.round(avgProficiency * 10);
  }, [profile?.trust_score, skills]);

  const tier = (profile?.overall_tier || profile?.tier || 'bronze').toLowerCase();

  // Create timeline events from actual skills
  const timelineEvents = useMemo(() => {
    return skills
      .map(skill => ({
        date: skill.created_at,
        skillName: skill.skill_name,
        verificationSource: skill.verification_source || 'self-reported',
        tierAtTime: skill.skill_verification_tier || 'bronze',
        evidenceDetails: [
          skill.evidence_types?.length ? `Evidence: ${skill.evidence_types.join(', ')}` : 'Task self-reported during onboarding',
          `Proficiency: ${skill.proficiency_rating || 5}/10`,
          skill.years_experience ? `Experience: ${skill.years_experience}` : '',
          skill.frequency ? `Frequency: ${skill.frequency}` : '',
        ].filter(Boolean),
        trustScoreImpact: skill.proficiency_rating || 5,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [skills]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Verification History</h1>
        </div>
        <p className="text-muted-foreground">Complete record of your verified work and skills</p>
      </div>

      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-display font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            value={stats.total}
            label="Total Verified Tasks"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            value={stats.selfReported}
            label="Self-Report"
            icon={<User className="w-5 h-5" />}
          />
          <StatCard
            value={stats.supervisorVerified}
            label="Supervisor"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            value={stats.multiParty}
            label="Multi-Party"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            value={stats.external}
            label="External"
            icon={<Globe className="w-5 h-5" />}
          />
          <StatCard
            value={getTierEmoji(tier)}
            label={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Verified`}
            icon={<Award className="w-5 h-5" />}
            isEmoji
          />
        </div>
      </section>

      {/* Trust Score */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">📈 Trust Score</h2>
          <span className="text-2xl font-bold text-foreground">{trustScore}/100</span>
        </div>
        <ProgressBarCustom
          current={trustScore}
          total={100}
          color={trustScore >= 80 ? 'gold' : trustScore >= 50 ? 'primary' : 'warning'}
          size="lg"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {skills.length > 0 
            ? `Your trust score is calculated from your ${skills.length} verified skills with an average proficiency of ${Math.round(trustScore / 10)}/10.`
            : 'Complete skill assessments to build your trust score.'}
        </p>
      </section>

      {/* Timeline */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">📅</span>
          <h2 className="text-lg font-display font-semibold">Timeline</h2>
        </div>

        {timelineEvents.length > 0 ? (
          <div className="pl-2">
            {timelineEvents.map((event, i) => (
              <TimelineEvent
                key={i}
                date={event.date}
                skillName={event.skillName}
                evidenceDetails={event.evidenceDetails}
                trustScoreImpact={event.trustScoreImpact}
                tierAtTime={event.tierAtTime}
                verificationSource={event.verificationSource}
                isFirst={i === 0}
                isLast={i === timelineEvents.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No verification history yet</h3>
            <p className="text-muted-foreground">
              Complete the signup process and add skills to build your verification history
            </p>
          </div>
        )}
      </section>

      {/* Verification levels explanation */}
      <section className="bg-muted/50 rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Understanding Verification Levels</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <Badge className="bg-tier-bronze/20 text-tier-bronze border-tier-bronze/30">🥉 Bronze</Badge>
            <p className="text-muted-foreground">Self-reported skills during onboarding</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-tier-silver/20 text-tier-silver border-tier-silver/30">🥈 Silver</Badge>
            <p className="text-muted-foreground">Supervisor or peer verification (3+ attestations)</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-tier-gold/20 text-tier-gold border-tier-gold/30">🥇 Gold</Badge>
            <p className="text-muted-foreground">Platform-verified through 20+ completed tasks</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="bg-tier-platinum/20 text-tier-platinum border-tier-platinum/30">🏆 Platinum</Badge>
            <p className="text-muted-foreground">Formal certification from accredited institution</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper to get tier emoji
function getTierEmoji(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'platinum': return '🏆';
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    default: return '🥉';
  }
}

// Stat card component
function StatCard({ 
  value, 
  label, 
  icon,
  isEmoji = false,
}: { 
  value: number | string; 
  label: string; 
  icon: React.ReactNode;
  isEmoji?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2 text-muted-foreground">{icon}</div>
      <p className={cn('font-bold', isEmoji ? 'text-2xl' : 'text-3xl text-foreground')}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
