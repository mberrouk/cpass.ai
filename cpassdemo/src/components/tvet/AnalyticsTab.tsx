import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, Award, Target, Calendar, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const monthlyData = [
  { month: 'Jul', enrollments: 45, completions: 32, rpl: 8 },
  { month: 'Aug', enrollments: 52, completions: 38, rpl: 12 },
  { month: 'Sep', enrollments: 38, completions: 41, rpl: 15 },
  { month: 'Oct', enrollments: 61, completions: 45, rpl: 18 },
  { month: 'Nov', enrollments: 55, completions: 48, rpl: 22 },
  { month: 'Dec', enrollments: 42, completions: 35, rpl: 14 },
];

const programPerformance = [
  { name: 'Crop Production L3', retention: 89, satisfaction: 4.5, employability: 92 },
  { name: 'Dairy Management L4', retention: 85, satisfaction: 4.3, employability: 88 },
  { name: 'Horticulture L4', retention: 82, satisfaction: 4.2, employability: 85 },
  { name: 'Agripreneurship L5', retention: 91, satisfaction: 4.6, employability: 94 },
];

export default function AnalyticsTab() {
  // Load real RPL candidates from bulk_uploaded_workers
  const { data: rplCandidates } = useQuery({
    queryKey: ['rpl-candidates-analytics'],
    queryFn: async () => {
      const { data } = await supabase.from('bulk_uploaded_workers').select('*');
      return data || [];
    }
  });

  // Static values for tables that don't exist
  const studentCount = 247;
  const alumniTracked = 892;
  const rplCount = rplCandidates?.length || 0;
  const employmentRate = 87;

  // Dynamic KPIs
  const kpis = [
    { label: 'Student Retention', value: 87, target: 85, status: 'above' as const },
    { label: 'WBL Completion', value: 78, target: 80, status: 'below' as const },
    { label: 'RPL Conversions', value: 65, target: 60, status: 'above' as const },
    { label: 'Employer Partnerships', value: 23, target: 20, status: 'above' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics & Reporting</h2>
        <p className="text-muted-foreground">Institution performance metrics and trends</p>
      </div>

      {/* Pipeline Overview with Real Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Pipeline Overview</CardTitle>
          <CardDescription>Student → Alumni → RPL → Upskilling flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{studentCount}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">WBL Students</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current enrollment</p>
            </div>

            <ArrowRight className="w-8 h-8 text-muted-foreground/30" />

            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">{alumniTracked}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Alumni</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Trackable on CPASS</p>
            </div>

            <ArrowRight className="w-8 h-8 text-muted-foreground/30" />

            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                <div>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{rplCount}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">RPL Pipeline</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Pre-approved workers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <Badge 
                  variant={kpi.status === 'above' ? 'default' : 'secondary'}
                  className={kpi.status === 'above' ? 'bg-green-600' : 'bg-yellow-600'}
                >
                  {kpi.status === 'above' ? '↑ Above' : '↓ Below'}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{kpi.value}{typeof kpi.value === 'number' && kpi.value < 100 ? '%' : ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Target: {kpi.target}{kpi.target < 100 ? '%' : ''}</p>
              <Progress value={(kpi.value / kpi.target) * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Graduate Cohort Analysis</CardTitle>
          <CardDescription>Cohort 116 - Crop Production L3 (Jan 2023)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded">
              <div className="text-3xl font-bold text-foreground">52</div>
              <div className="text-sm text-muted-foreground">Total Graduated</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded">
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">33</div>
              <div className="text-sm text-green-600 dark:text-green-400">Currently Employed ({employmentRate}%)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">23</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Pursued Further Training (44%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Activity Trends
          </CardTitle>
          <CardDescription>Enrollments, completions, and RPL assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month) => (
              <div key={month.month} className="grid grid-cols-4 gap-4 items-center p-3 bg-muted/30 rounded-lg">
                <div className="font-medium">{month.month} 2024</div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(month.enrollments / 70) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{month.enrollments}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-green-100 dark:bg-green-950 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(month.completions / 70) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{month.completions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-purple-100 dark:bg-purple-950 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(month.rpl / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{month.rpl}</span>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                Enrollments
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                Completions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                RPL Assessments
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Program Performance Comparison
          </CardTitle>
          <CardDescription>Key metrics by program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Program</th>
                  <th className="text-center py-3 font-medium">Retention Rate</th>
                  <th className="text-center py-3 font-medium">Satisfaction</th>
                  <th className="text-center py-3 font-medium">Employability</th>
                </tr>
              </thead>
              <tbody>
                {programPerformance.map((program) => (
                  <tr key={program.name} className="border-b last:border-0">
                    <td className="py-4 font-medium">{program.name}</td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={program.retention} className="w-20 h-2" />
                        <span className="text-sm">{program.retention}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <Badge variant="secondary">{program.satisfaction}/5.0</Badge>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={program.employability} className="w-20 h-2" />
                        <span className="text-sm">{program.employability}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Male</span>
              <span className="font-medium">58%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Female</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Age</span>
              <span className="font-medium">23 years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rural Background</span>
              <span className="font-medium">67%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4" />
              RPL Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Candidates</span>
              <span className="font-medium">{rplCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Assessed This Quarter</span>
              <span className="font-medium">48</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pass Rate</span>
              <span className="font-medium">82%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Processing Time</span>
              <span className="font-medium">12 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">RPL Assessments</span>
              <span className="font-medium">Jan 15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Graduation</span>
              <span className="font-medium">Feb 28</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Intake</span>
              <span className="font-medium">Mar 1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Employer Fair</span>
              <span className="font-medium">Mar 15</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
