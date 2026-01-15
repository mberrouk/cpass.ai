import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tvetClient } from '@/integrations/django/tvetClient';

export default function AnalyticsTabDjango() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['tvet-analytics-django'],
    queryFn: async () => {
      const { data, error } = await tvetClient.getAnalytics();
      if (error) {
        console.error('Failed to fetch analytics:', error);
        return null;
      }
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">RPL Analytics</h2>
        <p className="text-muted-foreground">Insights into your Recognition of Prior Learning pipeline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
                <p className="text-3xl font-bold">{analytics?.total_candidates || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Certification Ready</p>
                <p className="text-3xl font-bold">{analytics?.certification_ready || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{analytics?.in_progress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Early Stage</p>
                <p className="text-3xl font-bold">{analytics?.early_stage || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Platinum Skills</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics?.tier_distribution?.platinum || 0}
              </div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Gold Skills</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {analytics?.tier_distribution?.gold || 0}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Silver Skills</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics?.tier_distribution?.silver || 0}
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">Bronze Skills</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {analytics?.tier_distribution?.bronze || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.status_distribution?.map((status: any) => (
              <div key={status.assessment_status} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className="capitalize">{status.assessment_status || 'pending'}</span>
                <span className="font-semibold">{status.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics?.monthly_trend?.map((month: any) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span>{month.month}</span>
                <span className="font-semibold">{month.count} candidates</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
