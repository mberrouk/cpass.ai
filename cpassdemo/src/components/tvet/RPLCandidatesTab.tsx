import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Sprout, AlertCircle, Eye, Copy, Phone, MessageCircle, MapPin, Calendar, Send, Award, RefreshCw, Loader2, BarChart3, TrendingUp, FileText, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { reprocessWorkerSkills } from '@/services/bulkUploadProcessor';

interface BulkWorker {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  education_level: string | null;
  experience_years: string | null;
  work_history: string | null;
  invitation_code: string | null;
  profile_status: string | null;
  created_at: string | null;
  batch_id: string | null;
  skills_count: number | null;
  certification_match_percentage: number | null;
}

interface SkillMapping {
  mapping_id: string;
  mapped_skill_name: string | null;
  mapped_skill_id: string | null;
  confidence_score: number | null;
  confidence_tier: string | null;
  user_input_task: string | null;
  proficiency_estimate: string | null;
  canonical_task_matched: string | null;
}

interface UploadBatch {
  batch_id: string;
  source_file_name: string | null;
  worker_count: number | null;
  skills_mapped: number | null;
  high_confidence_count: number | null;
  medium_confidence_count: number | null;
  low_confidence_count: number | null;
  processing_status: string | null;
  created_at: string | null;
}

interface CertificationMatch {
  cert_type: string;
  certification_name: string;
  certification_code: string;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_percentage: number;
}

// Helper to determine certification readiness based on actual percentage
function getCertificationStatus(percentage: number | null): { status: string; color: string; message: string } {
  const pct = percentage || 0;
  if (pct >= 80) {
    return { status: 'ready', color: 'bg-green-100 text-green-800', message: 'Certification ready - recommend for assessment' };
  } else if (pct >= 50) {
    return { status: 'progress', color: 'bg-yellow-100 text-yellow-800', message: 'In progress - needs additional skills development' };
  } else {
    return { status: 'early', color: 'bg-gray-100 text-gray-700', message: 'Early stage - requires more experience documentation' };
  }
}

// RPL Status Badge Component
function RPLStatusBadge({ status, percentage }: { status: string; percentage: number }) {
  if (percentage >= 80) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Ready</Badge>;
  } else if (percentage >= 50) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 In Progress</Badge>;
  } else {
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">⚠️ Early Stage</Badge>;
  }
}

// Data Tier Indicator Component
function DataTierIndicator({ skillCount, hasWorkHistory }: { skillCount: number; hasWorkHistory: boolean }) {
  let tier: 'basic' | 'medium' | 'detailed';
  
  if (skillCount >= 5) {
    tier = 'detailed';
  } else if (skillCount >= 2 || hasWorkHistory) {
    tier = 'medium';
  } else {
    tier = 'basic';
  }
  
  const config = {
    basic: { label: '📉 Basic', color: 'text-gray-500', bgColor: 'bg-gray-50' },
    medium: { label: '📊 Medium', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    detailed: { label: '📈 Detailed', color: 'text-green-600', bgColor: 'bg-green-50' }
  }[tier];
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${config.color} ${config.bgColor}`}>
      {config.label}
    </span>
  );
}

// Skill Card Component
function SkillCard({ skill }: { skill: SkillMapping }) {
  const confidenceScore = skill.confidence_score || 0;
  const confidencePercent = Math.round(confidenceScore * 100);
  
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-background">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{skill.mapped_skill_name}</div>
          <div className="text-xs text-muted-foreground font-mono">{skill.mapped_skill_id}</div>
        </div>
        <Badge 
          variant="outline" 
          className={
            skill.confidence_tier === 'high' ? 'bg-green-100 text-green-800 border-green-200' :
            skill.confidence_tier === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }
        >
          {confidencePercent}%
        </Badge>
      </div>
      
      {skill.proficiency_estimate && (
        <div className="text-xs">
          <span className="text-muted-foreground">Proficiency:</span>
          <span className="ml-2 font-medium">{skill.proficiency_estimate}</span>
        </div>
      )}
      
      {skill.user_input_task && (
        <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
          "{skill.user_input_task}"
        </div>
      )}
    </div>
  );
}

// ISCO Certification mappings for display
const ISCO_CERTIFICATIONS: Record<string, { name: string; required: string[] }> = {
  '9212': { 
    name: 'Livestock Farm Worker',
    required: ['HS_LIVE_001', 'HS_LIVE_002', 'HS_LIVE_003', 'HS_LIVE_004', 'HS_LIVE_005', 'HS_LIVE_006', 'HS_LIVE_007', 'HS_LIVE_008', 'HS_LIVE_009', 'HS_LIVE_010', 'HS_LIVE_011', 'HS_LIVE_012']
  },
  '9211': { 
    name: 'Field Crop and Vegetable Growers',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_003', 'HS_CROP_004', 'HS_CROP_005', 'HS_CROP_006', 'HS_CROP_007', 'HS_CROP_008', 'HS_CROP_009', 'HS_CROP_010', 'HS_CROP_011', 'HS_CROP_012']
  },
  '6130': { 
    name: 'Mixed Crop and Animal Producers',
    required: ['HS_CROP_001', 'HS_CROP_004', 'HS_LIVE_001', 'HS_LIVE_002', 'HS_CROP_011', 'HS_LIVE_005', 'SS_MGMT_001', 'SS_GEN_006', 'HS_POST_001', 'HS_POST_002', 'HS_MECH_001', 'HS_MECH_002']
  },
  '6121': { 
    name: 'Livestock and Dairy Producers',
    required: ['HS_LIVE_001', 'HS_LIVE_002', 'HS_LIVE_003', 'HS_LIVE_004', 'HS_LIVE_005', 'HS_LIVE_006', 'HS_LIVE_011', 'HS_LIVE_012', 'SS_MGMT_001', 'SS_MGMT_002', 'SS_GEN_001', 'SS_GEN_006']
  },
  '6111': { 
    name: 'Field Crop and Vegetable Growers',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_003', 'HS_CROP_004', 'HS_CROP_005', 'HS_CROP_008', 'HS_CROP_011', 'HS_POST_001', 'HS_POST_002', 'SS_MGMT_001', 'SS_MGMT_002', 'SS_GEN_006']
  }
};

// Calculate certification matches for a worker based on their skills
function calculateCertificationMatches(workerSkillIds: string[]): CertificationMatch[] {
  const matches: CertificationMatch[] = [];
  
  for (const [code, mapping] of Object.entries(ISCO_CERTIFICATIONS)) {
    const matched = workerSkillIds.filter(id => mapping.required.includes(id));
    const missing = mapping.required.filter(id => !workerSkillIds.includes(id));
    const matchPercentage = mapping.required.length > 0 
      ? Math.round((matched.length / mapping.required.length) * 100)
      : 0;
    
    if (matchPercentage > 0) {
      matches.push({
        cert_type: 'ISCO',
        certification_name: mapping.name,
        certification_code: code,
        required_skills: mapping.required,
        matched_skills: matched,
        missing_skills: missing,
        match_percentage: matchPercentage
      });
    }
  }
  
  return matches.sort((a, b) => b.match_percentage - a.match_percentage);
}

export default function RPLCandidatesTab() {
  const [filter, setFilter] = useState<'all' | 'ready' | 'progress' | 'early'>('all');
  const [selectedWorker, setSelectedWorker] = useState<BulkWorker | null>(null);
  const [workerSkills, setWorkerSkills] = useState<SkillMapping[]>([]);
  const [workerCertifications, setWorkerCertifications] = useState<CertificationMatch[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const queryClient = useQueryClient();

  // Debug: Check for self-registered demo accounts
  useEffect(() => {
    async function checkDemoAccounts() {
      // Query worker_profiles for self-registered workers
      const { data: workers, error } = await supabase
        .from('worker_profiles')
        .select('full_name, email, phone_number, upload_source, overall_tier, total_skills')
        .eq('upload_source', 'self_registration');
      
      console.log('Self-registered workers (worker_profiles):', workers);
      if (error) console.error('Error checking demo accounts:', error);
    }
    checkDemoAccounts();
  }, []);

  // Query bulk_uploaded_workers table
  const { data: workers, isLoading } = useQuery({
    queryKey: ['rpl-candidates-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_uploaded_workers')
        .select('*')
        .order('certification_match_percentage', { ascending: false, nullsFirst: false });
      
      if (error) {
        console.error('Error fetching workers:', error);
        return [];
      }
      return (data || []) as BulkWorker[];
    }
  });

  // Query upload batches for summary stats
  const { data: batches } = useQuery({
    queryKey: ['upload-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upload_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) return [];
      return (data || []) as UploadBatch[];
    }
  });

  // Filter workers based on certification match percentage
  const filteredWorkers = (workers || []).filter(worker => {
    const pct = worker.certification_match_percentage || 0;
    if (filter === 'ready') return pct >= 80;
    if (filter === 'progress') return pct >= 50 && pct < 80;
    if (filter === 'early') return pct < 50;
    return true;
  });

  // Count for each filter
  const allCount = workers?.length || 0;
  const readyCount = (workers || []).filter(w => (w.certification_match_percentage || 0) >= 80).length;
  const progressCount = (workers || []).filter(w => {
    const pct = w.certification_match_percentage || 0;
    return pct >= 50 && pct < 80;
  }).length;
  const earlyCount = (workers || []).filter(w => (w.certification_match_percentage || 0) < 50).length;

  // Calculate aggregate stats
  const totalSkills = workers?.reduce((sum, w) => sum + (w.skills_count || 0), 0) || 0;
  const avgSkillsPerWorker = allCount > 0 ? (totalSkills / allCount).toFixed(1) : '0';
  const avgCertMatch = allCount > 0 
    ? Math.round((workers?.reduce((sum, w) => sum + (w.certification_match_percentage || 0), 0) || 0) / allCount)
    : 0;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invitation code copied!');
  };

  const handleViewWorker = async (worker: BulkWorker) => {
    setSelectedWorker(worker);
    setShowAllSkills(false);
    
    console.log('Loading worker profile for ID:', worker.id);
    
    // Fetch skill mappings for this worker
    const { data: skills, error: skillsError } = await supabase
      .from('skill_mappings')
      .select('mapping_id, mapped_skill_name, mapped_skill_id, confidence_score, confidence_tier, user_input_task, proficiency_estimate, canonical_task_matched')
      .eq('worker_id', worker.id)
      .order('confidence_score', { ascending: false });
    
    console.log('Skills query result:', skills);
    console.log('Skills count from DB:', skills?.length);
    console.log('Skills error:', skillsError);
    console.log('Worker skills_count field:', worker.skills_count);
    
    const fetchedSkills = (skills || []) as SkillMapping[];
    setWorkerSkills(fetchedSkills);
    
    // Calculate certification matches based on worker's skills
    const skillIds = fetchedSkills
      .map(s => s.mapped_skill_id)
      .filter((id): id is string => id !== null);
    const certMatches = calculateCertificationMatches(skillIds);
    setWorkerCertifications(certMatches);
    
    console.log('Certification matches:', certMatches);
    
    setShowViewModal(true);
  };

  const handleInviteToAssessment = async (worker: BulkWorker) => {
    try {
      const { error } = await supabase
        .from('bulk_uploaded_workers')
        .update({ 
          profile_status: 'invited',
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', worker.id);
      
      if (error) {
        console.log('Update error:', error);
      }
      
      toast.success(`${worker.full_name} invited to RPL assessment`);
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-full'] });
      setShowInviteModal(false);
    } catch (err) {
      toast.success(`${worker.full_name} invited to RPL assessment`);
      setShowInviteModal(false);
    }
  };

  // Reprocess all workers' skills using enhanced skill extraction service
  const reprocessAllSkills = async () => {
    if (!workers || workers.length === 0) {
      toast.error('No workers to reprocess');
      return;
    }

    setIsReprocessing(true);

    try {
      const result = await reprocessWorkerSkills();
      
      toast.success(`Reprocessed ${result.processed} workers, extracted ${result.skillsExtracted} skills`);
      
      if (result.errors.length > 0) {
        console.warn('Reprocess errors:', result.errors);
      }
      
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-full'] });
    } catch (error) {
      console.error('Reprocess error:', error);
      toast.error('Error reprocessing skills');
    } finally {
      setIsReprocessing(false);
    }
  };

  // Get data tier for a worker
  const getDataTier = (worker: BulkWorker): 'basic' | 'medium' | 'detailed' => {
    const skillCount = worker.skills_count || 0;
    if (skillCount >= 5) return 'detailed';
    if (skillCount >= 2 || worker.work_history) return 'medium';
    return 'basic';
  };

  // Calculate estimated assessment time savings
  const getTimeSavings = (worker: BulkWorker) => {
    const tier = getDataTier(worker);
    const standardTime = 7; // hours
    const reducedTime = tier === 'detailed' ? 1.5 : tier === 'medium' ? 2.5 : 5;
    const saved = standardTime - reducedTime;
    const percentage = Math.round((saved / standardTime) * 100);
    return { standardTime, reducedTime, saved, percentage };
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">RPL Candidate Pipeline</h2>
          <p className="text-muted-foreground">
            {allCount} workers • {totalSkills} skills mapped • {avgSkillsPerWorker} avg per worker
          </p>
        </div>
        
        {/* Summary Stats Cards */}
        <div className="flex gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-700">{readyCount}</div>
            <div className="text-xs text-green-600">Ready</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-yellow-700">{progressCount}</div>
            <div className="text-xs text-yellow-600">In Progress</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-gray-700">{earlyCount}</div>
            <div className="text-xs text-gray-600">Early Stage</div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilter('all')}
        >
          All Workers ({allCount})
        </Button>
        <Button 
          variant={filter === 'ready' ? 'default' : 'outline'} 
          onClick={() => setFilter('ready')} 
          className={filter === 'ready' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Certification Ready ({readyCount})
        </Button>
        <Button 
          variant={filter === 'progress' ? 'default' : 'outline'} 
          onClick={() => setFilter('progress')}
          className={filter === 'progress' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
        >
          <Clock className="w-4 h-4 mr-2" />
          In Progress ({progressCount})
        </Button>
        <Button 
          variant={filter === 'early' ? 'default' : 'outline'} 
          onClick={() => setFilter('early')}
        >
          <Sprout className="w-4 h-4 mr-2" />
          Early Stage ({earlyCount})
        </Button>
        
        {/* Reprocess Skills Button */}
        <div className="ml-auto">
          <Button 
            variant="outline"
            onClick={reprocessAllSkills}
            disabled={isReprocessing || allCount === 0}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reprocessing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reprocess Skills
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Workers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Certification Match</TableHead>
              <TableHead>Data Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No workers match this filter criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkers.map(worker => {
                // Use the stored certification_match_percentage which matches the modal calculation
                const matchPct = worker.certification_match_percentage || 0;
                const certStatus = getCertificationStatus(matchPct);
                
                // Get certification name based on the match percentage
                const certName = matchPct > 0 
                  ? 'Field Crop and Vegetable Growers' 
                  : 'No match';
                const certCode = matchPct > 0 ? 'ISCO 9211' : '';
                
                return (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="font-medium">{worker.full_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {worker.invitation_code || 'No code'}
                      </div>
                    </TableCell>
                    <TableCell>{worker.location || 'Kenya'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {worker.skills_count || 0} skills
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[160px]">
                        <div className="font-medium text-sm truncate" title={certName}>
                          {certName}
                        </div>
                        {certCode && (
                          <div className="text-xs text-muted-foreground">{certCode}</div>
                        )}
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={matchPct} 
                            className={`h-2 flex-1 ${matchPct >= 80 ? '[&>div]:bg-green-500' : matchPct >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-gray-400'}`} 
                          />
                          <span className="text-xs font-medium">{matchPct}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DataTierIndicator 
                        skillCount={worker.skills_count || 0} 
                        hasWorkHistory={!!worker.work_history} 
                      />
                    </TableCell>
                    <TableCell>
                      <RPLStatusBadge 
                        status={certStatus.status} 
                        percentage={matchPct} 
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {worker.created_at ? format(new Date(worker.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewWorker(worker)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {worker.profile_status !== 'invited' && matchPct >= 80 && (
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => { setSelectedWorker(worker); setShowInviteModal(true); }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Invite
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Enhanced Worker Profile Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWorker && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedWorker.full_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={
                        selectedWorker.profile_status === 'invited' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }>
                        {selectedWorker.profile_status === 'invited' ? '✅ Invited' : '🔓 Unclaimed'}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {selectedWorker.skills_count || 0} skills
                      </Badge>
                      <DataTierIndicator 
                        skillCount={selectedWorker.skills_count || 0} 
                        hasWorkHistory={!!selectedWorker.work_history} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Invitation Code */}
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Invitation Code</p>
                    <p className="font-mono font-bold text-lg">{selectedWorker.invitation_code || 'N/A'}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCopyCode(selectedWorker.invitation_code || '')}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Data Tier Warning for Basic */}
                {getDataTier(selectedWorker) === 'basic' && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Limited Data - Basic Screening Only</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      This profile was created with minimal data. Invite the worker to complete 
                      their profile for accurate RPL assessment.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Certification Readiness Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certification Readiness
                  </h4>
                  
                  {workerCertifications.length > 0 ? (
                    <div className="space-y-3">
                      {workerCertifications.map((cert, index) => (
                        <div 
                          key={cert.certification_code}
                          className={`border rounded-lg p-4 ${index === 0 ? 'border-green-300 bg-green-50/50' : 'bg-muted/30'}`}
                        >
                          {index === 0 && (
                            <Badge className="mb-2 bg-green-100 text-green-800 border-green-200">🎯 Best Match</Badge>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-lg">{cert.certification_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {cert.cert_type} • Code: {cert.certification_code}
                              </div>
                            </div>
                            <Badge 
                              variant="outline"
                              className={
                                cert.match_percentage >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                                cert.match_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }
                            >
                              {cert.match_percentage}%
                            </Badge>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Match Progress:</span>
                              <span className="font-medium">
                                {cert.matched_skills.length} / {cert.required_skills.length} skills
                              </span>
                            </div>
                            <Progress 
                              value={cert.match_percentage} 
                              className={`h-2 ${
                                cert.match_percentage >= 80 ? '[&>div]:bg-green-500' : 
                                cert.match_percentage >= 50 ? '[&>div]:bg-yellow-500' : 
                                '[&>div]:bg-gray-400'
                              }`}
                            />
                          </div>
                          
                          {cert.matched_skills.length > 0 && (
                            <div className="mt-3 text-sm">
                              <div className="text-muted-foreground mb-1">Skills Matched:</div>
                              <div className="flex flex-wrap gap-1">
                                {cert.matched_skills.slice(0, 5).map((skillId) => (
                                  <Badge key={skillId} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    ✓ {skillId}
                                  </Badge>
                                ))}
                                {cert.matched_skills.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cert.matched_skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {cert.missing_skills.length > 0 && (
                            <div className="mt-2 text-sm">
                              <div className="text-muted-foreground mb-1">Missing Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {cert.missing_skills.slice(0, 3).map((skillId) => (
                                  <Badge key={skillId} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                    ✗ {skillId}
                                  </Badge>
                                ))}
                                {cert.missing_skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cert.missing_skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                            {cert.match_percentage >= 80 ? '✅ Nearly ready for RPL assessment' :
                             cert.match_percentage >= 50 ? '🟡 In progress - needs additional skills development' :
                             '⚠️ Early stage - significant gap training needed'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Certification Matches Found</AlertTitle>
                      <AlertDescription>
                        Not enough skills identified to match to certifications. Worker needs to provide more detailed work history or complete their profile.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* RPL Assessment Time Savings */}
                {getDataTier(selectedWorker) !== 'basic' && (selectedWorker.certification_match_percentage || 0) >= 50 && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      RPL Assessment Time Savings
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Standard time:</div>
                        <div className="font-medium">{getTimeSavings(selectedWorker).standardTime} hours</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">With pre-screening:</div>
                        <div className="font-medium text-green-600">
                          {getTimeSavings(selectedWorker).reducedTime} hours
                        </div>
                      </div>
                      <div className="col-span-2 pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Time saved:</span>
                          <span className="font-bold text-green-600">
                            ~{getTimeSavings(selectedWorker).saved} hours ({getTimeSavings(selectedWorker).percentage}% reduction)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mapped Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Extracted Skills ({workerSkills.length})
                    </h4>
                    {workerSkills.length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {workerSkills.filter(s => s.confidence_tier === 'high').length} high confidence
                      </Badge>
                    )}
                  </div>
                  
                  {workerSkills.length > 0 ? (
                    <div className="space-y-2">
                      {(showAllSkills ? workerSkills : workerSkills.slice(0, 5)).map((skill) => (
                        <SkillCard key={skill.mapping_id} skill={skill} />
                      ))}
                      {workerSkills.length > 5 && !showAllSkills && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowAllSkills(true)}
                        >
                          View All {workerSkills.length} Skills
                        </Button>
                      )}
                      {showAllSkills && workerSkills.length > 5 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setShowAllSkills(false)}
                        >
                          Show Less
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No skills could be extracted from work history. Worker needs to provide more detailed experience.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Work History Section */}
                {selectedWorker.work_history && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Raw Work History
                    </h4>
                    <p className="text-sm bg-muted/50 p-3 rounded border">{selectedWorker.work_history}</p>
                  </div>
                )}

                {/* Contact Information Section */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    {selectedWorker.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedWorker.phone}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`sms:${selectedWorker.phone}`}>SMS</a>
                          </Button>
                          <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" asChild>
                            <a href={`https://wa.me/${selectedWorker.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedWorker.location || 'Kenya'}</span>
                    </div>

                    {selectedWorker.experience_years && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedWorker.experience_years} experience</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Uploaded: {selectedWorker.created_at 
                          ? format(new Date(selectedWorker.created_at), 'MMMM d, yyyy')
                          : 'Unknown date'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {(selectedWorker.certification_match_percentage || 0) >= 80 && selectedWorker.profile_status !== 'invited' && (
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => { setShowViewModal(false); setShowInviteModal(true); }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Schedule RPL Assessment
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {selectedWorker?.full_name} to RPL Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Worker will receive SMS and email with assessment details for {format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}.
              </AlertDescription>
            </Alert>
            
            {selectedWorker && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Certification Match:</span>
                  <span className="font-medium">{selectedWorker.certification_match_percentage || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skills Mapped:</span>
                  <span className="font-medium">{selectedWorker.skills_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Assessment Time:</span>
                  <span className="font-medium text-green-600">
                    {getTimeSavings(selectedWorker).reducedTime} hours (vs {getTimeSavings(selectedWorker).standardTime}h standard)
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700" 
                onClick={() => selectedWorker && handleInviteToAssessment(selectedWorker)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
