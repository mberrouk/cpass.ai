import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Eye, Phone, MessageCircle, MapPin, Award, Loader2, ExternalLink, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tvetClient, RPLCandidate } from '@/integrations/django/tvetClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Helper to determine certification readiness based on percentage
function getCertificationStatus(percentage: number): { status: string; color: string; message: string } {
  if (percentage >= 80) {
    return { status: 'ready', color: 'bg-green-100 text-green-800', message: 'Certification ready - recommend for assessment' };
  } else if (percentage >= 50) {
    return { status: 'progress', color: 'bg-yellow-100 text-yellow-800', message: 'In progress - needs additional skills development' };
  } else {
    return { status: 'early', color: 'bg-gray-100 text-gray-700', message: 'Early stage - requires more experience documentation' };
  }
}

// RPL Status Badge Component
function RPLStatusBadge({ percentage }: { percentage: number }) {
  if (percentage >= 80) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Ready</Badge>;
  } else if (percentage >= 50) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 In Progress</Badge>;
  } else {
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">⚠️ Early Stage</Badge>;
  }
}

// Tier Badge Component
function TierBadge({ tier }: { tier: string }) {
  const config = {
    platinum: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Platinum' },
    gold: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Gold' },
    silver: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Silver' },
    bronze: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Bronze' },
  };
  
  const { color, label } = config[tier as keyof typeof config] || config.bronze;
  
  return <Badge className={color}>{label}</Badge>;
}

export default function RPLCandidatesTabDjango() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMatch, setFilterMatch] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [selectedCandidate, setSelectedCandidate] = useState<RPLCandidate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch RPL candidates
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['rpl-candidates-django', filterStatus, filterMatch],
    queryFn: async () => {
      const { data, error } = await tvetClient.getRPLCandidates({
        status: filterStatus,
        min_match: filterMatch.min,
        max_match: filterMatch.max,
      });
      if (error) {
        toast.error('Failed to load RPL candidates');
        return { candidates: [], count: 0 };
      }
      return data || { candidates: [], count: 0 };
    }
  });

  const candidates = candidatesData?.candidates || [];

  // Contact mutation
  const contactMutation = useMutation({
    mutationFn: async ({ candidateId, method }: { candidateId: string; method: 'sms' | 'whatsapp' | 'email' }) => {
      const { data, error } = await tvetClient.logCandidateContact(candidateId, method);
      if (error) throw new Error(error.message || 'Failed to log contact');
      return data;
    },
    onSuccess: () => {
      toast.success('Contact logged successfully');
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-django'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to log contact');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: string; status: string }) => {
      const { data, error } = await tvetClient.updateCandidateStatus(candidateId, status);
      if (error) throw new Error(error.message || 'Failed to update status');
      return data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-django'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  const handleContact = (candidate: RPLCandidate, method: 'sms' | 'whatsapp' | 'email') => {
    contactMutation.mutate({ candidateId: candidate.id, method });
  };

  const handleViewDetails = (candidate: RPLCandidate) => {
    setSelectedCandidate(candidate);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (candidateId: string, newStatus: string) => {
    updateStatusMutation.mutate({ candidateId, status: newStatus });
  };

  // Calculate summary stats
  const stats = {
    total: candidates.length,
    ready: candidates.filter(c => c.certification_match >= 80).length,
    inProgress: candidates.filter(c => c.certification_match >= 50 && c.certification_match < 80).length,
    earlyStage: candidates.filter(c => c.certification_match < 50).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">RPL Candidates</h2>
        <p className="text-muted-foreground">Recognition of Prior Learning - Assess and certify experienced workers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Candidates</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Certification Ready</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.ready}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20">
          <div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">In Progress</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.inProgress}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Early Stage</p>
            <p className="text-2xl font-bold">{stats.earlyStage}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'identified' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('identified')}
              >
                Identified
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'contacted' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('contacted')}
              >
                Contacted
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('scheduled')}
              >
                Scheduled
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('in_progress')}
              >
                In Progress
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'certified' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('certified')}
              >
                Certified
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Match</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterMatch.min === 80 ? 'default' : 'outline'}
                onClick={() => setFilterMatch({ min: 80, max: 100 })}
              >
                Ready (80%+)
              </Button>
              <Button
                size="sm"
                variant={filterMatch.min === 50 && filterMatch.max === 79 ? 'default' : 'outline'}
                onClick={() => setFilterMatch({ min: 50, max: 79 })}
              >
                In Progress (50-79%)
              </Button>
              <Button
                size="sm"
                variant={filterMatch.min === 0 && filterMatch.max === 49 ? 'default' : 'outline'}
                onClick={() => setFilterMatch({ min: 0, max: 49 })}
              >
                Early (&lt;50%)
              </Button>
              <Button
                size="sm"
                variant={filterMatch.max === 100 && filterMatch.min === 0 ? 'default' : 'outline'}
                onClick={() => setFilterMatch({ min: 0, max: 100 })}
              >
                All
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Candidates Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading candidates...</p>
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => {
                const certStatus = getCertificationStatus(candidate.certification_match);
                return (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.full_name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {candidate.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: {candidate.total_skills}</div>
                        <div className="text-xs text-muted-foreground">
                          🥇{candidate.platinum_skills} 🥈{candidate.gold_skills} 🥉{candidate.silver_skills}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={candidate.tier} />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[100px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={candidate.certification_match} className="h-2" />
                          <span className="text-sm font-medium">{candidate.certification_match}%</span>
                        </div>
                        <RPLStatusBadge percentage={candidate.certification_match} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{candidate.assessment_status || 'pending'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(candidate)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/worker-profile/${candidate.id}`, '_blank')}
                          title="View CPASS Profile"
                        >
                          <User className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleContact(candidate, 'sms')}
                          disabled={contactMutation.isPending}
                          title="Call/SMS"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleContact(candidate, 'whatsapp')}
                          disabled={contactMutation.isPending}
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RPL Candidate Details</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-semibold">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p>{selectedCandidate.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{selectedCandidate.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedCandidate.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tier</label>
                  <div><TierBadge tier={selectedCandidate.tier} /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Certification Match</label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedCandidate.certification_match} className="h-2 flex-1" />
                    <span className="font-semibold">{selectedCandidate.certification_match}%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Skills Breakdown</label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                    <div className="text-xs text-purple-700 dark:text-purple-300">Platinum</div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      {selectedCandidate.platinum_skills}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">Gold</div>
                    <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                      {selectedCandidate.gold_skills}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded">
                    <div className="text-xs text-gray-700 dark:text-gray-300">Silver</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedCandidate.silver_skills}
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                    <div className="text-xs text-orange-700 dark:text-orange-300">Bronze</div>
                    <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                      {selectedCandidate.bronze_skills}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Assessment Status</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedCandidate.assessment_status === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCandidate.assessment_status === 'scheduled' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'scheduled')}
                  >
                    Scheduled
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCandidate.assessment_status === 'completed' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'completed')}
                  >
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCandidate.assessment_status === 'certified' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedCandidate.id, 'certified')}
                  >
                    Certified
                  </Button>
                </div>
              </div>

              {selectedCandidate.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Added</label>
                  <p className="text-sm">{format(new Date(selectedCandidate.created_at), 'PPP')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
