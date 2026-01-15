import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Award, TrendingUp, MapPin, Briefcase } from 'lucide-react';

// Mock data - database tables don't exist yet
const mockWorkers = [
  { id: '1', full_name: 'Grace Njeri', location: 'Nakuru', trust_score: 85, overall_tier: 'Gold', open_to_opportunities: true },
  { id: '2', full_name: 'Peter Omondi', location: 'Kisumu', trust_score: 72, overall_tier: 'Silver', open_to_opportunities: true },
  { id: '3', full_name: 'Mary Wanjiku', location: 'Nairobi', trust_score: 91, overall_tier: 'Platinum', open_to_opportunities: true },
  { id: '4', full_name: 'John Kamau', location: 'Mombasa', trust_score: 65, overall_tier: 'Bronze', open_to_opportunities: false },
];

const mockSkills = [
  { skill_name: 'Crop Management', skill_verification_tier: 'Gold' },
  { skill_name: 'Irrigation', skill_verification_tier: 'Silver' },
  { skill_name: 'Livestock Care', skill_verification_tier: 'Silver' },
  { skill_name: 'Machinery Operation', skill_verification_tier: 'Platinum' },
  { skill_name: 'Post-Harvest Handling', skill_verification_tier: 'Gold' },
];

export default function TalentPoolOverviewTab() {
  // Using mock data
  const workers = mockWorkers;
  const skills = mockSkills;

  // Calculate stats
  const totalWorkers = workers?.length || 0;
  const availableWorkers = workers?.filter(w => w.open_to_opportunities).length || 0;
  
  const tierBreakdown = {
    platinum: workers?.filter(w => w.overall_tier?.toLowerCase() === 'platinum').length || 0,
    gold: workers?.filter(w => w.overall_tier?.toLowerCase() === 'gold').length || 0,
    silver: workers?.filter(w => w.overall_tier?.toLowerCase() === 'silver').length || 0,
    bronze: workers?.filter(w => !w.overall_tier || w.overall_tier.toLowerCase() === 'bronze').length || 0,
  };

  const locationBreakdown = workers?.reduce((acc: Record<string, number>, w) => {
    const loc = w.location || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {}) || {};

  // Top skills
  const skillCounts = skills?.reduce((acc: Record<string, number>, s) => {
    acc[s.skill_name] = (acc[s.skill_name] || 0) + 1;
    return acc;
  }, {}) || {};

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Talent Pool Overview</h2>
        <p className="text-muted-foreground">
          Aggregate view of verified agricultural workers on CPASS
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorkers.toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Growing daily
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Open to Opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{availableWorkers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {totalWorkers > 0 ? Math.round((availableWorkers / totalWorkers) * 100) : 0}% of pool
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Gold+ Tier Workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {(tierBreakdown.gold + tierBreakdown.platinum).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Highly verified credentials
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Skills Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{skills?.length.toLocaleString() || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Across all workers
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Tier Distribution</CardTitle>
          <CardDescription>Verification levels across the talent pool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{tierBreakdown.platinum}</div>
              <div className="text-sm text-muted-foreground">Platinum</div>
              <Badge className="mt-2 bg-purple-100 text-purple-800">Top Tier</Badge>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{tierBreakdown.gold}</div>
              <div className="text-sm text-muted-foreground">Gold</div>
              <Badge className="mt-2 bg-amber-100 text-amber-800">Certified</Badge>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
              <div className="text-2xl font-bold text-slate-600">{tierBreakdown.silver}</div>
              <div className="text-sm text-muted-foreground">Silver</div>
              <Badge className="mt-2 bg-slate-100 text-slate-800">Attested</Badge>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{tierBreakdown.bronze}</div>
              <div className="text-sm text-muted-foreground">Bronze</div>
              <Badge className="mt-2 bg-orange-100 text-orange-800">Self-Reported</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Location Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(locationBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([location, count]) => (
                  <div key={location}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{location}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <Progress 
                      value={totalWorkers > 0 ? (count / totalWorkers) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSkills.map(([skill, count]) => (
                <div key={skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{skill}</span>
                    <span className="text-sm font-medium">{count} workers</span>
                  </div>
                  <Progress 
                    value={totalWorkers > 0 ? (count / totalWorkers) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
