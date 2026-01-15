import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tvetClient } from '@/integrations/django/tvetClient';
import { toast } from 'sonner';
import DemoDataManagerDjango from './DemoDataManagerDjango';

interface BulkUploadTabDjangoProps {
  institutionCode: string;
}

export default function BulkUploadTabDjango({ institutionCode }: BulkUploadTabDjangoProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadMode, setUploadMode] = useState<'demo' | 'production'>('demo');
  const queryClient = useQueryClient();

  // Parse CSV mutation
  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await tvetClient.parseCSV(file);
      if (error) throw new Error(error.message || 'Failed to parse CSV');
      return data;
    },
    onSuccess: (data) => {
      setCSVData(data);
      // Auto-map common columns
      const autoMapping: Record<string, string> = {};
      data?.headers.forEach((header: string) => {
        const lower = header.toLowerCase();
        if (lower.includes('name')) autoMapping['full_name'] = header;
        if (lower.includes('email')) autoMapping['email'] = header;
        if (lower.includes('phone')) autoMapping['phone_number'] = header;
        if (lower.includes('location')) autoMapping['location'] = header;
      });
      setColumnMapping(autoMapping);
      toast.success('CSV parsed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to parse CSV');
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !csvData) throw new Error('No file selected');
      
      // Create batch
      const { data: batch, error: batchError } = await tvetClient.createUploadBatch(
        selectedFile.name,
        uploadMode
      );
      if (batchError || !batch) throw new Error('Failed to create batch');

      // Process upload
      const { data: result, error: processError } = await tvetClient.processBulkUpload(
        batch.batch_id,
        csvData.preview_rows,
        columnMapping
      );
      if (processError) throw new Error('Failed to process upload');
      
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result?.created_count || 0} workers`);
      setSelectedFile(null);
      setCSVData(null);
      setColumnMapping({});
      queryClient.invalidateQueries({ queryKey: ['rpl-candidates-django'] });
      queryClient.invalidateQueries({ queryKey: ['tvet-dashboard-stats-django'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Upload failed');
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseMutation.mutate(file);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bulk Upload Workers</h2>
        <p className="text-muted-foreground">Upload CSV file to import multiple RPL candidates at once</p>
      </div>

      {/* Upload Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={uploadMode === 'demo' ? 'default' : 'outline'}
              onClick={() => setUploadMode('demo')}
            >
              Demo Mode (Can be deleted)
            </Button>
            <Button
              variant={uploadMode === 'production' ? 'default' : 'outline'}
              onClick={() => setUploadMode('production')}
            >
              Production Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                {selectedFile ? selectedFile.name : 'Select a CSV file to upload'}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>

            {parseMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing CSV...</span>
              </div>
            )}

            {csvData && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Preview ({csvData.total_rows} rows)</h3>
                  <div className="text-sm text-muted-foreground">
                    Headers: {csvData.headers.join(', ')}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Column Mapping</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['full_name', 'email', 'phone_number', 'location', 'tier'].map(field => (
                      <div key={field}>
                        <label className="text-sm font-medium">{field}</label>
                        <select
                          className="w-full border rounded p-2 mt-1"
                          value={columnMapping[field] || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                        >
                          <option value="">-- Select Column --</option>
                          {csvData.headers.map((header: string) => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !columnMapping.full_name}
                  className="w-full"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Workers
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demo Data Manager */}
      {uploadMode === 'demo' && (
        <DemoDataManagerDjango institutionCode={institutionCode} />
      )}
    </div>
  );
}
