import { useState, useMemo } from 'react';
import { WorkerProfile, WorkerSkill } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/dashboard/JobCard';
import { Briefcase, Filter } from 'lucide-react';
import { 
  jobOpportunityProfiles, 
  getSkillIdsForCategories,
  skillCategoryNames 
} from '@/lib/skillIdMapping';

interface OpportunitiesTabProps {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
}

type FilterType = 'all' | '80' | '60' | '40';

export function OpportunitiesTab({ profile, skills }: OpportunitiesTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const ownedSkillIds = useMemo(() => skills.map(s => s.skill_id), [skills]);

  // Calculate match percentages for each job based on actual database skill IDs
  const jobsWithMatches = useMemo(() => {
    return jobOpportunityProfiles.map((job) => {
      // Convert category names to actual skill IDs
      const requiredSkillIds = getSkillIdsForCategories(job.requiredCategories);
      
      const matchedSkillIds = requiredSkillIds.filter(id => ownedSkillIds.includes(id));
      const matchPercentage = requiredSkillIds.length > 0 
        ? Math.round((matchedSkillIds.length / requiredSkillIds.length) * 100)
        : 0;

      // Get missing skill names for display
      const missingSkillNames = job.requiredCategories
        .filter(cat => {
          const catSkillIds = getSkillIdsForCategories([cat]);
          return !catSkillIds.some(id => ownedSkillIds.includes(id));
        })
        .slice(0, 5)
        .map(cat => skillCategoryNames[cat] || cat);

      // Calculate certification readiness
      const relevantCertifications = job.relevantCertifications.map(cert => {
        const certSkillCount = cert.skillBoost;
        const readyPercentage = Math.min(100, Math.round((matchedSkillIds.length / certSkillCount) * 100));
        return { name: cert.name, readyPercentage };
      });

      return {
        id: job.id,
        jobTitle: job.jobTitle,
        iscoCode: job.iscoCode,
        matchPercentage,
        skillsMatched: matchedSkillIds.length,
        skillsRequired: requiredSkillIds.length,
        missingSkills: missingSkillNames,
        relevantCertifications,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [skills, ownedSkillIds]);

  // Filter jobs based on selected filter
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobsWithMatches;
    const threshold = parseInt(filter);
    return jobsWithMatches.filter(job => job.matchPercentage >= threshold);
  }, [jobsWithMatches, filter]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-display font-bold">Jobs You Can Apply For</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Based on your {skills.length} verified skill{skills.length !== 1 ? 's' : ''} and experience
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Show jobs with:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '80' as FilterType, label: '≥80% Match' },
            { value: '60' as FilterType, label: '≥60% Match' },
            { value: '40' as FilterType, label: '≥40% Match' },
            { value: 'all' as FilterType, label: 'All Matches' },
          ].map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? 'default' : 'outline'}
              onClick={() => setFilter(option.value)}
              className="text-xs sm:text-sm"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} matching your criteria
      </p>

      {/* Job cards */}
      <div className="space-y-3 sm:space-y-4">
        {filteredJobs.map((job, i) => (
          <JobCard
            key={job.id}
            jobTitle={job.jobTitle}
            iscoCode={job.iscoCode}
            skillsMatched={job.skillsMatched}
            skillsRequired={job.skillsRequired}
            missingSkills={job.missingSkills}
            relevantCertifications={job.relevantCertifications}
            index={i}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredJobs.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-muted/50 rounded-xl">
          <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-base sm:text-lg mb-2">No jobs match this filter</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">Try lowering the match percentage threshold</p>
          <Button onClick={() => setFilter('all')}>Show All Jobs</Button>
        </div>
      )}

      {/* Motivation section */}
      <div className="p-4 sm:p-6 bg-primary/5 rounded-xl border border-primary/20 text-center">
        <h3 className="font-display font-bold text-base sm:text-lg mb-2">Want more opportunities?</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          {skills.length > 0 
            ? `You have ${skills.length} verified skills. Complete more tasks to increase your match percentages and unlock higher-paying positions.`
            : 'Complete the signup flow and add your skills to see job match percentages.'}
        </p>
        <Button variant="outline">View Skill Pathways →</Button>
      </div>
    </div>
  );
}
