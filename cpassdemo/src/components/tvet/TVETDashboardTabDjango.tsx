import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, CheckCircle, Upload, FileSpreadsheet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tvetClient } from '@/integrations/django/tvetClient';

interface TVETDashboardTabDjangoProps {
  institutionName?: string;
  onNavigateToTab?: (tab: string) => void;
}

export default function TVETDashboardTabDjango({ institutionName, onNavigateToTab }: TVETDashboardTabDjangoProps) {
  // Load dashboard stats from Django backend
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['tvet-dashboard-stats-django'],
    queryFn: async () => {
      const { data, error } = await tvetClient.getDashboardStats();
      if (error) {
        console.error('Failed to fetch dashboard stats:', error);
        return null;
      }
      return data;
    }
  });

  // Load RPL candidates from Django backend
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ['rpl-candidates-django'],
    queryFn: async () => {
      const { data, error } = await tvetClient.getRPLCandidates();
      if (error) {
        console.error('Failed to fetch RPL candidates:', error);
        return { candidates: [], count: 0 };
      }
      return data || { candidates: [], count: 0 };
    }
  });

  // Load upload batches for recent activity
  const { data: batchesData } = useQuery({
    queryKey: ['tvet-upload-batches-django'],
    queryFn: async () => {
      const { data, error } = await tvetClient.getUploadBatches();
      if (error) return { batches: [], count: 0 };
      return data || { batches: [], count: 0 };
    }
  });

  const isLoading = statsLoading || candidatesLoading;
  const candidates = candidatesData?.candidates || [];
  const batches = batchesData?.batches || [];
  
  // Calculate metrics based on certification match
  const certificationReady = candidates.filter((c) => c.certification_match >= 80).length;
  const inProgress = candidates.filter((c) => c.certification_match >= 50 && c.certification_match < 80).length;
  const earlyStage = candidates.filter((c) => c.certification_match < 50).length;

  // Total batches count
  const totalBatches = statsData?.total_batches ?? batches.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome back, {institutionName || 'TVET Institution'}</h2>
        <p className="text-muted-foreground">Overview of your WBL programs and RPL pipeline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Upload Batches</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : totalBatches}</p>
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
                <p className="text-3xl font-bold">{isLoading ? '...' : candidates.length}</p>
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
                <p className="text-3xl font-bold">{isLoading ? '...' : certificationReady}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Upload Batches</CardTitle>
            <CardDescription>Latest candidate uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upload batches yet</p>
                  <p className="text-sm">Upload a CSV file to get started</p>
                </div>
              ) : (
                batches.slice(0, 4).map((batch) => (
                  <div key={batch.batch_id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <div>
                      <span className="font-medium">{batch.source_file_name}</span>
                      <p className="text-xs text-muted-foreground">
                        {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <span className="text-blue-600 font-medium">{batch.worker_count} workers</span>
                  </div>
                ))
              )}
            </div>

            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => onNavigateToTab?.('upload')}
            >
              Upload New Batch
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
                <span className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : certificationReady}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                <div>
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">In Progress</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Skills development ongoing</div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {isLoading ? '...' : inProgress}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <div>
                  <div className="font-medium">Early Stage</div>
                  <div className="text-sm text-muted-foreground">Initial assessment phase</div>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">
                  {isLoading ? '...' : earlyStage}
                </span>
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

      {/* Recent Activity - Recent Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Candidates</CardTitle>
          <CardDescription>Latest RPL candidates added to your institution</CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No candidates yet</p>
              <p className="text-sm">Upload workers via CSV or wait for CPASS affiliations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.slice(0, 5).map((candidate, index) => {
                const statusColor = candidate.certification_match >= 80 
                  ? 'bg-green-600' 
                  : candidate.certification_match >= 50 
                  ? 'bg-yellow-600' 
                  : 'bg-gray-400';
                
                return (
                  <div key={candidate.id} className={`flex items-start gap-3 ${index < candidates.length - 1 ? 'pb-3 border-b' : ''}`}>
                    <div className={`w-2 h-2 ${statusColor} rounded-full mt-2`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{candidate.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.total_skills} skills · {candidate.certification_match}% match · {candidate.tier} tier
                      </p>
                      <p className="text-xs text-muted-foreground">{candidate.location || 'Location unknown'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {candidates.length > 5 && (
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => onNavigateToTab?.('rpl')}
            >
              View All {candidates.length} Candidates
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
