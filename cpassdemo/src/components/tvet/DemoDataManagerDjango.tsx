import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tvetClient } from '@/integrations/django/tvetClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DemoDataManagerDjangoProps {
  institutionCode: string;
}

export default function DemoDataManagerDjango({ institutionCode }: DemoDataManagerDjangoProps) {
  const queryClient = useQueryClient();

  // Fetch demo batches
  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['demo-batches-django', institutionCode],
    queryFn: async () => {
      const { data, error } = await tvetClient.getUploadBatches('demo');
      if (error) {
        console.error('Failed to fetch batches:', error);
        return { batches: [], count: 0 };
      }
      return data || { batches: [], count: 0 };
    }
  });

  // Delete batch mutation
  const deleteMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await tvetClient.deleteUploadBatch(batchId);
      if (error) throw new Error(error.message || 'Failed to delete batch');
      return data;
    },
    onSuccess: () => {
      toast.success('Demo batch deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['demo-batches-django'] });
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-django'] });
      queryClient.invalidateQueries({ queryKey: ['tvet-dashboard-stats-django'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete batch');
    }
  });

  const batches = batchesData?.batches || [];

  if (batches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Data Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manage demo data that was uploaded for testing. Demo batches can be safely deleted.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Workers</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch.batch_id}>
                  <TableCell className="font-mono text-xs">{batch.batch_id}</TableCell>
                  <TableCell>{batch.source_file_name}</TableCell>
                  <TableCell>{batch.worker_count}</TableCell>
                  <TableCell>
                    {batch.created_at ? format(new Date(batch.created_at), 'PPp') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(batch.batch_id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
