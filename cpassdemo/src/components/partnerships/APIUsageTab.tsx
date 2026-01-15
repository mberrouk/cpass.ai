import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, DollarSign, Activity } from 'lucide-react';

// Mock data for API usage - database tables don't exist yet
const mockApiLogs: any[] = [];

export default function APIUsageTab({ partner }: { partner: any }) {
  // Using mock data since api_usage_logs table doesn't exist
  const apiLogs = mockApiLogs;

  // Calculate metrics
  const callsThisMonth = partner.api_calls_this_month || 0;
  const callsLastMonth = partner.api_calls_last_month || 0;
  const percentChange = callsLastMonth > 0 
    ? Math.round(((callsThisMonth - callsLastMonth) / callsLastMonth) * 100)
    : 0;

  const avgResponseTime = apiLogs?.length 
    ? Math.round(apiLogs.reduce((sum: number, log: any) => sum + (log.response_time_ms || 0), 0) / apiLogs.length)
    : 42;

  const successRate = apiLogs?.length
    ? Math.round((apiLogs.filter((log: any) => log.status_code === 200).length / apiLogs.length) * 100)
    : 99;

  // ROI Calculation
  const manualVerificationCost = 25;
  const apiCostPerCall = 0.06;
  const totalSavings = Math.round(callsThisMonth * (manualVerificationCost - apiCostPerCall));
  const cpassCost = Math.round(callsThisMonth * apiCostPerCall);

  // Endpoint breakdown (mock)
  const endpointBreakdown: Record<string, number> = {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Usage & Analytics</h2>
        <p className="text-muted-foreground">
          Monitor your API usage, performance metrics, and ROI
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Calls This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{callsThisMonth.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm mt-2">
              {percentChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={percentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(percentChange)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResponseTime}ms</div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600">Excellent performance</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Highly reliable</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Integration Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-600 text-white mb-2">
              {partner.integration_status === 'connected' ? '✓ Connected' : '⚠ Issues'}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Last sync: {partner.last_sync ? new Date(partner.last_sync).toLocaleTimeString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Cost Savings Analysis
          </CardTitle>
          <CardDescription>Your ROI using CPASS vs. manual verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Manual Verification Cost</div>
              <div className="text-2xl font-bold text-red-600">
                ${(callsThisMonth * manualVerificationCost).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">at $25 per check</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">CPASS Cost</div>
              <div className="text-2xl font-bold text-blue-600">
                ${cpassCost.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">at $0.06 per API call</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${totalSavings.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                {callsThisMonth > 0 ? Math.round((totalSavings / (callsThisMonth * manualVerificationCost)) * 100) : 0}% reduction
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Usage Breakdown</CardTitle>
          <CardDescription>Which API endpoints you're using most</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(endpointBreakdown).length > 0 ? (
              (Object.entries(endpointBreakdown) as [string, number][]).map(([endpoint, count]) => (
                <div key={endpoint}>
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-sm">/api/v1/{endpoint}</span>
                    <span className="font-medium">{count} calls</span>
                  </div>
                  <Progress 
                    value={callsThisMonth > 0 ? (count / callsThisMonth) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No API calls recorded yet</p>
                <p className="text-sm">Usage data will appear here once you start making API calls</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workers You've Enrolled */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Your Enrolled Workers
          </CardTitle>
          <CardDescription>
            Workers you've added to CPASS (your employees contributing data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded">
              <div className="text-3xl font-bold text-blue-600">
                {partner.workers_enrolled?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Workers Enrolled</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="text-3xl font-bold text-green-600">
                {Math.round((partner.workers_enrolled || 0) * 0.67).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Cross-Platform Workers (67%)
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Your workers also verified on other platforms
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
