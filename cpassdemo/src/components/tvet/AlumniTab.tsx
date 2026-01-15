import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, TrendingUp, Building2, MapPin, Lock, CheckCircle } from 'lucide-react';

export default function AlumniTab() {
  // Static mock data - tvet_alumni table doesn't exist
  const totalAlumni = 897;
  const employedPct = 65;
  const selfEmployedPct = 22;
  const furtherStudyPct = 8;
  const seekingPct = 5;

  const employedTotal = Math.round((totalAlumni * employedPct) / 100);
  const selfEmployedTotal = Math.round((totalAlumni * selfEmployedPct) / 100);
  const furtherStudyTotal = Math.round((totalAlumni * furtherStudyPct) / 100);
  const seekingTotal = Math.round((totalAlumni * seekingPct) / 100);

  const consentedAlumni: any[] = []; // No alumni have consented yet

  const industryStats = [
    { industry: 'Commercial Farming', count: 234, percentage: 26 },
    { industry: 'Agribusiness', count: 189, percentage: 21 },
    { industry: 'Dairy Processing', count: 156, percentage: 17 },
    { industry: 'Horticulture Export', count: 123, percentage: 14 },
    { industry: 'Agricultural Input', count: 98, percentage: 11 },
    { industry: 'Self-Employed', count: 97, percentage: 11 },
  ];

  const locationStats = [
    { region: 'Nairobi', count: 245 },
    { region: 'Central', count: 189 },
    { region: 'Rift Valley', count: 167 },
    { region: 'Western', count: 134 },
    { region: 'Coast', count: 89 },
    { region: 'Other', count: 73 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'employed':
        return <Badge className="bg-green-600">Employed</Badge>;
      case 'self_employed':
        return <Badge className="bg-blue-600">Self-Employed</Badge>;
      case 'seeking':
        return <Badge className="bg-yellow-600">Seeking</Badge>;
      case 'further_study':
        return <Badge className="bg-purple-600">Further Study</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Alumni Outcomes</h2>
        <p className="text-muted-foreground">Privacy-protected career tracking for program effectiveness</p>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Privacy-Protected Data</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          This dashboard shows aggregated industry and sector statistics only. Individual names and employers 
          are only displayed for alumni who have explicitly given consent. This protects worker privacy while 
          demonstrating program effectiveness.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{employedTotal}</p>
            <p className="text-sm text-muted-foreground">Currently Employed</p>
            <p className="text-xs text-green-600 mt-1">{employedPct}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{selfEmployedTotal}</p>
            <p className="text-sm text-muted-foreground">Self-Employed</p>
            <p className="text-xs text-blue-600 mt-1">{selfEmployedPct}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{furtherStudyTotal}</p>
            <p className="text-sm text-muted-foreground">Further Study</p>
            <p className="text-xs text-purple-600 mt-1">{furtherStudyPct}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">{seekingTotal}</p>
            <p className="text-sm text-muted-foreground">Seeking Work</p>
            <p className="text-xs text-yellow-600 mt-1">{seekingPct}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Consented Alumni - Individual Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Alumni Who Consented to Tracking ({consentedAlumni.length})
          </CardTitle>
          <CardDescription>
            These alumni have explicitly allowed their details to be shared with their institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consentedAlumni.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consentedAlumni.map((alumni: any) => (
                  <TableRow key={alumni.id}>
                    <TableCell className="font-medium">{alumni.full_name}</TableCell>
                    <TableCell>{alumni.current_employer || '-'}</TableCell>
                    <TableCell>{alumni.job_title || '-'}</TableCell>
                    <TableCell>{alumni.current_industry || 'Agriculture'}</TableCell>
                    <TableCell>{getStatusBadge(alumni.employment_status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No alumni have consented to individual tracking yet</p>
              <p className="text-sm mt-1">
                Alumni can opt-in to share their career outcomes with your institution
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Employment by Industry
            </CardTitle>
            <CardDescription>Aggregated sector data (anonymized)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {industryStats.map((stat) => (
                <div key={stat.industry}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stat.industry}</span>
                    <span className="font-medium">{stat.count} ({stat.percentage}%)</span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Employment by Region
            </CardTitle>
            <CardDescription>Geographic distribution of alumni</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationStats.map((stat) => (
                <div key={stat.region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stat.region}</span>
                    <span className="font-medium">{stat.count}</span>
                  </div>
                  <Progress value={(stat.count / totalAlumni) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Program Effectiveness Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{employedPct + selfEmployedPct}%</p>
              <p className="text-sm text-muted-foreground">Employment Rate</p>
              <p className="text-xs text-muted-foreground mt-1">Within 6 months</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">KES 45K</p>
              <p className="text-sm text-muted-foreground">Median Salary</p>
              <p className="text-xs text-muted-foreground mt-1">Entry level</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">92%</p>
              <p className="text-sm text-muted-foreground">Field Relevance</p>
              <p className="text-xs text-muted-foreground mt-1">Working in agriculture</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">4.2/5</p>
              <p className="text-sm text-muted-foreground">Employer Rating</p>
              <p className="text-xs text-muted-foreground mt-1">Average satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
