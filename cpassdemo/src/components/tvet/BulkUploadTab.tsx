import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DemoDataManager from "./DemoDataManager";
import {
  extractSkillsFromText,
  ExtractionContext,
} from "@/services/skillExtractionService";
import { calculateCertificationReadiness } from "@/services/bulkUploadProcessor";

interface BulkUploadTabProps {
  institutionCode: string;
}

interface ParsedWorker {
  full_name: string;
  phone: string;
  tasks: string[];
  raw: Record<string, string>;
}

export default function BulkUploadTab({ institutionCode }: BulkUploadTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedWorkers, setParsedWorkers] = useState<ParsedWorker[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const [createdCount, setCreatedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadStats, setUploadStats] = useState({
    skillsMapped: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    avgSkillsPerWorker: 0,
    readyCount: 0,
    inProgressCount: 0,
    earlyStageCount: 0,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
      setErrors([]);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const parseCSV = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setErrors([
          "CSV file must have a header row and at least one data row",
        ]);
        setIsProcessing(false);
        return;
      }

      // Parse headers
      const headerRow = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, "").toLowerCase());
      setHeaders(headerRow);

      // Find key columns (flexible matching)
      const nameCol = headerRow.findIndex(
        (h) =>
          h.includes("name") ||
          h.includes("full_name") ||
          h.includes("fullname")
      );
      const phoneCol = headerRow.findIndex(
        (h) => h.includes("phone") || h.includes("mobile") || h.includes("tel")
      );
      const taskCols = headerRow
        .map((h, i) => ({ header: h, index: i }))
        .filter(
          ({ header }) =>
            header.includes("task") ||
            header.includes("skill") ||
            header.includes("work") ||
            header.includes("experience")
        )
        .map(({ index }) => index);

      if (nameCol === -1) {
        setErrors([
          'Could not find a "name" column in CSV. Expected: name, full_name, or fullname',
        ]);
        setIsProcessing(false);
        return;
      }

      // Parse data rows
      const workers: ParsedWorker[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((v) => v.trim().replace(/"/g, ""));

        const fullName = values[nameCol];
        if (!fullName || fullName.length < 2) {
          parseErrors.push(`Row ${i + 1}: Invalid or missing name`);
          continue;
        }

        const phone = phoneCol !== -1 ? values[phoneCol] : "";
        const tasks = taskCols
          .map((col) => values[col])
          .filter((t) => t && t.length > 0);

        // Build raw record
        const raw: Record<string, string> = {};
        headerRow.forEach((header, idx) => {
          raw[header] = values[idx] || "";
        });

        workers.push({ full_name: fullName, phone, tasks, raw });
      }

      if (workers.length === 0) {
        setErrors(["No valid workers found in CSV", ...parseErrors]);
        setIsProcessing(false);
        return;
      }

      setParsedWorkers(workers);
      setStep("preview");
      toast.success(`Found ${workers.length} workers in CSV`);

      if (parseErrors.length > 0) {
        setErrors(parseErrors.slice(0, 5)); // Show first 5 errors
      }
    } catch (error) {
      console.error("Parse error:", error);
      setErrors(["Failed to parse CSV file. Please check the format."]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createWorkerProfiles = async () => {
    setIsProcessing(true);
    setErrors([]);

    let created = 0;
    let skillsMapped = 0;
    let highConfidenceCount = 0;
    let mediumConfidenceCount = 0;
    let lowConfidenceCount = 0;
    const insertErrors: string[] = [];

    try {
      // First create an upload batch in demo mode (allowed by RLS)
      const { data: batch, error: batchError } = await supabase
        .from("upload_batches")
        .insert({
          institution_code: institutionCode,
          upload_mode: "demo",
          source_file_name: selectedFile?.name || "upload.csv",
          worker_count: parsedWorkers.length,
          processing_status: "processing",
        })
        .select()
        .single();

      if (batchError) {
        console.error("Batch creation error:", batchError);
        setErrors([`Failed to create upload batch: ${batchError.message}`]);
        setIsProcessing(false);
        return;
      }

      const batchId = batch.batch_id;
      console.log("Created batch:", batchId);

      // Insert workers and process skill mappings
      for (const worker of parsedWorkers) {
        try {
          // Insert worker profile
          const { data: workerData, error } = await supabase
            .from("bulk_uploaded_workers")
            .insert({
              batch_id: batchId,
              full_name: worker.full_name,
              phone: worker.phone || null,
              profile_status: "unclaimed",
              work_history: worker.tasks.join("; ") || null,
              location: worker.raw["location"] || worker.raw["county"] || null,
              education_level:
                worker.raw["education"] ||
                worker.raw["education_level"] ||
                null,
              experience_years:
                worker.raw["experience"] || worker.raw["years"] || null,
              invitation_code: generateInviteCode(),
            })
            .select()
            .single();

          if (error) {
            console.error("Insert error for", worker.full_name, error);
            insertErrors.push(`${worker.full_name}: ${error.message}`);
            continue;
          }

          created++;

          // Process skill mappings using enhanced skill extraction service
          if (worker.tasks.length > 0 && workerData) {
            const workHistory = worker.tasks.join("; ");
            const context: ExtractionContext = {
              years_experience:
                worker.raw["experience"] || worker.raw["years"] || undefined,
              work_type:
                worker.raw["work_type"] || worker.raw["type"] || undefined,
            };

            const extractedSkills = await extractSkillsFromText(
              workHistory,
              context
            );
            const uniqueSkillIds = new Set<string>();

            for (const skill of extractedSkills) {
              uniqueSkillIds.add(skill.skill_id);
              skillsMapped++;

              // Track confidence levels
              if (skill.confidence >= 0.85) highConfidenceCount++;
              else if (skill.confidence >= 0.6) mediumConfidenceCount++;
              else lowConfidenceCount++;

              // Save skill mapping to database
              const { error: skillInsertError } = await supabase
                .from("skill_mappings")
                .insert({
                  batch_id: batchId,
                  worker_id: workerData.id,
                  worker_name: worker.full_name,
                  user_input_task: skill.source_text,
                  canonical_task_matched: skill.matched_phrase,
                  mapped_skill_id: skill.skill_id,
                  mapped_skill_name: skill.skill_name,
                  confidence_score: skill.confidence,
                  confidence_tier:
                    skill.confidence >= 0.85
                      ? "high"
                      : skill.confidence >= 0.6
                      ? "medium"
                      : "low",
                  matching_method: "enhanced_extraction",
                  verification_tier: "Bronze",
                  proficiency_estimate:
                    skill.estimated_proficiency <= 4
                      ? "Beginner"
                      : skill.estimated_proficiency <= 7
                      ? "Intermediate"
                      : "Advanced",
                  mapping_status:
                    skill.confidence >= 0.85 ? "approved" : "pending",
                  needs_review: skill.confidence < 0.85,
                });

              if (skillInsertError) {
                console.error(
                  "Skill insert error for",
                  worker.full_name,
                  ":",
                  skillInsertError.message
                );
              } else {
                console.log(
                  "Inserted skill:",
                  skill.skill_name,
                  "for worker:",
                  worker.full_name
                );
              }
            }

            // Calculate certification match using actual certification requirements
            const skillIds = Array.from(uniqueSkillIds);
            const certMatches = calculateCertificationReadiness(skillIds);
            const bestMatch = certMatches[0];
            const certMatchPercentage = bestMatch
              ? Math.round(bestMatch.match_percentage * 100)
              : Math.min(100, Math.round((skillIds.length / 12) * 100));

            // Update worker with skills count and certification match
            await supabase
              .from("bulk_uploaded_workers")
              .update({
                skills_count: skillIds.length,
                certification_match_percentage: certMatchPercentage,
              })
              .eq("id", workerData.id);
          }
        } catch (err) {
          console.error("Unexpected error for", worker.full_name, err);
          insertErrors.push(`${worker.full_name}: Unexpected error`);
        }
      }

      // Update batch with final counts including skill mapping stats
      await supabase
        .from("upload_batches")
        .update({
          worker_count: created,
          skills_mapped: skillsMapped,
          high_confidence_count: highConfidenceCount,
          medium_confidence_count: mediumConfidenceCount,
          low_confidence_count: lowConfidenceCount,
          processing_status: "completed",
          processing_completed_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);

      setCreatedCount(created);

      // Calculate readiness stats from the workers we just processed
      let readyCount = 0;
      let inProgressCount = 0;
      let earlyStageCount = 0;

      // Query the created workers to get their certification percentages
      const { data: createdWorkers } = await supabase
        .from("bulk_uploaded_workers")
        .select("certification_match_percentage")
        .eq("batch_id", batchId);

      if (createdWorkers) {
        createdWorkers.forEach((w) => {
          const pct = w.certification_match_percentage || 0;
          if (pct >= 80) readyCount++;
          else if (pct >= 50) inProgressCount++;
          else earlyStageCount++;
        });
      }

      setUploadStats({
        skillsMapped,
        highConfidence: highConfidenceCount,
        mediumConfidence: mediumConfidenceCount,
        lowConfidence: lowConfidenceCount,
        avgSkillsPerWorker: created > 0 ? skillsMapped / created : 0,
        readyCount,
        inProgressCount,
        earlyStageCount,
      });

      if (created > 0) {
        setStep("complete");
        toast.success(
          `Created ${created} worker profiles with ${skillsMapped} skills mapped`
        );
      }

      if (insertErrors.length > 0) {
        setErrors(insertErrors.slice(0, 10));
        if (created === 0) {
          toast.error("Failed to create worker profiles. Check RLS policies.");
        }
      }
    } catch (error) {
      console.error("Batch creation error:", error);
      setErrors(["Failed to create worker profiles. Database error."]);
      toast.error("Database error during profile creation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedWorkers([]);
    setHeaders([]);
    setStep("upload");
    setCreatedCount(0);
    setErrors([]);
  };

  // Complete step
  if (step === "complete") {
    const standardAssessmentHours = createdCount * 7;
    const reducedAssessmentHours = Math.round(createdCount * 2.5);
    const timeSaved = standardAssessmentHours - reducedAssessmentHours;
    const timeSavedPercent = Math.round(
      (timeSaved / standardAssessmentHours) * 100
    );

    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                Upload Complete!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Created {createdCount} worker profiles with{" "}
                {uploadStats.skillsMapped} skills mapped
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{createdCount}</div>
            <div className="text-xs text-muted-foreground">
              Workers Processed
            </div>
          </Card>
          <Card className="p-4 text-center">
            <BarChart3 className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold">{uploadStats.skillsMapped}</div>
            <div className="text-xs text-muted-foreground">
              Skills Extracted
            </div>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold">
              {uploadStats.avgSkillsPerWorker.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Skills/Worker
            </div>
          </Card>
          <Card className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
            <div className="text-2xl font-bold">
              {uploadStats.highConfidence}
            </div>
            <div className="text-xs text-muted-foreground">High Confidence</div>
          </Card>
        </div>

        {/* Certification Readiness */}
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Certification Readiness
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-700">
                {uploadStats.readyCount}
              </div>
              <div className="text-xs text-green-600">Ready (80%+)</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-xl font-bold text-yellow-700">
                {uploadStats.inProgressCount}
              </div>
              <div className="text-xs text-yellow-600">
                In Progress (50-79%)
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-700">
                {uploadStats.earlyStageCount}
              </div>
              <div className="text-xs text-gray-600">Early Stage (&lt;50%)</div>
            </div>
          </div>
        </Card>

        {/* Time Savings */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" /> Estimated Assessment Time
            Savings
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Standard:</div>
              <div className="font-medium">{standardAssessmentHours} hours</div>
            </div>
            <div>
              <div className="text-muted-foreground">With CPASS:</div>
              <div className="font-medium text-green-600">
                {reducedAssessmentHours} hours
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Saved:</div>
              <div className="font-bold text-green-600">
                ~{timeSaved}h ({timeSavedPercent}%)
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleReset}>
            Upload Another File
          </Button>
          <Button onClick={() => window.location.reload()}>
            View RPL Candidates
          </Button>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">
                {errors.length} workers had issues:
              </p>
              <ul className="text-sm">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Preview step
  if (step === "preview") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Review Worker Data
          </h2>
          <p className="text-muted-foreground mt-1">
            Preview the data before creating worker profiles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {parsedWorkers.length} Workers Found
            </CardTitle>
            <CardDescription>
              From {selectedFile?.name} • Detected {headers.length} columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Tasks/Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedWorkers.slice(0, 10).map((worker, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {worker.full_name}
                      </TableCell>
                      <TableCell>
                        {worker.phone || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {worker.tasks.length > 0 ? (
                          <span className="text-sm">
                            {worker.tasks.slice(0, 2).join(", ")}
                            {worker.tasks.length > 2
                              ? ` +${worker.tasks.length - 2} more`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No tasks found
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedWorkers.length > 10 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t">
                  ... and {parsedWorkers.length - 10} more workers
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Some rows had issues:</p>
                  <ul className="text-sm mt-1">
                    {errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            ← Back to Upload
          </Button>
          <Button
            onClick={createWorkerProfiles}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profiles...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create {parsedWorkers.length} Worker Profiles
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Upload step (default)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Bulk Upload Workers
        </h2>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file to create multiple worker profiles at once
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            CSV should have columns for name, phone (optional), and task
            descriptions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              selectedFile
                ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                : "border-muted-foreground/30 hover:border-primary"
            }`}
            onClick={() =>
              !selectedFile && document.getElementById("csv-upload")?.click()
            }
          >
            {selectedFile ? (
              <div className="space-y-3">
                <FileText className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setErrors([]);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium mb-1">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .csv files up to 10MB
                  </p>
                </div>
              </div>
            )}

            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Parse Button */}
          {selectedFile && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setErrors([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={parseCSV}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>Parse CSV →</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expected Format */}
      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Expected CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Your CSV should have these columns (flexible naming):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <Badge variant="outline" className="justify-center py-2">
              name / full_name
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              phone (optional)
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              task_1, task_2...
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              location (optional)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Demo Data Manager */}
      <DemoDataManager institutionCode={institutionCode} />
    </div>
  );
}
