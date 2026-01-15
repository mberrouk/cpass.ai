import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Award, Mail, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BulkUploadCompleteProps {
  batchId: string;
  onUploadMore: () => void;
}

interface BatchSummary {
  worker_count: number;
  skills_mapped: number;
  certification_ready: number;
  in_progress: number;
  early_stage: number;
  source_file_name: string;
  upload_mode: string;
}

export default function BulkUploadComplete({ batchId, onUploadMore }: BulkUploadCompleteProps) {
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [invitationsSent, setInvitationsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [batchId]);

  const fetchSummary = async () => {
    try {
      // Fetch batch info
      const { data: batch } = await supabase
        .from('upload_batches')
        .select('*')
        .eq('batch_id', batchId)
        .single();

      // Fetch workers
      const { data: workers } = await supabase
        .from('bulk_uploaded_workers')
        .select('*')
        .eq('batch_id', batchId);

      if (batch && workers) {
        const certReady = workers.filter(w => w.certification_match_percentage >= 80).length;
        const inProgress = workers.filter(w => w.certification_match_percentage >= 50 && w.certification_match_percentage < 80).length;
        const earlyStage = workers.filter(w => w.certification_match_percentage < 50).length;

        setSummary({
          worker_count: workers.length,
          skills_mapped: batch.skills_mapped || 0,
          certification_ready: certReady,
          in_progress: inProgress,
          early_stage: earlyStage,
          source_file_name: batch.source_file_name || 'Unknown',
          upload_mode: batch.upload_mode,
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvitations = async () => {
    setIsGenerating(true);
    try {
      // Update all workers with invitation sent timestamp
      await supabase
        .from('bulk_uploaded_workers')
        .update({ 
          profile_status: 'invited',
          invitation_sent_at: new Date().toISOString() 
        })
        .eq('batch_id', batchId);

      setInvitationsSent(true);
      toast.success('Invitation codes generated successfully!');
    } catch (error) {
      console.error('Error generating invitations:', error);
      toast.error('Failed to generate invitations');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadInvitationList = async () => {
    try {
      const { data: workers } = await supabase
        .from('bulk_uploaded_workers')
        .select('full_name, phone, invitation_code, certification_match_percentage')
        .eq('batch_id', batchId);

      if (workers) {
        const csv = [
          'Name,Phone,Invitation Code,Certification Match %',
          ...workers.map(w => `${w.full_name},${w.phone || ''},${w.invitation_code},${w.certification_match_percentage}`)
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invitations-${batchId.slice(0, 8)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading list:', error);
      toast.error('Failed to download invitation list');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load summary</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Bulk Upload Complete! 🎉
        </h2>
        <p className="text-muted-foreground">
          {summary.worker_count} worker profiles created successfully
        </p>
        {summary.upload_mode === 'demo' && (
          <Badge className="mt-2 bg-blue-100 text-blue-700">Demo Mode</Badge>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {summary.worker_count}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Worker Profiles Created</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {summary.skills_mapped}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Skills Mapped</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {summary.certification_ready}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Certification Ready</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Readiness Breakdown</CardTitle>
          <CardDescription>
            Workers categorized by RPL eligibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <div>
                <div className="font-semibold text-green-900 dark:text-green-100">Certification Ready</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  ≥80% skills matched • Can apply for RPL immediately
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {summary.certification_ready}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <div>
                <div className="font-semibold text-orange-900 dark:text-orange-100">In Progress</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  50-79% matched • Need 1-3 more skills
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {summary.in_progress}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div>
                <div className="font-semibold text-foreground">Early Stage</div>
                <div className="text-sm text-muted-foreground">
                  &lt;50% matched • Require additional training
                </div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                {summary.early_stage}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Worker Invitations
          </CardTitle>
          <CardDescription>
            Invite workers to claim and verify their profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invitationsSent ? (
            <>
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                  Each worker will receive a unique invitation code via SMS to claim their profile.
                  Workers can review, verify, and add evidence to their skills.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={generateInvitations}
                  disabled={isGenerating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Generate Invitation Codes
                </Button>
                <Button 
                  variant="outline"
                  onClick={downloadInvitationList}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download List
                </Button>
              </div>
            </>
          ) : (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900 dark:text-green-100">
                <strong>Invitation codes generated!</strong> 
                <br />
                Download the list to share invitation codes with workers.
              </AlertDescription>
            </Alert>
          )}

          {invitationsSent && (
            <Button 
              variant="outline"
              onClick={downloadInvitationList}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invitation List
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button 
          variant="outline"
          onClick={() => window.location.href = '/dashboard/tvet'}
        >
          View Dashboard
        </Button>
        <Button 
          onClick={onUploadMore}
          className="bg-primary hover:bg-primary/90"
        >
          Upload More Workers
        </Button>
      </div>
    </div>
  );
}
