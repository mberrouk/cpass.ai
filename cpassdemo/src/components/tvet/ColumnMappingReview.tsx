import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ColumnMapping {
  csvColumn: string;
  mappedField: string;
  confidence: number;
  sampleValues: string[];
}

interface ColumnMappingReviewProps {
  batchId: string;
  csvHeaders: string[];
  parsedData: any[];
  onComplete: () => void;
  onBack: () => void;
}

const FIELD_OPTIONS = [
  { value: 'full_name', label: 'Worker Name' },
  { value: 'id_number', label: 'ID Number' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'location', label: 'Location (County/Region)' },
  { value: 'education_level', label: 'Education Level' },
  { value: 'experience_years', label: 'Years of Experience' },
  { value: 'farm_size', label: 'Farm Size (Acres)' },
  { value: 'primary_crops', label: 'Primary Crops/Enterprises' },
  { value: 'livestock', label: 'Livestock Type & Count' },
  { value: 'task_description', label: 'Task Description' },
  { value: 'work_history', label: 'Work History/Background' },
  { value: 'gender', label: 'Gender' },
  { value: 'age', label: 'Age' },
  { value: 'ignore', label: '⊘ Ignore this column' },
];

const FIELD_KEYWORDS: Record<string, string[]> = {
  full_name: ['name', 'worker', 'person', 'respondent', 'farmer'],
  id_number: ['id', 'national', 'identification'],
  phone: ['phone', 'mobile', 'tel', 'contact', 'number'],
  location: ['location', 'county', 'region', 'area', 'village', 'ward'],
  education_level: ['education', 'school', 'level', 'qualification'],
  experience_years: ['experience', 'years', 'duration'],
  farm_size: ['farm', 'size', 'acres', 'hectares', 'land'],
  primary_crops: ['crop', 'crops', 'enterprise', 'farming', 'produce'],
  livestock: ['livestock', 'animal', 'cattle', 'goat', 'poultry', 'sheep'],
  task_description: ['task', 'activity', 'work', 'job', 'duties', 'skills', 'what'],
  work_history: ['history', 'background', 'previous', 'employment'],
  gender: ['gender', 'sex'],
  age: ['age', 'dob', 'birth'],
};

export default function ColumnMappingReview({ 
  batchId, 
  csvHeaders, 
  parsedData, 
  onComplete, 
  onBack 
}: ColumnMappingReviewProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Auto-detect column mappings
    const detectedMappings = csvHeaders.map(header => {
      const headerLower = header.toLowerCase();
      let bestMatch = 'ignore';
      let bestConfidence = 0;

      for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
        for (const keyword of keywords) {
          if (headerLower.includes(keyword)) {
            const confidence = keyword.length / headerLower.length;
            if (confidence > bestConfidence) {
              bestConfidence = Math.min(confidence * 1.5, 0.95);
              bestMatch = field;
            }
          }
        }
      }

      // Get sample values
      const sampleValues = parsedData
        .slice(0, 3)
        .map(row => row[header])
        .filter(Boolean);

      return {
        csvColumn: header,
        mappedField: bestMatch,
        confidence: bestConfidence || 0.3,
        sampleValues,
      };
    });

    setMappings(detectedMappings);
  }, [csvHeaders, parsedData]);

  const updateMapping = (csvColumn: string, newField: string) => {
    setMappings(mappings.map(m => 
      m.csvColumn === csvColumn ? { ...m, mappedField: newField, confidence: 1.0 } : m
    ));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          High ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Medium ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Low ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
  };

  const handleProceed = async () => {
    setIsSaving(true);
    
    try {
      // Save column mappings to database
      const mappingsToSave = mappings.map(m => ({
        batch_id: batchId,
        csv_column_name: m.csvColumn,
        mapped_to_field: m.mappedField,
        confidence_score: m.confidence,
      }));

      const { error } = await supabase
        .from('column_mappings')
        .insert(mappingsToSave);

      if (error) throw error;

      toast.success('Column mappings saved');
      onComplete();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to save column mappings');
    } finally {
      setIsSaving(false);
    }
  };

  const activeMappings = mappings.filter(m => m.mappedField !== 'ignore');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Verify Column Mapping</h2>
        <p className="text-muted-foreground mt-1">
          Confirm how CSV columns map to worker profile fields
        </p>
      </div>

      {/* Mapping Review Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Detected Column Mappings
          </CardTitle>
          <CardDescription>
            Review auto-detected mappings. Adjust if needed before proceeding.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mappings List */}
          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                {/* CSV Column */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{mapping.csvColumn}</div>
                  <div className="text-xs text-muted-foreground">From CSV</div>
                  {mapping.sampleValues.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Sample: {mapping.sampleValues.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                {/* Mapped Field Selector */}
                <div className="flex-1 min-w-[200px]">
                  <Select 
                    value={mapping.mappedField}
                    onValueChange={(value) => updateMapping(mapping.csvColumn, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confidence Badge */}
                <div className="flex-shrink-0">
                  {getConfidenceBadge(mapping.confidence)}
                </div>
              </div>
            ))}
          </div>

          {/* Preview Data */}
          {activeMappings.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">Preview (First 3 Rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeMappings.map((m, i) => (
                        <TableHead key={i} className="text-xs whitespace-nowrap">
                          {FIELD_OPTIONS.find(f => f.value === m.mappedField)?.label || m.mappedField}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>
                        {activeMappings.map((m, j) => (
                          <TableCell key={j} className="text-xs">
                            {row[m.csvColumn] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <div className="flex gap-3">
              <Button 
                onClick={handleProceed}
                disabled={isSaving || activeMappings.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? 'Saving...' : 'Continue to Skill Mapping'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
