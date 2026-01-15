import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TVETDashboardTabProps {
  institutionName?: string;
  onNavigateToTab?: (tab: string) => void;
}

export default function TVETDashboardTab({ institutionName, onNavigateToTab }: TVETDashboardTabProps) {
  // Load RPL candidates from bulk_uploaded_workers table (which exists)
  const { data: uploadedWorkers } = useQuery({
    queryKey: ['uploaded-workers-count'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bulk_uploaded_workers')
        .select('*');
      return data || [];
    }
  });

  const candidates = uploadedWorkers || [];
  
  // Calculate metrics based on uploaded workers
  const certificationReady = candidates.filter((c: any) => {
    const matchPct = c.certification_match_percentage || 0;
    return matchPct >= 80;
  }).length;
  
  const inProgress = candidates.filter((c: any) => {
    const matchPct = c.certification_match_percentage || 0;
    return matchPct >= 50 && matchPct < 80;
  }).length;
  
  const earlyStage = candidates.filter((c: any) => {
    const matchPct = c.certification_match_percentage || 0;
    return matchPct < 50;
  }).length;

  // Static WBL students count (table doesn't exist)
  const studentCount = 247;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome back, {institutionName || 'TVET Institution'}</h2>
        <p className="text-muted-foreground">Overview of your WBL programs and RPL pipeline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Students</p>
                <p className="text-3xl font-bold">{studentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">RPL Candidates</p>
                <p className="text-3xl font-bold">{candidates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Certification Ready</p>
                <p className="text-3xl font-bold">{certificationReady}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work-Based Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Work-Based Learning (Current Students)</CardTitle>
            <CardDescription>Active Programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span>Crop Production L3</span>
                <span className="text-blue-600 font-medium">89 students</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span>Dairy Management L4</span>
                <span className="text-blue-600 font-medium">52 students</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span>Horticulture L4</span>
                <span className="text-blue-600 font-medium">41 students</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span>Agripreneurship L5</span>
                <span className="text-blue-600 font-medium">35 students</span>
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => onNavigateToTab?.('students')}
            >
              View All Students
            </Button>
          </CardContent>
        </Card>

        {/* Recognition of Prior Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Recognition of Prior Learning</CardTitle>
            <CardDescription>RPL Assessment Queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">Certification Ready</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Workers ready for assessment</div>
                </div>
                <span className="text-2xl font-bold text-green-600">{certificationReady}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                <div>
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">In Progress</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Skills development ongoing</div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{inProgress}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <div>
                  <div className="font-medium">Early Stage</div>
                  <div className="text-sm text-muted-foreground">Initial assessment phase</div>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">{earlyStage || candidates.length}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => onNavigateToTab?.('rpl')}
            >
              Browse RPL Candidates →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">John Kamau</p>
                <p className="text-sm text-muted-foreground">Logged irrigation task (AGR-L4-HORT)</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">Sarah Njeri</p>
                <p className="text-sm text-muted-foreground">Completed milking practical (AGR-L3-DAIRY)</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">Peter Oduor</p>
                <p className="text-sm text-muted-foreground">Submitted crop rotation plan (AGR-L3-CROP)</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
