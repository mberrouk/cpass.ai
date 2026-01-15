import { useState } from "react";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SkillCard } from "@/components/SkillCard";
import { TierJourneyBar } from "@/components/TierJourneyBar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { CertificationModal } from "@/components/CertificationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Share2, Grid3X3, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data since worker_profiles, worker_skills, worker_domains tables don't exist
const mockProfiles = [
  { id: '1', full_name: 'Grace Njeri', location: 'Nakuru', tier: 'Gold', trust_score: 85, total_points: 450, avatar_url: '', phone: '+254720123456' },
  { id: '2', full_name: 'Peter Omondi', location: 'Kisumu', tier: 'Silver', trust_score: 72, total_points: 280, avatar_url: '', phone: '+254720123457' },
  { id: '3', full_name: 'Mary Wanjiku', location: 'Eldoret', tier: 'Bronze', trust_score: 45, total_points: 120, avatar_url: '', phone: '+254720123458' },
];

const mockSkills = [
  { id: '1', worker_id: '1', skill_id: 'HS_CROP_001', skill_name: 'Land Preparation', proficiency_level: 'Expert', years_experience: '5+yr', verification_source: 'TVET Institution' },
  { id: '2', worker_id: '1', skill_id: 'HS_CROP_002', skill_name: 'Planting', proficiency_level: 'Advanced', years_experience: '3-5yr', verification_source: 'Platform Tasks' },
  { id: '3', worker_id: '1', skill_id: 'HS_CROP_003', skill_name: 'Weeding', proficiency_level: 'Intermediate', years_experience: '1-3yr', verification_source: null },
  { id: '4', worker_id: '2', skill_id: 'HS_LIVE_001', skill_name: 'Animal Feeding', proficiency_level: 'Intermediate', years_experience: '1-3yr', verification_source: null },
];

function isSkillVerified(skill: typeof mockSkills[0]) {
  return skill.verification_source !== null;
}

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(mockProfiles[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSkillForCert, setSelectedSkillForCert] = useState<typeof mockSkills[0] | null>(null);

  const skills = mockSkills.filter(s => s.worker_id === selectedProfile.id);

  const handleProfileChange = (profileId: string) => {
    const profile = mockProfiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
    }
  };

  const verifiedSkills = skills.filter(isSkillVerified);

  const achievements = [
    { title: "First Steps", description: "Complete your first skill verification", type: 'milestone' as const, earned: verifiedSkills.length >= 1 },
    { title: "Skill Hunter", description: "Get 10 skills verified", type: 'skills' as const, earned: verifiedSkills.length >= 10 },
    { title: "Expert Path", description: "Achieve expert level in any skill", type: 'excellence' as const, earned: skills.some(s => s.proficiency_level === 'Expert') },
    { title: "Certified Pro", description: "Get 25 verified credentials", type: 'certification' as const, earned: verifiedSkills.length >= 25 },
    { title: "Master Cultivator", description: "Complete all agricultural domain skills", type: 'verified' as const, earned: false },
    { title: "Decade of Experience", description: "Accumulate 10+ years in any skill", type: 'experience' as const, earned: skills.some(s => s.years_experience === '5+yr') },
  ];

  // Cast to any to avoid type issues with ProfileHeader
  const profileForHeader = selectedProfile as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-foreground">Worker Dashboard</h1>
                <p className="text-sm text-muted-foreground">View your skills and credentials</p>
              </div>
            </div>

            <Select value={selectedProfile.id} onValueChange={handleProfileChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {mockProfiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <ProfileHeader profile={profileForHeader} />

        {/* Tier Journey */}
        <TierJourneyBar 
          currentTier={selectedProfile.tier || 'Bronze'}
          totalPoints={selectedProfile.total_points || 0}
          verifiedSkills={verifiedSkills.length}
        />

        {/* Content Tabs */}
        <Tabs defaultValue="skills" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="skills">
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
            }>
              {skills.map((skill, index) => (
                <div key={skill.id} className="relative group">
                  <SkillCard
                    name={skill.skill_name}
                    category={skill.proficiency_level}
                    proficiencyLevel={skill.proficiency_level}
                    yearsExperience={skill.years_experience}
                    verified={isSkillVerified(skill)}
                    verifiedAt={skill.verification_source || undefined}
                    index={index}
                  />
                  {isSkillVerified(skill) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedSkillForCert(skill)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {skills.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No skills recorded yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.title}
                  {...achievement}
                  index={index}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Certification Modal */}
      {selectedSkillForCert && (
        <CertificationModal
          open={!!selectedSkillForCert}
          onOpenChange={() => setSelectedSkillForCert(null)}
          workerName={selectedProfile.full_name}
          skillName={selectedSkillForCert.skill_name}
          verifiedDate={selectedSkillForCert.verification_source || undefined}
          proficiencyLevel={selectedSkillForCert.proficiency_level}
        />
      )}
    </div>
  );
}
