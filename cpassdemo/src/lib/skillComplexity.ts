/**
 * Skill Complexity System
 * 
 * Two separate concepts:
 * 1. SKILL COMPLEXITY (Inherent to the skill itself) - Based on prerequisite depth
 * 2. WORKER PROFICIENCY (Personal to each worker) - Based on self-rating
 */

export type SkillComplexityLevel = 'foundation' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type WorkerProficiencyLevel = 'learning' | 'competent' | 'proficient' | 'expert';

interface SkillEdge {
  source_skill_id: string;
  target_skill_id: string;
  relationship_type: string;
}

/**
 * Hardcoded skill complexity mapping based on agricultural skill taxonomy
 * Foundation = Entry-level skills, no prerequisites
 * Beginner = Requires basic foundation knowledge
 * Intermediate = Requires multiple foundation skills
 * Advanced = Requires intermediate skills + experience
 * Expert = Mastery-level, requires extensive foundation
 */
const skillComplexityMap: Record<string, SkillComplexityLevel> = {
  // Foundation skills - entry level, anyone can start
  'CP001': 'foundation', // Watering crops
  'CP003': 'foundation', // Weeding by hand
  'CP006': 'foundation', // Preparing land
  'LV001': 'foundation', // Feeding animals
  'LV006': 'foundation', // Housing maintenance
  
  // Beginner skills - 1 prerequisite
  'CP002': 'beginner', // Planting seeds (requires land prep)
  'CP008': 'beginner', // Harvesting (requires planting knowledge)
  'LV003': 'beginner', // Health monitoring (requires feeding/handling)
  
  // Intermediate skills - 2 prerequisites
  'CP004': 'intermediate', // Identifying pests (requires crop knowledge)
  'CP005': 'intermediate', // Spraying pesticides (requires pest ID + safety)
  'CP007': 'intermediate', // Pruning (requires plant knowledge)
  'CP009': 'intermediate', // Sorting/grading (requires harvesting)
  'LV002': 'intermediate', // Milking (requires animal handling + health)
  'LV007': 'intermediate', // Pasture management
  
  // Advanced skills - 3+ prerequisites
  'CP010': 'advanced', // Nursery management
  'CP011': 'advanced', // Greenhouse management
  'CP012': 'advanced', // Soil testing/analysis
  'LV004': 'advanced', // Breeding management
  'LV005': 'advanced', // Poultry management
  'LV008': 'advanced', // Veterinary assistance
  
  // Expert skills - 4+ prerequisites, mastery level
  // Add as needed based on skill graph
};

/**
 * Get skill complexity level from skill ID
 * Uses hardcoded map with fallback to foundation
 */
export function getSkillComplexityLevel(
  skillId: string,
  edges?: SkillEdge[],
  isFoundation?: boolean
): SkillComplexityLevel {
  // Use explicit foundation flag if provided
  if (isFoundation === true) return 'foundation';
  
  // Check hardcoded map first
  if (skillComplexityMap[skillId]) {
    return skillComplexityMap[skillId];
  }
  
  // If edges provided, calculate from prerequisite depth
  if (edges && edges.length > 0) {
    const depth = calculatePrerequisiteDepth(skillId, edges);
    if (depth === 0) return 'foundation';
    if (depth === 1) return 'beginner';
    if (depth === 2) return 'intermediate';
    if (depth === 3) return 'advanced';
    return 'expert'; // depth >= 4
  }
  
  // Default to foundation for unknown skills
  return 'foundation';
}

/**
 * Recursively calculate maximum prerequisite depth
 */
function calculatePrerequisiteDepth(
  skillId: string,
  edges: SkillEdge[],
  visited = new Set<string>()
): number {
  // Prevent infinite loops
  if (visited.has(skillId)) return 0;
  visited.add(skillId);
  
  // Find all skills that are prerequisites FOR this skill
  const prerequisites = edges
    .filter(e => 
      e.target_skill_id === skillId && 
      e.relationship_type === 'is_prerequisite_for'
    )
    .map(e => e.source_skill_id);
  
  // No prerequisites = foundation skill (depth 0)
  if (prerequisites.length === 0) return 0;
  
  // Find maximum depth among all prerequisites
  const depths = prerequisites.map(prereqId => 
    calculatePrerequisiteDepth(prereqId, edges, new Set(visited))
  );
  
  return Math.max(...depths) + 1;
}

/**
 * Get worker proficiency level from rating (1-10)
 */
export function getWorkerProficiencyLevel(rating: number): WorkerProficiencyLevel {
  if (rating >= 9) return 'expert';
  if (rating >= 7) return 'proficient';
  if (rating >= 4) return 'competent';
  return 'learning';
}

/**
 * Get complexity level label for display
 */
export function getComplexityLabel(level: SkillComplexityLevel): string {
  const labels: Record<SkillComplexityLevel, string> = {
    foundation: 'Foundation',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert'
  };
  return labels[level];
}

/**
 * Get complexity description
 */
export function getComplexityDescription(level: SkillComplexityLevel): string {
  const descriptions: Record<SkillComplexityLevel, string> = {
    foundation: 'Entry-level skill, no prerequisites',
    beginner: 'Requires 1 other skill first',
    intermediate: 'Requires 2 other skills first',
    advanced: 'Requires 3+ other skills first',
    expert: 'Mastery-level skill, requires extensive foundation'
  };
  return descriptions[level];
}

/**
 * Get proficiency label for display
 */
export function getProficiencyLabel(level: WorkerProficiencyLevel): string {
  const labels: Record<WorkerProficiencyLevel, string> = {
    learning: 'Learning',
    competent: 'Competent',
    proficient: 'Proficient',
    expert: 'Expert'
  };
  return labels[level];
}

/**
 * Get complexity icon emoji
 */
export function getComplexityIcon(level: SkillComplexityLevel): string {
  const icons: Record<SkillComplexityLevel, string> = {
    foundation: '🌱',
    beginner: '📘',
    intermediate: '📗',
    advanced: '📕',
    expert: '👑'
  };
  return icons[level];
}

/**
 * Get complexity color class
 */
export function getComplexityColorClass(level: SkillComplexityLevel): string {
  const colors: Record<SkillComplexityLevel, string> = {
    foundation: 'bg-green-100 text-green-700 border-green-200',
    beginner: 'bg-blue-100 text-blue-700 border-blue-200',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    advanced: 'bg-orange-100 text-orange-700 border-orange-200',
    expert: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return colors[level];
}
