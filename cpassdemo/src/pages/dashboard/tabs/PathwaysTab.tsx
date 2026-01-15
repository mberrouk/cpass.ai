import { useMemo } from 'react';
import { WorkerProfile, WorkerSkill } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBarCustom } from '@/components/dashboard/ProgressBarCustom';
import { ArrowDown, Target, GraduationCap, Rocket, MapPin, CheckCircle2 } from 'lucide-react';
import { 
  iscoOccupationProfiles, 
  getSkillIdsForCategories,
  skillCategoryNames 
} from '@/lib/skillIdMapping';

interface PathwaysTabProps {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
}

// Milestones based on skill progress
const milestoneDefinitions = [
  {
    id: 'foundation_badge',
    title: 'Foundation Complete Badge',
    type: 'badge',
    totalSkillsRequired: 46,
    description: 'Master all 46 foundation skills to earn this prestigious badge.',
    estimatedTime: '2-3 months with regular work',
  },
  {
    id: 'field_crop_cert',
    title: 'Field Crop Grower Certification',
    type: 'certification',
    iscoCode: '6111',
    totalSkillsRequired: 13,
    description: 'Become a certified field crop grower with recognized credentials.',
    estimatedTime: '6-8 months total',
  },
];

const longTermGoals = [
  {
    id: 'agricultural_technician',
    title: 'Agricultural Technician',
    iscoCode: '3142',
    description: 'Requires advanced technical skills, laboratory knowledge, and research capabilities',
  },
  {
    id: 'farm_manager',
    title: 'Farm Manager',
    iscoCode: '1311',
    description: 'Requires business management, team leadership, and strategic planning skills',
  },
];

export function PathwaysTab({ profile, skills }: PathwaysTabProps) {
  const ownedSkillIds = useMemo(() => skills.map(s => s.skill_id), [skills]);

  // Calculate match for each ISCO occupation using actual database skill IDs
  const careerPathsWithMatch = useMemo(() => {
    return iscoOccupationProfiles.map(occupation => {
      // Convert category names to actual skill IDs
      const requiredSkillIds = getSkillIdsForCategories(occupation.requiredCategories);
      const foundationSkillIds = getSkillIdsForCategories(occupation.foundationCategories);
      
      const matchedSkillIds = requiredSkillIds.filter(id => ownedSkillIds.includes(id));
      const foundationMatched = foundationSkillIds.filter(id => ownedSkillIds.includes(id));
      const missingSkillIds = requiredSkillIds.filter(id => !ownedSkillIds.includes(id));
      
      // Calculate proficiency breakdown for matched skills
      const matchedSkillsData = skills.filter(s => requiredSkillIds.includes(s.skill_id));
      const proficiencyBreakdown = matchedSkillsData.reduce((acc, skill) => {
        const rating = skill.proficiency_rating || 5;
        if (rating >= 9) acc.expert++;
        else if (rating >= 7) acc.advanced++;
        else if (rating >= 4) acc.intermediate++;
        else acc.beginner++;
        return acc;
      }, { beginner: 0, intermediate: 0, advanced: 0, expert: 0 });

      const matchPercentage = requiredSkillIds.length > 0 
        ? Math.round((matchedSkillIds.length / requiredSkillIds.length) * 100)
        : 0;

      // Get missing skill names for display
      const missingSkillNames = occupation.requiredCategories
        .filter(cat => {
          const catSkillIds = getSkillIdsForCategories([cat]);
          return !catSkillIds.some(id => ownedSkillIds.includes(id));
        })
        .map(cat => skillCategoryNames[cat] || cat);

      return {
        ...occupation,
        skillsMatched: matchedSkillIds.length,
        totalSkillsRequired: requiredSkillIds.length,
        foundationCount: foundationMatched.length,
        totalFoundation: foundationSkillIds.length,
        matchPercentage,
        missingSkills: missingSkillNames,
        proficiencyBreakdown,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [skills, ownedSkillIds]);

  // Primary path = highest match
  const primaryPath = careerPathsWithMatch[0];
  // Alternative paths = next highest matches
  const alternativePaths = careerPathsWithMatch.slice(1, 4);

  // Calculate milestones with actual progress
  const milestonesWithProgress = useMemo(() => {
    return milestoneDefinitions.map(milestone => {
      let currentSkills = 0;
      let totalRequired = milestone.totalSkillsRequired;
      
      if (milestone.id === 'foundation_badge') {
        // Count foundation skills (skills with rating <= 3 or marked as foundation)
        currentSkills = skills.filter(s => (s.proficiency_rating || 5) <= 3).length;
      } else {
        // For certifications, match against the primary path
        currentSkills = primaryPath?.skillsMatched || 0;
        totalRequired = primaryPath?.totalSkillsRequired || milestone.totalSkillsRequired;
      }

      const progress = totalRequired > 0 ? Math.round((currentSkills / totalRequired) * 100) : 0;
      const skillsAway = Math.max(0, totalRequired - currentSkills);

      return {
        ...milestone,
        currentSkills,
        totalSkills: totalRequired,
        progress,
        skillsAway,
        missingSkills: milestone.id === 'field_crop_cert' 
          ? primaryPath?.missingSkills?.slice(0, 4) || []
          : ['Greenhouse Crop Production', 'Advanced Pest Management', 'Soil Conservation Techniques', 'Irrigation System Operation'],
      };
    });
  }, [skills, primaryPath]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Your Skill Roadmap</h1>
        </div>
        <p className="text-muted-foreground">See your path from where you are to where you want to go</p>
      </div>

      {/* Career Paths */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🗺️</span>
          <h2 className="text-xl font-display font-bold">YOUR CAREER PATHS</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Multiple career options based on your {skills.length} verified skills</p>

        {/* Primary Path */}
        {primaryPath && (
          <div className="bg-card border-2 border-primary rounded-xl p-6 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/30 mb-3">PRIMARY PATH (BEST MATCH)</Badge>
            
            <div className="flex items-start gap-3 mb-4">
              <Target className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-xl font-display font-bold">{primaryPath.title}</h3>
                <p className="text-sm text-muted-foreground">ISCO Code: {primaryPath.iscoCode}</p>
              </div>
            </div>

            {/* Skill breakdown */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{primaryPath.skillsMatched}</p>
                <p className="text-xs text-muted-foreground">Skills Matched</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{primaryPath.foundationCount}</p>
                <p className="text-xs text-muted-foreground">Foundation</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{primaryPath.proficiencyBreakdown.intermediate + primaryPath.proficiencyBreakdown.beginner}</p>
                <p className="text-xs text-muted-foreground">Beginner</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{primaryPath.proficiencyBreakdown.advanced + primaryPath.proficiencyBreakdown.expert}</p>
                <p className="text-xs text-muted-foreground">Advanced+</p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Progress:</span>
                <span className="font-medium text-primary">{primaryPath.matchPercentage}% Career Progress</span>
              </div>
              <ProgressBarCustom current={primaryPath.matchPercentage} total={100} color="primary" size="lg" />
              <p className="text-xs text-muted-foreground">
                {primaryPath.skillsMatched}/{primaryPath.totalSkillsRequired} skills • {primaryPath.totalSkillsRequired - primaryPath.skillsMatched} more needed
              </p>
            </div>

            <Button variant="outline" className="mt-4">View Details →</Button>
          </div>
        )}

        {/* Alternative Paths */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">ALTERNATIVE PATHS (STRONG MATCHES)</h4>
          {alternativePaths.map((path) => (
            <div key={path.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="font-display font-semibold">{path.title}</h4>
                <p className="text-sm text-muted-foreground">
                  ISCO Code: {path.iscoCode} • {path.skillsMatched}/{path.totalSkillsRequired} skills matched
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-primary">{path.matchPercentage}%</span>
                <Button variant="ghost" size="sm">View Details →</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Next Milestone */}
      <section>
        {milestonesWithProgress.slice(0, 1).map((milestone) => (
          <div key={milestone.id} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏆</span>
              <h3 className="font-display font-bold">NEXT MILESTONE ({milestone.skillsAway} skills away)</h3>
            </div>
            
            <h4 className="text-lg font-semibold mb-4">{milestone.title}</h4>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{milestone.progress}%</span>
              </div>
              <ProgressBarCustom current={milestone.currentSkills} total={milestone.totalSkills} showFraction size="lg" />
              <p className="text-sm text-muted-foreground">{milestone.currentSkills}/{milestone.totalSkills} skills mastered</p>
            </div>

            {milestone.missingSkills.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm font-medium mb-2">Skills still needed:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {milestone.missingSkills.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                  {milestone.skillsAway > milestone.missingSkills.length && (
                    <li className="text-xs">And {milestone.skillsAway - milestone.missingSkills.length} more skills</li>
                  )}
                </ul>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Estimated time:</span> {milestone.estimatedTime}
            </p>
          </div>
        ))}
      </section>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* After That */}
      <section>
        {milestonesWithProgress.slice(1, 2).map((milestone) => (
          <div key={milestone.id} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">AFTER THAT (~{milestone.skillsAway} skills away)</h3>
            </div>
            
            <h4 className="text-lg font-semibold">{milestone.title}</h4>
            {milestone.iscoCode && (
              <p className="text-sm text-muted-foreground mb-4">ISCO Code: {milestone.iscoCode}</p>
            )}
            
            <p className="text-sm text-muted-foreground mb-2">Additional skills needed:</p>
            <p className="text-sm mb-4">• {milestone.totalSkills - milestone.currentSkills} more specialized skills</p>
            
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Estimated time:</span> {milestone.estimatedTime}
            </p>
          </div>
        ))}
      </section>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Long Term Goals */}
      <section>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold">LONG TERM GOALS (50+ skills away)</h3>
          </div>
          
          <div className="space-y-4">
            {longTermGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold">{goal.title}</h4>
                <p className="text-sm text-muted-foreground">ISCO Code: {goal.iscoCode}</p>
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            <span className="font-medium">Estimated time:</span> 12-18 months with dedicated effort
          </p>
        </div>
      </section>

      {/* Footer motivation */}
      <section className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h3 className="font-display font-bold">Your Path Forward</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          {skills.length > 0 
            ? `You have ${skills.length} verified skills. Every task you complete brings you closer to your goals!`
            : 'Complete tasks to build your skill profile and unlock career pathways.'}
        </p>
        <Button onClick={() => window.history.back()}>← Back to My Profile</Button>
      </section>
    </div>
  );
}
