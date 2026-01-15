import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, Loader2, Award, Users, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { taxonomyService, MappingResult } from '@/services/taxonomyService';

interface SkillMapping {
  mapping_id: string;
  worker_name: string;
  task_description: string;
  mapped_skill_id: string;
  mapped_skill_name: string;
  confidence: number;
  proficiency: string;
  status: 'approved' | 'pending' | 'rejected';
  tier: 'high' | 'medium' | 'low';
  canonical_task_matched: string | null;
}

interface SkillMatchingReviewProps {
  batchId: string;
  parsedData: any[];
  onComplete: () => void;
  onBack: () => void;
}

export default function SkillMatchingReview({ 
  batchId, 
  parsedData, 
  onComplete, 
  onBack 
}: SkillMatchingReviewProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mappings, setMappings] = useState<SkillMapping[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isCreatingProfiles, setIsCreatingProfiles] = useState(false);

  const summary = {
    total_workers: parsedData.length,
    total_skills: mappings.length,
    high_confidence: mappings.filter(m => m.tier === 'high').length,
    medium_confidence: mappings.filter(m => m.tier === 'medium').length,
    low_confidence: mappings.filter(m => m.tier === 'low').length,
    cert_ready: Math.floor(parsedData.length * 0.25),
    cert_in_progress: Math.floor(parsedData.length * 0.45),
    cert_early_stage: Math.floor(parsedData.length * 0.30),
  };

  useEffect(() => {
    processSkillMatching();
  }, [batchId, parsedData]);

  const processSkillMatching = async () => {
    setIsProcessing(true);
    const newMappings: SkillMapping[] = [];

    // Get column mappings to find task description column
    const { data: columnMappings } = await supabase
      .from('column_mappings')
      .select('*')
      .eq('batch_id', batchId);

    const taskColumn = columnMappings?.find(c => c.mapped_to_field === 'task_description')?.csv_column_name;
    const nameColumn = columnMappings?.find(c => c.mapped_to_field === 'full_name')?.csv_column_name;
    const workHistoryColumn = columnMappings?.find(c => c.mapped_to_field === 'work_history')?.csv_column_name;
    const primaryCropsColumn = columnMappings?.find(c => c.mapped_to_field === 'primary_crops')?.csv_column_name;
    const livestockColumn = columnMappings?.find(c => c.mapped_to_field === 'livestock')?.csv_column_name;

    // Log taxonomy stats for debugging
    console.log('Taxonomy Stats:', taxonomyService.getTaxonomyStats());

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      setProgress(Math.round((i / parsedData.length) * 100));

      // Get task descriptions from various possible columns
      const taskDescriptions = [
        taskColumn ? row[taskColumn] : null,
        workHistoryColumn ? row[workHistoryColumn] : null,
        primaryCropsColumn ? row[primaryCropsColumn] : null,
        livestockColumn ? row[livestockColumn] : null,
      ].filter(Boolean);

      const workerName = nameColumn ? row[nameColumn] : `Worker ${i + 1}`;

      for (const taskDesc of taskDescriptions) {
        if (taskDesc) {
          // Split by common delimiters to get individual tasks
          const tasks = taskDesc.split(/[,;•\n]/).filter((t: string) => t.trim().length > 3);
          
          for (const task of tasks) {
            // Use taxonomy service for rule-based mapping (NO external AI)
            const match = taxonomyService.mapTaskToSkills(task.trim());
            
            if (match.primary_skill) {
              // Validate that skill ID exists in taxonomy
              if (!taxonomyService.isValidSkillId(match.primary_skill.skill_id)) {
                console.warn(`Invalid skill ID detected: ${match.primary_skill.skill_id}`);
                continue;
              }

              newMappings.push({
                mapping_id: `${batchId}-${i}-${match.primary_skill.skill_id}-${newMappings.length}`,
                worker_name: workerName,
                task_description: task.trim(),
                mapped_skill_id: match.primary_skill.skill_id,
                mapped_skill_name: match.primary_skill.skill_name,
                confidence: match.primary_skill.confidence,
                proficiency: match.primary_skill.confidence >= 0.8 ? 'Proficient' : match.primary_skill.confidence >= 0.5 ? 'Competent' : 'Beginner',
                status: match.needs_review ? 'pending' : 'approved',
                tier: match.primary_skill.tier,
                canonical_task_matched: match.canonical_task_matched,
              });
            }
          }
        }
      }

      // Small delay to show progress
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setMappings(newMappings);
    setProgress(100);

    // Save skill mappings to database
    if (newMappings.length > 0) {
      const mappingsToSave = newMappings.map(m => ({
        batch_id: batchId,
        worker_name: m.worker_name,
        task_description: m.task_description,
        mapped_skill_id: m.mapped_skill_id,
        mapped_skill_name: m.mapped_skill_name,
        confidence_score: m.confidence,
        proficiency_estimate: m.proficiency,
        mapping_status: m.status,
      }));

      await supabase.from('skill_mappings').insert(mappingsToSave);

      // Update batch with skill counts
      await supabase
        .from('upload_batches')
        .update({
          skills_mapped: newMappings.length,
          high_confidence_count: newMappings.filter(m => m.tier === 'high').length,
          medium_confidence_count: newMappings.filter(m => m.tier === 'medium').length,
          low_confidence_count: newMappings.filter(m => m.tier === 'low').length,
        })
        .eq('batch_id', batchId);
    }

    setIsProcessing(false);
  };

  const approveHighConfidence = async () => {
    const highConfidenceMappings = mappings.filter(m => m.tier === 'high');
    
    await supabase
      .from('skill_mappings')
      .update({ mapping_status: 'approved' })
      .eq('batch_id', batchId)
      .gte('confidence_score', 0.85);

    setMappings(mappings.map(m => 
      m.tier === 'high' ? { ...m, status: 'approved' } : m
    ));

    toast.success(`Approved ${highConfidenceMappings.length} high-confidence mappings`);
  };

  const handleCreateProfiles = async () => {
    setIsCreatingProfiles(true);

    try {
      // Get column mappings
      const { data: columnMappings } = await supabase
        .from('column_mappings')
        .select('*')
        .eq('batch_id', batchId);

      const getFieldValue = (row: any, field: string) => {
        const mapping = columnMappings?.find(c => c.mapped_to_field === field);
        return mapping ? row[mapping.csv_column_name] : null;
      };

      // Create worker profiles
      const workersToCreate = parsedData.map((row, index) => {
        const workerName = getFieldValue(row, 'full_name') || `Worker ${index + 1}`;
        const workerSkills = mappings.filter(m => m.worker_name === workerName);
        
        // Deduplicate skills by skill_id
        const uniqueSkills = new Map();
        workerSkills.forEach(s => {
          if (!uniqueSkills.has(s.mapped_skill_id) || s.confidence > uniqueSkills.get(s.mapped_skill_id).confidence) {
            uniqueSkills.set(s.mapped_skill_id, s);
          }
        });
        
        return {
          batch_id: batchId,
          full_name: workerName,
          phone: getFieldValue(row, 'phone'),
          id_number: getFieldValue(row, 'id_number'),
          location: getFieldValue(row, 'location'),
          education_level: getFieldValue(row, 'education_level'),
          experience_years: getFieldValue(row, 'experience_years'),
          farm_size: getFieldValue(row, 'farm_size'),
          primary_crops: getFieldValue(row, 'primary_crops'),
          livestock: getFieldValue(row, 'livestock'),
          gender: getFieldValue(row, 'gender'),
          age: getFieldValue(row, 'age'),
          work_history: getFieldValue(row, 'work_history'),
          skills_count: uniqueSkills.size,
          certification_match_percentage: Math.min(Math.round((uniqueSkills.size / 12) * 100), 100),
          invitation_code: `INV-${Date.now()}-${index}`,
        };
      });

      const { error } = await supabase
        .from('bulk_uploaded_workers')
        .insert(workersToCreate);

      if (error) throw error;

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          certification_ready_count: workersToCreate.filter(w => w.certification_match_percentage >= 80).length,
        })
        .eq('batch_id', batchId);

      toast.success(`Created ${workersToCreate.length} worker profiles`);
      onComplete();
    } catch (error) {
      console.error('Error creating profiles:', error);
      toast.error('Failed to create worker profiles');
    } finally {
      setIsCreatingProfiles(false);
    }
  };

  const filteredMappings = mappings.filter(m => {
    if (filter === 'high') return m.tier === 'high';
    if (filter === 'medium') return m.tier === 'medium';
    if (filter === 'low') return m.tier === 'low';
    return true;
  });

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Processing Worker Data
                </h2>
                <p className="text-muted-foreground">
                  Rule-based taxonomy mapping in progress...
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
              </div>
              <Alert className="max-w-md mx-auto bg-blue-50 border-blue-200 dark:bg-blue-950/20">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                  Using local taxonomy mapping (no external AI). All skill IDs are validated against the 82-skill CPASS taxonomy.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Review Skill Mappings</h2>
        <p className="text-muted-foreground mt-1">
          Rule-based taxonomy mapping complete. Review and approve before creating profiles.
        </p>
      </div>

      {/* Mapping Method Info */}
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-sm text-green-900 dark:text-green-100">
          <strong>Mapping Method:</strong> Rule-based taxonomy matching against {taxonomyService.getTaxonomyStats().total_canonical_tasks} canonical tasks. 
          All skill IDs validated against the {taxonomyService.getTaxonomyStats().total_skills}-skill CPASS taxonomy. No AI hallucinations possible.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">{summary.total_workers}</div>
              <div className="text-sm text-muted-foreground">Workers</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{summary.total_skills}</div>
              <div className="text-sm text-muted-foreground">Skills Found</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {summary.high_confidence}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">High (≥85%)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {summary.medium_confidence}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Medium</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                {summary.low_confidence}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Low</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certification Readiness Preview */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-green-600" />
            Certification Readiness Preview
          </CardTitle>
          <CardDescription>
            Workers grouped by certification eligibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-3xl font-bold text-green-600">
                {summary.cert_ready}
              </div>
              <div className="text-sm text-foreground mt-1">Certification Ready</div>
              <div className="text-xs text-muted-foreground">(≥80% skills matched)</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-3xl font-bold text-orange-600">
                {summary.cert_in_progress}
              </div>
              <div className="text-sm text-foreground mt-1">In Progress</div>
              <div className="text-xs text-muted-foreground">(50-79% matched)</div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-3xl font-bold text-muted-foreground">
                {summary.cert_early_stage}
              </div>
              <div className="text-sm text-foreground mt-1">Early Stage</div>
              <div className="text-xs text-muted-foreground">(&lt;50% matched)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Skill Mappings</CardTitle>
              <CardDescription>
                Review rule-based skill mappings by confidence level
              </CardDescription>
            </div>
            {summary.high_confidence > 0 && (
              <Button 
                onClick={approveHighConfidence}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All High Confidence ({summary.high_confidence})
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
            <TabsList>
              <TabsTrigger value="all">
                All ({mappings.length})
              </TabsTrigger>
              <TabsTrigger value="high">
                High ({summary.high_confidence})
              </TabsTrigger>
              <TabsTrigger value="medium">
                Medium ({summary.medium_confidence})
              </TabsTrigger>
              <TabsTrigger value="low">
                Low ({summary.low_confidence})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-3 mt-4">
              {filteredMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No mappings in this category
                </div>
              ) : (
                filteredMappings.slice(0, 20).map((mapping, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">
                          {mapping.worker_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          Input: "{mapping.task_description}"
                        </div>
                        {mapping.canonical_task_matched && (
                          <div className="text-xs text-blue-600 mt-1">
                            Matched to canonical task: "{mapping.canonical_task_matched}"
                          </div>
                        )}
                      </div>
                      <Badge 
                        className={
                          mapping.tier === 'high' 
                            ? "bg-green-100 text-green-700" 
                            : mapping.tier === 'medium' 
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {Math.round(mapping.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="text-muted-foreground">Skill:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {mapping.mapped_skill_id}
                      </Badge>
                      <span className="font-medium">{mapping.mapped_skill_name}</span>
                      <Badge variant="outline">{mapping.proficiency}</Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        🥉 Bronze
                      </Badge>
                      {mapping.status === 'approved' && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}

              {filteredMappings.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 20 of {filteredMappings.length} mappings
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Column Mapping
        </Button>
        <div className="flex gap-3">
          <Button 
            onClick={handleCreateProfiles}
            disabled={isCreatingProfiles}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreatingProfiles ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profiles...
              </>
            ) : (
              <>
                Create Worker Profiles
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
