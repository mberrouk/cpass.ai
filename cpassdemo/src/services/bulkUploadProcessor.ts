// Bulk Upload Processor Service
// Handles CSV parsing, data tier detection, worker processing, and skill extraction

import { supabase } from '@/integrations/supabase/client';
import { extractSkillsFromText, ExtractionContext, ExtractedSkill } from './skillExtractionService';

// ============= TYPES =============

export type DataTier = 'basic' | 'medium' | 'detailed';

export interface ParsedWorker {
  full_name: string;
  phone: string;
  location: string;
  education_level: string;
  years_experience: string;
  work_type: string;
  work_history: string;
  farm_size: string;
  frequency: string;
  supervision_level: string;
  tasks: string[];
  raw: Record<string, string>;
}

export interface BulkUploadResult {
  batchId: string;
  totalWorkers: number;
  processedWorkers: number;
  workersWithSkills: number;
  totalSkillsMapped: number;
  avgSkillsPerWorker: number;
  avgConfidence: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  dataTier: DataTier;
  errors: Array<{ row: number; error: string }>;
}

export interface CertificationMatch {
  cert_type: string;
  certification_name: string;
  certification_code: string;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_percentage: number;
}

// ============= DATA TIER DETECTION =============

/**
 * Detect the complexity tier of the CSV based on available columns
 */
export function detectDataTier(headers: string[]): DataTier {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for basic required columns
  const hasName = normalizedHeaders.some(h => 
    h.includes('name') || h.includes('fullname') || h.includes('full_name')
  );
  const hasWork = normalizedHeaders.some(h => 
    h.includes('work') || h.includes('task') || h.includes('skill') || h.includes('experience')
  );
  
  if (!hasName || !hasWork) {
    throw new Error('CSV must have at least name and work/task columns');
  }
  
  // Check for medium tier columns
  const hasMedium = normalizedHeaders.some(h => h.includes('years') || h.includes('experience_years')) &&
                    normalizedHeaders.some(h => h.includes('work_type') || h.includes('type'));
  
  // Check for detailed tier columns  
  const hasDetailed = hasMedium &&
                      normalizedHeaders.some(h => h.includes('farm_size') || h.includes('scale')) &&
                      normalizedHeaders.some(h => h.includes('frequency')) &&
                      normalizedHeaders.some(h => h.includes('supervision'));
  
  if (hasDetailed) return 'detailed';
  if (hasMedium) return 'medium';
  return 'basic';
}

// ============= CSV PARSING =============

/**
 * Parse CSV text into structured worker data
 */
export function parseCSV(csvText: string): { headers: string[]; workers: ParsedWorker[]; errors: string[] } {
  const lines = csvText.split('\n').filter(line => line.trim());
  const errors: string[] = [];
  
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Find column indices with flexible matching
  const colMap = {
    name: findColumn(headers, ['name', 'full_name', 'fullname', 'worker_name']),
    phone: findColumn(headers, ['phone', 'phone_number', 'mobile', 'tel', 'telephone']),
    location: findColumn(headers, ['location', 'county', 'region', 'area', 'district']),
    education: findColumn(headers, ['education', 'education_level', 'qualification']),
    years: findColumn(headers, ['years', 'years_experience', 'experience_years', 'experience']),
    workType: findColumn(headers, ['work_type', 'type', 'category', 'sector']),
    farmSize: findColumn(headers, ['farm_size', 'scale', 'size']),
    frequency: findColumn(headers, ['frequency', 'how_often']),
    supervision: findColumn(headers, ['supervision', 'supervision_level']),
  };
  
  // Find all task/work columns
  const taskColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(({ header }) => 
      header.includes('task') || 
      header.includes('skill') || 
      header.includes('work_history') ||
      header.includes('work_description') ||
      (header.includes('work') && !header.includes('type'))
    )
    .map(({ index }) => index);
  
  if (colMap.name === -1) {
    throw new Error('Could not find a "name" column in CSV');
  }
  
  // Parse data rows
  const workers: ParsedWorker[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    const fullName = values[colMap.name]?.trim();
    if (!fullName || fullName.length < 2) {
      errors.push(`Row ${i + 1}: Invalid or missing name`);
      continue;
    }
    
    // Extract tasks from all task columns
    const tasks = taskColumns
      .map(col => values[col]?.trim())
      .filter(t => t && t.length > 0);
    
    // Build work history from tasks
    const workHistory = tasks.join('; ');
    
    // Build raw record for reference
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = values[idx] || '';
    });
    
    workers.push({
      full_name: fullName,
      phone: colMap.phone !== -1 ? values[colMap.phone]?.trim() || '' : '',
      location: colMap.location !== -1 ? values[colMap.location]?.trim() || '' : '',
      education_level: colMap.education !== -1 ? values[colMap.education]?.trim() || '' : '',
      years_experience: colMap.years !== -1 ? values[colMap.years]?.trim() || '' : '',
      work_type: colMap.workType !== -1 ? values[colMap.workType]?.trim() || '' : '',
      farm_size: colMap.farmSize !== -1 ? values[colMap.farmSize]?.trim() || '' : '',
      frequency: colMap.frequency !== -1 ? values[colMap.frequency]?.trim() || '' : '',
      supervision_level: colMap.supervision !== -1 ? values[colMap.supervision]?.trim() || '' : '',
      work_history: workHistory,
      tasks,
      raw
    });
  }
  
  return { headers, workers, errors };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

/**
 * Find column index from multiple possible names
 */
function findColumn(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const idx = headers.findIndex(h => h.includes(name));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ============= CERTIFICATION MATCHING =============

// ISCO occupation profiles with required skills
const CERTIFICATION_MAPPINGS: Record<string, { name: string; required: string[] }> = {
  'ISCO-9212': {
    name: 'Livestock Farm Worker',
    required: ['HS_LIVE_001', 'HS_LIVE_003', 'HS_LIVE_007', 'FS_SOFT_001']
  },
  'ISCO-9211': {
    name: 'Crop Farm Labourer',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_006', 'HS_CROP_007']
  },
  'ISCO-6130': {
    name: 'Mixed Crop and Animal Producers',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_004', 'HS_LIVE_001', 'HS_LIVE_003', 'FS_SOFT_001', 'FS_SOFT_002']
  },
  'ISCO-6121': {
    name: 'Livestock and Dairy Producers',
    required: ['HS_LIVE_001', 'HS_LIVE_003', 'HS_LIVE_004', 'HS_LIVE_007', 'HS_LIVE_008', 'FS_SOFT_001']
  },
  'ISCO-6111': {
    name: 'Field Crop and Vegetable Growers',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_003', 'HS_CROP_004', 'HS_CROP_005', 'HS_CROP_007', 'HS_CROP_008']
  },
  'ISCO-6112': {
    name: 'Tree and Shrub Crop Growers',
    required: ['HS_CROP_009', 'HS_CROP_010', 'HS_CROP_011', 'HS_HORT_002']
  },
  'ISCO-6113': {
    name: 'Gardeners, Horticultural Workers',
    required: ['HS_HORT_001', 'HS_HORT_002', 'HS_HORT_003', 'HS_CROP_012']
  },
  'TVET-AGR-L3': {
    name: 'Certificate in Agriculture (Level 3)',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_004', 'HS_CROP_005', 'HS_CROP_006', 'HS_CROP_007', 'FS_SOFT_001']
  },
  'TVET-AGR-L4': {
    name: 'Diploma in Agriculture (Level 4)',
    required: ['HS_CROP_001', 'HS_CROP_002', 'HS_CROP_003', 'HS_CROP_004', 'HS_CROP_005', 'HS_CROP_013', 'HS_CROP_014', 'FS_SOFT_001', 'FS_SOFT_002', 'FS_SOFT_004']
  },
  'TVET-DAIRY-L3': {
    name: 'Certificate in Dairy Management',
    required: ['HS_LIVE_001', 'HS_LIVE_003', 'HS_LIVE_007', 'HS_LIVE_008', 'FS_SOFT_001']
  }
};

/**
 * Calculate certification readiness based on worker's extracted skills
 */
export function calculateCertificationReadiness(workerSkillIds: string[]): CertificationMatch[] {
  const matches: CertificationMatch[] = [];
  
  for (const [code, mapping] of Object.entries(CERTIFICATION_MAPPINGS)) {
    const matched = workerSkillIds.filter(id => mapping.required.includes(id));
    const missing = mapping.required.filter(id => !workerSkillIds.includes(id));
    const matchPercentage = matched.length / mapping.required.length;
    
    // Only include if at least one skill matches
    if (matched.length > 0) {
      matches.push({
        cert_type: code.startsWith('ISCO') ? 'ISCO' : 'TVET',
        certification_name: mapping.name,
        certification_code: code,
        required_skills: mapping.required,
        matched_skills: matched,
        missing_skills: missing,
        match_percentage: matchPercentage
      });
    }
  }
  
  // Sort by best match first
  return matches.sort((a, b) => b.match_percentage - a.match_percentage);
}

// ============= HELPER FUNCTIONS =============

/**
 * Generate a simple invitation code
 */
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get proficiency label from rating
 */
function getProficiencyLabel(rating: number): string {
  if (rating <= 2) return 'Beginner';
  if (rating <= 4) return 'Foundation';
  if (rating <= 6) return 'Intermediate';
  if (rating <= 8) return 'Advanced';
  return 'Expert';
}

/**
 * Get confidence tier from score
 */
function getConfidenceTier(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.60) return 'medium';
  return 'low';
}

// ============= MAIN PROCESSING FUNCTION =============

/**
 * Process a single worker row - extract skills and calculate certification readiness
 */
async function processWorkerRow(
  worker: ParsedWorker,
  batchId: string,
  dataTier: DataTier
): Promise<{
  workerId: string;
  skillCount: number;
  avgConfidence: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}> {
  // Create worker profile
  const { data: workerData, error: workerError } = await supabase
    .from('bulk_uploaded_workers')
    .insert({
      batch_id: batchId,
      full_name: worker.full_name,
      phone: worker.phone || null,
      location: worker.location || null,
      education_level: worker.education_level || null,
      experience_years: worker.years_experience || null,
      work_history: worker.work_history || null,
      profile_status: 'unclaimed',
      invitation_code: generateInviteCode(),
      skills_count: 0,
      certification_match_percentage: 0
    })
    .select()
    .single();
  
  if (workerError || !workerData) {
    throw new Error(`Failed to create worker: ${workerError?.message || 'Unknown error'}`);
  }
  
  const workerId = workerData.id;
  
  // Skip skill extraction if no work history
  if (!worker.work_history || worker.work_history.trim().length < 10) {
    return { workerId, skillCount: 0, avgConfidence: 0, highCount: 0, mediumCount: 0, lowCount: 0 };
  }
  
  // Build extraction context from worker data
  const context: ExtractionContext = {
    years_experience: worker.years_experience,
    work_type: worker.work_type,
    farm_size: worker.farm_size,
    frequency: worker.frequency,
    supervision_level: worker.supervision_level
  };
  
  // Extract skills using the enhanced skill extraction service
  const extractedSkills = await extractSkillsFromText(worker.work_history, context);
  
  if (extractedSkills.length === 0) {
    return { workerId, skillCount: 0, avgConfidence: 0, highCount: 0, mediumCount: 0, lowCount: 0 };
  }
  
  // Track confidence levels
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  
  // Insert skill mappings
  for (const skill of extractedSkills) {
    const tier = getConfidenceTier(skill.confidence);
    if (tier === 'high') highCount++;
    else if (tier === 'medium') mediumCount++;
    else lowCount++;
    
    await supabase.from('skill_mappings').insert({
      batch_id: batchId,
      worker_id: workerId,
      worker_name: worker.full_name,
      user_input_task: skill.source_text,
      canonical_task_matched: skill.matched_phrase,
      mapped_skill_id: skill.skill_id,
      mapped_skill_name: skill.skill_name,
      confidence_score: skill.confidence,
      confidence_tier: tier,
      matching_method: 'enhanced_extraction',
      verification_tier: 'Bronze',
      proficiency_estimate: getProficiencyLabel(skill.estimated_proficiency),
      mapping_status: tier === 'high' ? 'approved' : 'pending',
      needs_review: tier !== 'high'
    });
  }
  
  // Calculate certification readiness
  const skillIds = extractedSkills.map(s => s.skill_id);
  const certMatches = calculateCertificationReadiness(skillIds);
  const bestMatch = certMatches[0];
  const certMatchPercentage = bestMatch 
    ? Math.round(bestMatch.match_percentage * 100) 
    : 0;
  
  // Calculate average confidence
  const avgConfidence = extractedSkills.reduce((sum, s) => sum + s.confidence, 0) / extractedSkills.length;
  
  // Update worker with skill counts and certification match
  await supabase
    .from('bulk_uploaded_workers')
    .update({
      skills_count: extractedSkills.length,
      certification_match_percentage: certMatchPercentage
    })
    .eq('id', workerId);
  
  return {
    workerId,
    skillCount: extractedSkills.length,
    avgConfidence,
    highCount,
    mediumCount,
    lowCount
  };
}

/**
 * Main bulk upload processing function
 */
export async function processBulkUpload(
  csvText: string,
  fileName: string,
  institutionCode: string,
  uploadMode: 'demo' | 'production' = 'demo'
): Promise<BulkUploadResult> {
  // Parse CSV
  const { headers, workers, errors: parseErrors } = parseCSV(csvText);
  
  if (workers.length === 0) {
    throw new Error('No valid workers found in CSV');
  }
  
  // Detect data tier
  const dataTier = detectDataTier(headers);
  
  // Create upload batch
  const { data: batch, error: batchError } = await supabase
    .from('upload_batches')
    .insert({
      institution_code: institutionCode,
      upload_mode: uploadMode,
      source_file_name: fileName,
      worker_count: workers.length,
      processing_status: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (batchError || !batch) {
    throw new Error(`Failed to create upload batch: ${batchError?.message || 'Unknown error'}`);
  }
  
  const batchId = batch.batch_id;
  
  // Process results tracking
  const result: BulkUploadResult = {
    batchId,
    totalWorkers: workers.length,
    processedWorkers: 0,
    workersWithSkills: 0,
    totalSkillsMapped: 0,
    avgSkillsPerWorker: 0,
    avgConfidence: 0,
    highConfidenceCount: 0,
    mediumConfidenceCount: 0,
    lowConfidenceCount: 0,
    dataTier,
    errors: parseErrors.map((e, i) => ({ row: i + 2, error: e }))
  };
  
  let totalConfidence = 0;
  
  // Process each worker
  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    
    try {
      const workerResult = await processWorkerRow(worker, batchId, dataTier);
      
      result.processedWorkers++;
      
      if (workerResult.skillCount > 0) {
        result.workersWithSkills++;
        result.totalSkillsMapped += workerResult.skillCount;
        totalConfidence += workerResult.avgConfidence;
        result.highConfidenceCount += workerResult.highCount;
        result.mediumConfidenceCount += workerResult.mediumCount;
        result.lowConfidenceCount += workerResult.lowCount;
      }
    } catch (error: any) {
      console.error(`Error processing worker ${worker.full_name}:`, error);
      result.errors.push({
        row: i + 2, // +1 for header, +1 for 1-indexing
        error: error.message || 'Unknown error'
      });
    }
  }
  
  // Calculate averages
  if (result.workersWithSkills > 0) {
    result.avgSkillsPerWorker = result.totalSkillsMapped / result.workersWithSkills;
    result.avgConfidence = totalConfidence / result.workersWithSkills;
  }
  
  // Update batch with final stats
  await supabase
    .from('upload_batches')
    .update({
      worker_count: result.processedWorkers,
      skills_mapped: result.totalSkillsMapped,
      high_confidence_count: result.highConfidenceCount,
      medium_confidence_count: result.mediumConfidenceCount,
      low_confidence_count: result.lowConfidenceCount,
      processing_status: result.errors.length === 0 ? 'completed' : 'partial',
      processing_completed_at: new Date().toISOString()
    })
    .eq('batch_id', batchId);
  
  return result;
}

/**
 * Reprocess existing workers with the enhanced skill extraction
 */
export async function reprocessWorkerSkills(batchId?: string): Promise<{
  processed: number;
  skillsExtracted: number;
  errors: string[];
}> {
  // Fetch workers to reprocess
  let query = supabase
    .from('bulk_uploaded_workers')
    .select('*')
    .not('work_history', 'is', null);
  
  if (batchId) {
    query = query.eq('batch_id', batchId);
  }
  
  const { data: workers, error } = await query;
  
  if (error || !workers) {
    throw new Error(`Failed to fetch workers: ${error?.message || 'Unknown error'}`);
  }
  
  const result = { processed: 0, skillsExtracted: 0, errors: [] as string[] };
  
  for (const worker of workers) {
    try {
      // Delete existing skill mappings for this worker
      await supabase
        .from('skill_mappings')
        .delete()
        .eq('worker_id', worker.id);
      
      // Build context from worker data
      const context: ExtractionContext = {
        years_experience: worker.experience_years || undefined,
      };
      
      // Extract skills
      const extractedSkills = await extractSkillsFromText(worker.work_history || '', context);
      
      // Insert new skill mappings
      for (const skill of extractedSkills) {
        const tier = getConfidenceTier(skill.confidence);
        
        await supabase.from('skill_mappings').insert({
          batch_id: worker.batch_id,
          worker_id: worker.id,
          worker_name: worker.full_name,
          user_input_task: skill.source_text,
          canonical_task_matched: skill.matched_phrase,
          mapped_skill_id: skill.skill_id,
          mapped_skill_name: skill.skill_name,
          confidence_score: skill.confidence,
          confidence_tier: tier,
          matching_method: 'enhanced_extraction',
          verification_tier: 'Bronze',
          proficiency_estimate: getProficiencyLabel(skill.estimated_proficiency),
          mapping_status: tier === 'high' ? 'approved' : 'pending',
          needs_review: tier !== 'high'
        });
        
        result.skillsExtracted++;
      }
      
      // Calculate certification readiness
      const skillIds = extractedSkills.map(s => s.skill_id);
      const certMatches = calculateCertificationReadiness(skillIds);
      const bestMatch = certMatches[0];
      const certMatchPercentage = bestMatch 
        ? Math.round(bestMatch.match_percentage * 100) 
        : 0;
      
      // Update worker stats
      await supabase
        .from('bulk_uploaded_workers')
        .update({
          skills_count: extractedSkills.length,
          certification_match_percentage: certMatchPercentage
        })
        .eq('id', worker.id);
      
      result.processed++;
    } catch (err: any) {
      console.error(`Error reprocessing worker ${worker.full_name}:`, err);
      result.errors.push(`${worker.full_name}: ${err.message}`);
    }
  }
  
  return result;
}

// Export service object for convenient access
export const bulkUploadProcessor = {
  detectDataTier,
  parseCSV,
  calculateCertificationReadiness,
  processBulkUpload,
  reprocessWorkerSkills
};
