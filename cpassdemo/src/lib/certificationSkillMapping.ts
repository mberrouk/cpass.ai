/**
 * Maps abstract certification requirement names to actual skill IDs from database
 * This allows certifications to use general terms while maintaining specific skill taxonomy
 * 
 * Database skill IDs use prefixes: CP (Crop Production), LV (Livestock), etc.
 */

export const certificationSkillMapping: Record<string, string[]> = {
  // CROP PRODUCTION SKILLS (CP prefix)
  
  // Irrigation/Watering
  "Irrigation management": ["CP001"],
  "irrigation": ["CP001"],
  "Watering crops / managing irrigation": ["CP001"],
  "water management": ["CP001"],
  
  // Planting
  "Planting seeds or seedlings": ["CP002"],
  "planting": ["CP002"],
  "seed selection": ["CP002"],
  "transplanting": ["CP002"],
  
  // Weeding
  "Weeding by hand or with tools": ["CP003"],
  "weeding": ["CP003"],
  "weed control": ["CP003"],
  "manual weed control": ["CP003"],
  
  // Pest identification
  "Identifying pests and diseases": ["CP004"],
  "pest identification": ["CP004"],
  "disease identification": ["CP004"],
  "crop scouting": ["CP004"],
  
  // Pesticide/Fertilizer application
  "Spraying pesticides or fertilizers": ["CP005"],
  "pesticide application": ["CP005"],
  "fertilizer application": ["CP005"],
  "chemical application": ["CP005"],
  "pest management": ["CP005", "CP004"],
  "Integrated Pest Management": ["CP005", "CP004"],
  
  // Land preparation
  "Preparing land for planting": ["CP006"],
  "land preparation": ["CP006"],
  "soil preparation": ["CP006"],
  "tillage": ["CP006"],
  
  // Pruning
  "Pruning and trimming plants": ["CP007"],
  "pruning": ["CP007"],
  "canopy management": ["CP007"],
  
  // Harvesting
  "Harvesting crops": ["CP008"],
  "harvesting": ["CP008"],
  "harvest timing": ["CP008"],
  
  // Post-harvest
  "Sorting and grading produce": ["CP009"],
  "grading": ["CP009"],
  "sorting": ["CP009"],
  "quality grading": ["CP009"],
  "post-harvest handling": ["CP009"],
  "storage management": ["CP009"],
  "packaging": ["CP009"],
  
  // Nursery
  "Managing a nursery or seedbed": ["CP010"],
  "nursery management": ["CP010"],
  "seedbed management": ["CP010"],
  "vegetative propagation": ["CP010"],
  
  // Greenhouse
  "Greenhouse management": ["CP011"],
  "greenhouse": ["CP011"],
  "protected cultivation": ["CP011"],
  
  // Soil testing
  "Soil testing and analysis": ["CP012"],
  "soil testing": ["CP012"],
  "soil analysis": ["CP012"],
  "soil sampling": ["CP012"],
  
  // LIVESTOCK SKILLS (LV prefix)
  
  // Feeding
  "Feeding and watering animals": ["LV001"],
  "animal feeding": ["LV001"],
  "livestock feeding": ["LV001"],
  "feeding": ["LV001"],
  
  // Milking
  "Milking dairy cattle": ["LV002"],
  "milking": ["LV002"],
  "dairy milking": ["LV002"],
  
  // Health monitoring
  "Animal health monitoring": ["LV003"],
  "health monitoring": ["LV003"],
  "animal health": ["LV003"],
  
  // Breeding
  "Breeding management": ["LV004"],
  "breeding": ["LV004"],
  "reproduction management": ["LV004"],
  
  // Poultry
  "Poultry management": ["LV005"],
  "poultry": ["LV005"],
  
  // Housing
  "Livestock housing maintenance": ["LV006"],
  "livestock housing": ["LV006"],
  "animal housing": ["LV006"],
  
  // Pasture
  "Pasture management": ["LV007"],
  "pasture": ["LV007"],
  "grazing management": ["LV007"],
  
  // Veterinary
  "Veterinary assistance": ["LV008"],
  "veterinary": ["LV008"],
  "vet assistance": ["LV008"],
};

/**
 * Get skill IDs that match a certification requirement
 * Handles exact matches, case-insensitive matches, and fuzzy matches
 */
export function getSkillIdsForRequirement(requirement: string): string[] {
  const trimmed = requirement.trim();
  
  // Try exact match first
  if (certificationSkillMapping[trimmed]) {
    return certificationSkillMapping[trimmed];
  }
  
  // Try case-insensitive match
  const normalized = trimmed.toLowerCase();
  for (const [key, skillIds] of Object.entries(certificationSkillMapping)) {
    if (key.toLowerCase() === normalized) {
      return skillIds;
    }
  }
  
  // Fuzzy match: check if requirement contains any key or vice versa
  for (const [key, skillIds] of Object.entries(certificationSkillMapping)) {
    const keyLower = key.toLowerCase();
    if (normalized.includes(keyLower) || keyLower.includes(normalized)) {
      return skillIds;
    }
  }
  
  // No match found
  console.warn(`No skill mapping found for certification requirement: "${requirement}"`);
  return [];
}

/**
 * Check if a worker has any of the skills required for a certification requirement
 */
export function hasRequiredSkill(
  requirement: string,
  workerSkills: Array<{ skill_id: string }>
): boolean {
  const requiredSkillIds = getSkillIdsForRequirement(requirement);
  return requiredSkillIds.some(skillId =>
    workerSkills.some(workerSkill => workerSkill.skill_id === skillId)
  );
}

/**
 * Get matched skill count for a list of requirements
 */
export function getMatchedSkillsCount(
  requirements: string[],
  workerSkills: Array<{ skill_id: string }>
): { matched: number; total: number; matchedRequirements: string[] } {
  const matchedRequirements: string[] = [];
  
  for (const req of requirements) {
    if (hasRequiredSkill(req, workerSkills)) {
      matchedRequirements.push(req);
    }
  }
  
  return {
    matched: matchedRequirements.length,
    total: requirements.length,
    matchedRequirements
  };
}
