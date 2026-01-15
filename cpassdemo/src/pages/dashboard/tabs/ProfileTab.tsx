import { useState, useMemo } from 'react';
import { WorkerProfile, WorkerSkill } from '@/lib/supabase';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CertificationCard } from '@/components/dashboard/CertificationCard';
import { EnhancedSkillCard } from '@/components/dashboard/EnhancedSkillCard';
import { LockedSkillCard } from '@/components/dashboard/LockedSkillCard';
import { EnhancedAchievementBadge } from '@/components/dashboard/EnhancedAchievementBadge';
import PartnerInterestSection from '@/components/worker/PartnerInterestSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Filter, GraduationCap, Sprout, Leaf, TreeDeciduous, Crown, CheckCircle2, Circle, Clock, Building, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSkillIdsForRequirement, hasRequiredSkill } from '@/lib/certificationSkillMapping';
import { 
  getSkillComplexityLevel, 
  getWorkerProficiencyLevel,
  getComplexityLabel,
  SkillComplexityLevel 
} from '@/lib/skillComplexity';

interface ProfileTabProps {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
}

// Skills available for "Skills to Explore" section - uses actual DB skill names
const allAvailableSkills = [
  // Crop Production skills (CP prefix in DB)
  { skill_id: 'CP001', skill_name: 'Watering crops / managing irrigation', domain: 'Crop Production' },
  { skill_id: 'CP002', skill_name: 'Planting seeds or seedlings', domain: 'Crop Production' },
  { skill_id: 'CP003', skill_name: 'Weeding by hand or with tools', domain: 'Crop Production' },
  { skill_id: 'CP004', skill_name: 'Identifying pests and diseases', domain: 'Crop Production' },
  { skill_id: 'CP005', skill_name: 'Spraying pesticides or fertilizers', domain: 'Crop Production' },
  { skill_id: 'CP006', skill_name: 'Preparing land for planting', domain: 'Crop Production' },
  { skill_id: 'CP007', skill_name: 'Pruning and trimming plants', domain: 'Crop Production' },
  { skill_id: 'CP008', skill_name: 'Harvesting crops', domain: 'Crop Production' },
  { skill_id: 'CP009', skill_name: 'Sorting and grading produce', domain: 'Crop Production' },
  { skill_id: 'CP010', skill_name: 'Managing a nursery or seedbed', domain: 'Crop Production' },
  { skill_id: 'CP011', skill_name: 'Greenhouse management', domain: 'Crop Production' },
  { skill_id: 'CP012', skill_name: 'Soil testing and analysis', domain: 'Crop Production' },
  // Livestock skills (LV prefix in DB)
  { skill_id: 'LV001', skill_name: 'Feeding and watering animals', domain: 'Livestock' },
  { skill_id: 'LV002', skill_name: 'Milking dairy cattle', domain: 'Livestock' },
  { skill_id: 'LV003', skill_name: 'Animal health monitoring', domain: 'Livestock' },
  { skill_id: 'LV004', skill_name: 'Breeding management', domain: 'Livestock' },
  { skill_id: 'LV005', skill_name: 'Poultry management', domain: 'Livestock' },
  { skill_id: 'LV006', skill_name: 'Livestock housing maintenance', domain: 'Livestock' },
  { skill_id: 'LV007', skill_name: 'Pasture management', domain: 'Livestock' },
  { skill_id: 'LV008', skill_name: 'Veterinary assistance', domain: 'Livestock' },
];

// Certification definitions with human-readable requirement names
// Requirements are matched to actual skill IDs via certificationSkillMapping.ts
const certificationDefinitions = [
  { 
    certName: 'Level 3 Crop Production (TVET)', 
    certType: 'TVET', 
    description: 'A nationally recognized qualification in crop production covering planting, cultivation, harvesting, and post-harvest handling of various crops.',
    benefits: [
      'Recognized qualification across East Africa',
      'Higher earning potential (20-40% increase)',
      'Pathway to supervisory positions',
      'Foundation for advanced certifications',
    ],
    duration: '6-12 months (part-time)',
    provider: 'Kenya National Qualifications Authority',
    estimatedCost: 'KES 15,000 - 25,000',
    // Human-readable requirements - mapped via certificationSkillMapping.ts
    requirements: [
      'Land preparation',
      'Planting seeds or seedlings',
      'Irrigation management',
      'Pest management',
      'Weeding',
      'Pruning',
      'Harvesting crops',
      'Sorting and grading produce',
      'Greenhouse management',
      'Nursery management',
    ],
    steps: [
      'Complete skills assessment at accredited TVET center',
      'Submit portfolio of work experience evidence',
      'Attend practical assessment sessions',
      'Complete written examination',
      'Receive certification upon passing',
    ],
  },
  { 
    certName: 'Safe Use of Pesticides', 
    certType: 'Safety', 
    description: 'Certification in safe handling, application, and storage of agricultural pesticides and chemicals.',
    benefits: [
      'Required for commercial farm employment',
      'Protects your health and environment',
      'Opens doors to specialized roles',
    ],
    duration: '2-3 days',
    provider: 'Pest Control Products Board (PCPB)',
    estimatedCost: 'KES 3,000 - 5,000',
    requirements: ['Spraying pesticides or fertilizers'],
    steps: [
      'Register for training course',
      'Complete safety training module',
      'Pass practical assessment',
      'Receive certification card',
    ],
  },
  { 
    certName: 'Soil Analysis Technician', 
    certType: 'Technical', 
    description: 'Certification for soil sampling, testing, and analysis interpretation for agricultural applications.',
    benefits: [
      'Demand for precision agriculture skills',
      'Higher pay for technical knowledge',
      'Foundation for agronomist pathway',
    ],
    duration: '1-2 weeks',
    provider: 'Kenya Agricultural and Livestock Research Organization (KALRO)',
    estimatedCost: 'KES 5,000 - 8,000',
    requirements: ['Soil testing and analysis'],
    steps: [
      'Enroll in soil analysis course',
      'Complete laboratory practicals',
      'Pass written and practical exam',
      'Receive technician certificate',
    ],
  },
  { 
    certName: 'Dairy Farm Assistant', 
    certType: 'Vocational', 
    description: 'Certification for dairy farming operations including milking, feeding, and basic animal health.',
    benefits: [
      'High demand in dairy sector',
      'Pathway to farm management',
      'Better employment opportunities',
    ],
    duration: '2-4 weeks',
    provider: 'Kenya Dairy Board',
    estimatedCost: 'KES 8,000 - 12,000',
    requirements: ['Milking dairy cattle', 'Feeding and watering animals', 'Animal health monitoring'],
    steps: [
      'Register with approved training center',
      'Complete practical dairy training',
      'Pass competency assessment',
      'Receive dairy assistant certificate',
    ],
  },
  { 
    certName: 'KenyaGAP Certification', 
    certType: 'Quality Standards', 
    description: 'Kenya Good Agricultural Practices certification for food safety and quality assurance in agricultural production.',
    benefits: [
      'Access to premium export markets',
      'Higher prices for certified produce',
      'Recognized by major buyers and supermarkets',
      'Environmental sustainability credentials',
    ],
    duration: '3-6 months preparation',
    provider: 'Kenya Plant Health Inspectorate Service (KEPHIS)',
    estimatedCost: 'KES 20,000 - 50,000 (varies by farm size)',
    requirements: [
      'Land preparation',
      'Soil testing and analysis',
      'Pest management',
      'Planting seeds or seedlings',
      'Irrigation management',
      'Harvesting crops',
      'Sorting and grading produce',
      'Greenhouse management',
      'Nursery management',
      'Animal health monitoring',
      'Feeding and watering animals',
      'Milking dairy cattle',
      'Breeding management',
    ],
    steps: [
      'Conduct gap analysis of current practices',
      'Implement required improvements',
      'Document all farming activities',
      'Apply for inspection',
      'Pass KEPHIS audit',
      'Receive KenyaGAP certificate',
    ],
  },
];

export function ProfileTab({ profile, skills }: ProfileTabProps) {
  const [skillFilter, setSkillFilter] = useState<'all' | 'soft' | 'hard'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    foundation: true,
    beginner: true,
    intermediate: true,
    advanced: false,
    expert: false,
  });
  const [selectedCertification, setSelectedCertification] = useState<typeof certificationDefinitions[0] | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Calculate months on platform
  const monthsOnPlatform = profile?.created_at 
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  // Group skills by COMPLEXITY (inherent to skill), not proficiency (worker's rating)
  // This prevents gaming - workers can't inflate ratings to appear more advanced
  const groupedSkills = useMemo(() => {
    const skillsWithComplexity = skills.map(skill => ({
      ...skill,
      complexityLevel: getSkillComplexityLevel(skill.skill_id),
      proficiencyLevel: getWorkerProficiencyLevel(skill.proficiency_rating || 5),
    }));
    
    const groups = {
      foundation: skillsWithComplexity.filter(s => s.complexityLevel === 'foundation'),
      beginner: skillsWithComplexity.filter(s => s.complexityLevel === 'beginner'),
      intermediate: skillsWithComplexity.filter(s => s.complexityLevel === 'intermediate'),
      advanced: skillsWithComplexity.filter(s => s.complexityLevel === 'advanced'),
      expert: skillsWithComplexity.filter(s => s.complexityLevel === 'expert'),
    };
    return groups;
  }, [skills]);

  // Calculate trust score from actual skill proficiency ratings
  const trustScore = useMemo(() => {
    if (profile?.trust_score) return profile.trust_score;
    if (skills.length === 0) return 0;
    const avgProficiency = skills.reduce((sum, s) => sum + (s.proficiency_rating || 5), 0) / skills.length;
    return Math.round(avgProficiency * 10);
  }, [profile?.trust_score, skills]);
  
  const avgProficiency = skills.length > 0 
    ? Math.round(skills.reduce((sum, s) => sum + (s.proficiency_rating || 5), 0) / skills.length)
    : 0;
  const expertCount = groupedSkills.expert.length;
  const advancedCount = groupedSkills.advanced.length;
  const tier = (profile?.overall_tier || profile?.tier || 'bronze').toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum';

  // Calculate certifications with actual skill matches using the mapping layer
  // Uses hasRequiredSkill() to translate requirement names to actual skill IDs
  const certificationsWithProgress = useMemo(() => {
    return certificationDefinitions.map(cert => {
      // Check each requirement using the mapping layer
      const requiredSkillsWithStatus = cert.requirements.map(reqName => {
        const matchedSkillIds = getSkillIdsForRequirement(reqName);
        const owned = hasRequiredSkill(reqName, skills);
        return {
          name: reqName,
          owned,
          matchedSkillIds,
        };
      });
      
      const skillsMatched = requiredSkillsWithStatus.filter(req => req.owned).length;
      const skillsRequired = cert.requirements.length;
      const missingSkills = requiredSkillsWithStatus
        .filter(req => !req.owned)
        .map(req => req.name);
      
      return {
        ...cert,
        skillsMatched,
        skillsRequired,
        missingSkills,
        requiredSkillsWithStatus,
      };
    }).sort((a, b) => (b.skillsMatched / b.skillsRequired) - (a.skillsMatched / a.skillsRequired));
  }, [skills]);

  // Skills to explore (skills not yet owned)
  const skillsToExplore = useMemo(() => {
    const ownedSkillIds = skills.map(s => s.skill_id);
    return allAvailableSkills.filter(skill => !ownedSkillIds.includes(skill.skill_id));
  }, [skills]);

  // Calculate achievements
  const achievements = useMemo(() => [
    { id: 'first_steps', name: 'First Steps', description: 'Complete your first skill verification', icon: 'trophy', unlocked: skills.length > 0, color: 'orange' },
    { id: 'skill_collector', name: 'Skill Collector', description: 'Get 10 skills verified', icon: 'books', unlocked: skills.length >= 10, color: 'orange' },
    { id: 'expert', name: 'Expert', description: 'Achieve expert level in any skill', icon: 'star', unlocked: expertCount > 0, color: 'purple' },
    { id: 'verified_worker', name: 'Verified Worker', description: 'Get supervisor verification', icon: 'checkmark', unlocked: skills.some(s => s.verification_source === 'supervisor-verified'), color: 'gray' },
    { id: 'rising_star', name: 'Rising Star', description: 'Reach Gold tier', icon: 'graph', unlocked: tier === 'gold' || tier === 'platinum', color: 'gray' },
    { id: 'foundation_complete', name: 'Foundation Complete', description: 'Master all foundation skills', icon: 'sprout', unlocked: false, progress: groupedSkills.foundation.length / 46, color: 'dark' },
    { id: 'skill_master', name: 'Skill Master', description: 'Master 50 skills', icon: 'diamond', unlocked: false, progress: skills.length / 50, color: 'dark' },
    { id: 'crop_specialist', name: 'Crop Production Specialist', description: 'Master crop production skills', icon: 'target', unlocked: false, progress: 0.3, color: 'dark' },
    { id: 'crop_expert', name: 'Crop Production Expert', description: 'Become a domain expert', icon: 'crown', unlocked: false, progress: 0.1, color: 'dark' },
  ], [skills, expertCount, tier, groupedSkills]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleViewCertification = (cert: typeof certificationDefinitions[0]) => {
    setSelectedCertification(cert);
    setShowCertModal(true);
  };

  const renderSkillSection = (
    level: SkillComplexityLevel,
    skillsList: (WorkerSkill & { complexityLevel: SkillComplexityLevel })[],
    icon: React.ReactNode,
    colorClass: string,
    description: string
  ) => (
    <Collapsible open={expandedSections[level]} onOpenChange={() => toggleSection(level)}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-left">
              <span className="font-display font-semibold capitalize">{level} Skills</span>
              <span className="text-xs text-muted-foreground ml-2">{description}</span>
            </div>
            <Badge variant="secondary" className="ml-2">{skillsList.length}</Badge>
          </div>
          {expandedSections[level] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {skillsList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {skillsList.slice(0, 3).map((skill, i) => (
                <EnhancedSkillCard
                  key={skill.id}
                  skillName={skill.skill_name}
                  skillType={skill.proficiency_level || 'Hard Skill'}
                  proficiencyRating={skill.proficiency_rating || 5}
                  yearsExperience={skill.years_experience}
                  verified={!!skill.verification_source}
                  verificationCount={skill.supervisor_attestations || 1}
                  verificationSource={skill.verification_source || 'external'}
                  lastPracticed={skill.last_practiced_date || new Date().toLocaleDateString()}
                  complexityLevel={skill.complexityLevel}
                  index={i}
                />
              ))}
            </div>
            {skillsList.length > 3 && (
              <Button variant="link" className="mt-2 text-sm">
                + {skillsList.length - 3} more {level} skills
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground mt-4 pl-3">No {level} skills yet. Complete tasks to add skills!</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        fullName={profile?.full_name || 'Worker'}
        avatarUrl={profile?.avatar_url}
        location={profile?.location}
        tier={tier}
        monthsOnPlatform={monthsOnPlatform}
        domains={['Crop Production', 'Post-Harvest & Processing']}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard type="trust-score" value={trustScore} tier={tier} />
        <MetricCard type="verified-work" value={skills.reduce((sum, s) => sum + (s.platform_task_count || 0), 0)} taskCount={skills.length} avgMonths={monthsOnPlatform} />
        <MetricCard 
          type="proficiency" 
          value={avgProficiency} 
          skillsCount={skills.length} 
          expertCount={expertCount}
          advancedCount={advancedCount}
        />
      </div>

      {/* Partner Interest Notifications */}
      {profile?.id && <PartnerInterestSection workerId={profile.id} />}

      {/* Certifications Ready For - only show 100% complete */}
      {skills.length > 0 && certificationsWithProgress.filter(c => c.skillsMatched >= c.skillsRequired).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-success" />
            <h2 className="text-xl font-display font-bold">Certifications You're Ready For</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificationsWithProgress
              .filter(cert => cert.skillsMatched >= cert.skillsRequired)
              .map((cert, i) => (
                <CertificationCard
                  key={cert.certName}
                  certName={cert.certName}
                  certType={cert.certType}
                  skillsMatched={cert.skillsMatched}
                  skillsRequired={cert.skillsRequired}
                  onClick={() => handleViewCertification(cert)}
                  index={i}
                />
              ))}
          </div>
        </section>
      )}

      {/* Certifications In Progress - only show pathways where worker has at least 1 matching skill */}
      {(() => {
        const pathwaysInProgress = certificationsWithProgress.filter(
          cert => cert.skillsMatched > 0 && cert.skillsMatched < cert.skillsRequired
        );
        const readyCerts = certificationsWithProgress.filter(c => c.skillsMatched >= c.skillsRequired);
        
        if (pathwaysInProgress.length > 0) {
          return (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold">
                  {readyCerts.length > 0 ? 'Certifications In Progress' : 'Certification Pathways'}
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {pathwaysInProgress.length} in progress
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Build your skills to unlock these certifications
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pathwaysInProgress.map((cert, i) => (
                  <CertificationCard
                    key={cert.certName}
                    certName={cert.certName}
                    certType={cert.certType}
                    skillsMatched={cert.skillsMatched}
                    skillsRequired={cert.skillsRequired}
                    missingSkills={cert.missingSkills}
                    onClick={() => handleViewCertification(cert)}
                    index={i}
                  />
                ))}
              </div>
              <Button variant="link" className="mt-2">View All Certifications →</Button>
            </section>
          );
        } else if (skills.length === 0) {
          return (
            <section className="py-8 text-center bg-muted/30 rounded-xl">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Certification Pathways</h3>
              <p className="text-muted-foreground mb-4">
                Add skills to your profile to see which certifications you're working toward
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/signup/task-selection'}>
                Add Skills to Profile
              </Button>
            </section>
          );
        } else {
          // Worker has skills but none match any certification pathways
          return (
            <section className="py-8 text-center bg-muted/30 rounded-xl">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Explore Certification Pathways</h3>
              <p className="text-muted-foreground mb-4">
                Your current skills don't match any certification requirements yet. Add more skills to discover pathways.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/signup/task-selection'}>
                Add More Skills
              </Button>
            </section>
          );
        }
      })()}

      {/* Skill Highlights */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h2 className="text-xl font-display font-bold">Your Skill Highlights</h2>
          </div>
          <Badge variant="secondary">{skills.length} skills</Badge>
        </div>
        
        <div className="space-y-4">
          {renderSkillSection('foundation', groupedSkills.foundation, <Sprout className="w-4 h-4 text-green-600" />, 'text-green-600', 'Entry-level, no prerequisites')}
          {renderSkillSection('beginner', groupedSkills.beginner, <BookOpen className="w-4 h-4 text-blue-600" />, 'text-blue-600', '1 prerequisite')}
          {renderSkillSection('intermediate', groupedSkills.intermediate, <Leaf className="w-4 h-4 text-yellow-600" />, 'text-yellow-600', '2 prerequisites')}
          {renderSkillSection('advanced', groupedSkills.advanced, <TreeDeciduous className="w-4 h-4 text-orange-600" />, 'text-orange-600', '3+ prerequisites')}
          {renderSkillSection('expert', groupedSkills.expert, <Crown className="w-4 h-4 text-purple-600" />, 'text-purple-600', 'Mastery-level')}
        </div>
      </section>

      {/* Skills Inventory */}
      <section className="pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Skills Inventory</h2>
          <span className="text-sm text-muted-foreground">{skills.length} owned, {skillsToExplore.length} available</span>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by Domain:</span>
            <div className="flex gap-1">
              {['all', 'soft', 'hard'].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={skillFilter === f ? 'default' : 'outline'}
                  onClick={() => setSkillFilter(f as any)}
                  className="text-xs"
                >
                  {f === 'all' ? 'All Domains' : f === 'soft' ? 'Soft Skills' : 'Hard Skills'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Your Skills */}
        <div className="mb-8">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            ✅ YOUR SKILLS ({skills.length})
            <span className="text-sm font-normal text-muted-foreground">Skills you've demonstrated through your work</span>
          </h3>
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill, i) => (
                <EnhancedSkillCard
                  key={skill.id}
                  skillName={skill.skill_name}
                  skillType={skill.proficiency_level || 'Hard Skill'}
                  proficiencyRating={skill.proficiency_rating || 5}
                  yearsExperience={skill.years_experience}
                  verified={!!skill.verification_source}
                  verificationCount={skill.supervisor_attestations || 1}
                  lastPracticed={skill.last_practiced_date || new Date().toLocaleDateString()}
                  complexityLevel={getSkillComplexityLevel(skill.skill_id)}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground mb-2">No skills recorded yet</p>
              <p className="text-sm text-muted-foreground">Complete the signup process to add your skills</p>
            </div>
          )}
        </div>

        {/* Skills to Explore */}
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            🎯 SKILLS TO EXPLORE ({skillsToExplore.length})
            <span className="text-sm font-normal text-muted-foreground">Complete related tasks to add these to your profile</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsToExplore.slice(0, 6).map((skill, i) => (
              <LockedSkillCard
                key={skill.skill_id}
                skillName={skill.skill_name}
                domain={skill.domain}
                index={i}
              />
            ))}
          </div>
          {skillsToExplore.length > 6 && (
            <Button variant="link" className="mt-2">View all {skillsToExplore.length} available skills →</Button>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-xl font-display font-bold">Achievements Unlocked</h2>
          </div>
          <Badge variant="secondary">{unlockedCount} / {achievements.length}</Badge>
        </div>

        <div className="space-y-6">
          {/* Earned badges */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Earned Badges:</h4>
            {achievements.filter(a => a.unlocked).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {achievements.filter(a => a.unlocked).map((achievement, i) => (
                  <EnhancedAchievementBadge
                    key={achievement.id}
                    {...achievement}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Complete tasks to earn badges!</p>
            )}
          </div>

          {/* Coming soon */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Coming Soon:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.filter(a => !a.unlocked).map((achievement, i) => (
                <EnhancedAchievementBadge
                  key={achievement.id}
                  {...achievement}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certification Modal */}
      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              {selectedCertification?.certName}
            </DialogTitle>
            <DialogDescription>{selectedCertification?.certType}</DialogDescription>
          </DialogHeader>
          
          {selectedCertification && (
            <div className="space-y-6">
              {/* Ready status */}
              {(() => {
                const cert = certificationsWithProgress.find(c => c.certName === selectedCertification.certName);
                const percentage = cert ? (cert.skillsMatched / cert.skillsRequired) * 100 : 0;
                const isReady = percentage >= 100;
                
                return (
                  <div className={cn(
                    'rounded-lg p-4 flex items-center gap-3',
                    isReady ? 'bg-success/10' : 'bg-warning/10'
                  )}>
                    <CheckCircle2 className={cn('w-6 h-6', isReady ? 'text-success' : 'text-warning')} />
                    <div>
                      <p className={cn('font-semibold', isReady ? 'text-success' : 'text-warning')}>
                        {isReady ? "You're Ready!" : `${Math.round(percentage)}% Ready`}
                      </p>
                      <p className={cn('text-sm', isReady ? 'text-success/80' : 'text-warning/80')}>
                        {cert?.skillsMatched}/{cert?.skillsRequired} requirements met
                      </p>
                    </div>
                  </div>
                );
              })()}
              
              {/* What is this? */}
              <div>
                <h3 className="font-semibold mb-2">What is this?</h3>
                <p className="text-muted-foreground">{selectedCertification.description}</p>
              </div>
              
              {/* Why get certified? */}
              <div>
                <h3 className="font-semibold mb-2">Why get certified?</h3>
                <ul className="space-y-2">
                  {selectedCertification.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Duration & Provider */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-muted-foreground">{selectedCertification.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Provider</p>
                    <p className="text-muted-foreground text-xs">{selectedCertification.provider}</p>
                  </div>
                </div>
              </div>
              
              {/* What you need (skills checklist) */}
              <div>
                <h3 className="font-semibold mb-3">What you need</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(() => {
                    const cert = certificationsWithProgress.find(c => c.certName === selectedCertification.certName);
                    return cert?.requiredSkillsWithStatus.map((skill, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg',
                          skill.owned ? 'bg-success/10' : 'bg-destructive/5'
                        )}
                      >
                        {skill.owned ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-destructive/50" />
                        )}
                        <span className={skill.owned ? 'text-foreground' : 'text-muted-foreground'}>
                          {skill.name}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              {/* How to get certified */}
              <div>
                <h3 className="font-semibold mb-3">How to get certified</h3>
                <ol className="space-y-3">
                  {selectedCertification.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {i + 1}
                      </div>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {/* Cost */}
              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                <span className="text-xl">💰</span>
                <div>
                  <p className="font-semibold text-primary">Estimated Cost</p>
                  <p className="text-sm text-muted-foreground">{selectedCertification.estimatedCost}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertModal(false)}>Close</Button>
            <Button>Start Certification Journey →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
