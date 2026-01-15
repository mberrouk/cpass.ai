import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, FileX, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoBatch {
  batch_id: string;
  source_file_name: string;
  worker_count: number;
  uploaded_at: string;
}

interface DemoDataManagerProps {
  institutionCode: string;
}

export default function DemoDataManager({ institutionCode }: DemoDataManagerProps) {
  const [demoBatches, setDemoBatches] = useState<DemoBatch[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDemoBatches();
  }, [institutionCode]);

  const fetchDemoBatches = async () => {
    try {
      const { data } = await supabase
        .from('upload_batches')
        .select('batch_id, source_file_name, worker_count, created_at')
        .eq('institution_code', institutionCode)
        .eq('upload_mode', 'demo')
        .order('created_at', { ascending: false });

      if (data) {
        setDemoBatches(data.map(b => ({
          batch_id: b.batch_id,
          source_file_name: b.source_file_name || 'Unknown file',
          worker_count: b.worker_count || 0,
          uploaded_at: b.created_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching demo batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purgeBatch = async (batchId: string) => {
    setIsDeleting(true);
    try {
      // Delete workers first (cascade should handle this, but being explicit)
      await supabase
        .from('bulk_uploaded_workers')
        .delete()
        .eq('batch_id', batchId);

      // Delete skill mappings
      await supabase
        .from('skill_mappings')
        .delete()
        .eq('batch_id', batchId);

      // Delete column mappings
      await supabase
        .from('column_mappings')
        .delete()
        .eq('batch_id', batchId);

      // Delete the batch
      await supabase
        .from('upload_batches')
        .delete()
        .eq('batch_id', batchId);

      toast.success('Demo batch purged successfully');
      fetchDemoBatches();
    } catch (error) {
      console.error('Error purging batch:', error);
      toast.error('Failed to purge demo batch');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
      setBatchToDelete(null);
    }
  };

  const purgeAllDemo = async () => {
    setIsDeleting(true);
    try {
      // Get all demo batch IDs
      const batchIds = demoBatches.map(b => b.batch_id);

      // Delete all related data
      for (const batchId of batchIds) {
        await supabase.from('bulk_uploaded_workers').delete().eq('batch_id', batchId);
        await supabase.from('skill_mappings').delete().eq('batch_id', batchId);
        await supabase.from('column_mappings').delete().eq('batch_id', batchId);
        await supabase.from('upload_batches').delete().eq('batch_id', batchId);
      }

      toast.success('All demo data purged successfully');
      fetchDemoBatches();
    } catch (error) {
      console.error('Error purging all demo data:', error);
      toast.error('Failed to purge all demo data');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
      setBatchToDelete(null);
    }
  };

  const totalDemoWorkers = demoBatches.reduce((sum, batch) => sum + batch.worker_count, 0);

  if (isLoading) {
    return (
      <Card className="border-muted">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
            <Trash2 className="w-5 h-5" />
            Manage Demo Data
          </CardTitle>
          <CardDescription>
            Clear demonstration uploads to reset for new demos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {demoBatches.length > 0 ? (
            <>
              <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-100">
                  Demo data can be safely deleted. Production uploads are protected.
                </AlertDescription>
              </Alert>

              {/* List demo batches */}
              <div className="space-y-3">
                {demoBatches.map(batch => (
                  <div key={batch.batch_id} className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{batch.source_file_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {batch.worker_count} workers • {new Date(batch.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                        Demo
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setBatchToDelete(batch.batch_id);
                          setShowConfirm(true);
                        }}
                        className="text-red-600 hover:bg-red-50 border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk purge all */}
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setBatchToDelete('all');
                    setShowConfirm(true);
                  }}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Purge All Demo Data ({totalDemoWorkers} workers)
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This will permanently delete all demo uploads
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No demo data to purge</p>
              <p className="text-xs mt-1">Demo uploads will appear here for cleanup</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {batchToDelete === 'all' 
                ? `This will permanently delete ${totalDemoWorkers} demo worker profiles. This action cannot be undone.`
                : 'This will permanently delete this demo batch. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => batchToDelete === 'all' ? purgeAllDemo() : purgeBatch(batchToDelete!)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
