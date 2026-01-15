/**
 * Maps abstract skill category names to actual database skill IDs.
 * This allows career pathways and job opportunities to reference skills
 * in a human-readable way while matching against the actual database.
 */

// Database skill IDs mapped to categories
export const skillIdsByCategory: Record<string, string[]> = {
  // Crop Production Skills
  'watering_irrigation': ['CP001'],
  'planting': ['CP002'],
  'weeding': ['CP003'],
  'pest_identification': ['CP004'],
  'spraying_pesticides': ['CP005'],
  'land_preparation': ['CP006'],
  'pruning': ['CP007'],
  'harvesting': ['CP008'],
  'sorting_grading': ['CP009'],
  'nursery_management': ['CP010'],
  'greenhouse': ['CP011'],
  'soil_testing': ['CP012'],
  
  // Livestock Skills
  'animal_feeding': ['LV001'],
  'milking': ['LV002'],
  'animal_health': ['LV003'],
  'breeding': ['LV004'],
  'poultry_care': ['LV005'],
  'livestock_housing': ['LV006'],
  'pasture_management': ['LV007'],
  
  // Machinery Skills
  'tractor_operation': ['MC001'],
  'equipment_maintenance': ['MC002'],
  'irrigation_systems': ['MC003'],
  
  // Post-Harvest Skills
  'post_harvest_handling': ['PH001'],
  'storage_management': ['PH002'],
  'quality_grading': ['PH003'],
  'packaging': ['PH004'],
};

// Get all skill IDs for a list of category names
export function getSkillIdsForCategories(categoryNames: string[]): string[] {
  const allIds: string[] = [];
  for (const name of categoryNames) {
    const ids = skillIdsByCategory[name] || [];
    allIds.push(...ids);
  }
  return [...new Set(allIds)]; // Remove duplicates
}

// Check if worker has any skills matching the given categories
export function workerHasSkillsInCategories(
  workerSkillIds: string[],
  categoryNames: string[]
): string[] {
  const requiredIds = getSkillIdsForCategories(categoryNames);
  return requiredIds.filter(id => workerSkillIds.includes(id));
}

// ISCO occupation profiles with required skill categories
export const iscoOccupationProfiles = [
  {
    id: 'field_crop_grower',
    title: 'Field Crop and Vegetable Grower',
    iscoCode: '6111',
    description: 'Grows and harvests field crops such as wheat, rice, maize, and vegetables.',
    requiredCategories: [
      'land_preparation', 'planting', 'watering_irrigation', 'weeding',
      'pest_identification', 'spraying_pesticides', 'harvesting', 'sorting_grading',
      'post_harvest_handling', 'storage_management', 'soil_testing'
    ],
    foundationCategories: ['planting', 'watering_irrigation', 'weeding', 'harvesting'],
  },
  {
    id: 'crop_production_worker',
    title: 'Crop Production Worker',
    iscoCode: '9211',
    description: 'Performs routine tasks in growing and harvesting crops.',
    requiredCategories: [
      'planting', 'watering_irrigation', 'weeding', 'harvesting',
      'spraying_pesticides', 'sorting_grading', 'post_harvest_handling'
    ],
    foundationCategories: ['planting', 'watering_irrigation', 'weeding', 'harvesting'],
  },
  {
    id: 'agricultural_technician',
    title: 'Agricultural Technician',
    iscoCode: '3142',
    description: 'Performs technical tasks to support agricultural research and production.',
    requiredCategories: [
      'soil_testing', 'land_preparation', 'pest_identification', 'spraying_pesticides',
      'watering_irrigation', 'greenhouse', 'equipment_maintenance', 'quality_grading'
    ],
    foundationCategories: ['soil_testing', 'pest_identification'],
  },
  {
    id: 'livestock_worker',
    title: 'Livestock Farm Worker',
    iscoCode: '9212',
    description: 'Performs routine tasks in raising and caring for livestock.',
    requiredCategories: [
      'animal_feeding', 'animal_health', 'milking', 'livestock_housing'
    ],
    foundationCategories: ['animal_feeding', 'animal_health'],
  },
  {
    id: 'dairy_farm_worker',
    title: 'Dairy Farm Worker',
    iscoCode: '6121',
    description: 'Raises and tends dairy cattle for milk production.',
    requiredCategories: [
      'animal_feeding', 'milking', 'animal_health', 'livestock_housing', 'pasture_management'
    ],
    foundationCategories: ['animal_feeding', 'milking'],
  },
  {
    id: 'farm_supervisor',
    title: 'Farm Supervisor',
    iscoCode: '6113',
    description: 'Supervises farm workers and coordinates daily farming operations.',
    requiredCategories: [
      'land_preparation', 'planting', 'watering_irrigation', 'weeding',
      'pest_identification', 'spraying_pesticides', 'harvesting', 'sorting_grading',
      'post_harvest_handling', 'storage_management', 'tractor_operation', 'equipment_maintenance'
    ],
    foundationCategories: ['planting', 'watering_irrigation', 'harvesting'],
  },
  {
    id: 'irrigation_specialist',
    title: 'Irrigation Specialist',
    iscoCode: '6112',
    description: 'Operates and maintains irrigation systems for crop production.',
    requiredCategories: [
      'watering_irrigation', 'irrigation_systems', 'soil_testing', 'equipment_maintenance'
    ],
    foundationCategories: ['watering_irrigation'],
  },
  {
    id: 'greenhouse_manager',
    title: 'Greenhouse Manager',
    iscoCode: '6114',
    description: 'Manages greenhouse operations for controlled environment agriculture.',
    requiredCategories: [
      'greenhouse', 'pest_identification', 'spraying_pesticides', 'watering_irrigation',
      'nursery_management', 'quality_grading', 'post_harvest_handling'
    ],
    foundationCategories: ['greenhouse', 'watering_irrigation'],
  },
  {
    id: 'farm_manager',
    title: 'Farm Manager',
    iscoCode: '1311',
    description: 'Plans, directs and coordinates the production activities on farms.',
    requiredCategories: [
      'land_preparation', 'planting', 'watering_irrigation', 'weeding',
      'pest_identification', 'spraying_pesticides', 'harvesting', 'sorting_grading',
      'post_harvest_handling', 'storage_management', 'greenhouse', 'tractor_operation',
      'equipment_maintenance', 'animal_feeding', 'animal_health', 'soil_testing'
    ],
    foundationCategories: ['planting', 'watering_irrigation', 'harvesting'],
  },
];

// Job opportunities (same as ISCO but formatted for jobs)
export const jobOpportunityProfiles = iscoOccupationProfiles.map(occ => ({
  id: occ.id,
  jobTitle: occ.title,
  iscoCode: occ.iscoCode,
  description: occ.description,
  requiredCategories: occ.requiredCategories,
  foundationCategories: occ.foundationCategories,
  relevantCertifications: getRelevantCertifications(occ.id),
}));

function getRelevantCertifications(occupationId: string): Array<{ name: string; skillBoost: number }> {
  const certMap: Record<string, Array<{ name: string; skillBoost: number }>> = {
    'field_crop_grower': [
      { name: 'KenyaGAP', skillBoost: 20 },
      { name: 'TVET Level 3 Crop Production', skillBoost: 12 },
    ],
    'agricultural_technician': [
      { name: 'TVET Level 4 Agricultural Technology', skillBoost: 15 },
    ],
    'greenhouse_manager': [
      { name: 'Greenhouse Operations Certificate', skillBoost: 8 },
    ],
    'dairy_farm_worker': [
      { name: 'Dairy Farm Management Certificate', skillBoost: 10 },
    ],
    'farm_manager': [
      { name: 'Farm Business Management', skillBoost: 25 },
    ],
  };
  return certMap[occupationId] || [];
}

// Skill name lookup for display
export const skillCategoryNames: Record<string, string> = {
  'watering_irrigation': 'Watering & Irrigation',
  'planting': 'Planting & Transplanting',
  'weeding': 'Weeding & Cultivation',
  'pest_identification': 'Pest & Disease Identification',
  'spraying_pesticides': 'Pesticide Application',
  'land_preparation': 'Land Preparation',
  'pruning': 'Pruning & Trimming',
  'harvesting': 'Harvesting',
  'sorting_grading': 'Sorting & Grading',
  'nursery_management': 'Nursery Management',
  'greenhouse': 'Greenhouse Operations',
  'soil_testing': 'Soil Testing & Analysis',
  'animal_feeding': 'Animal Feeding',
  'milking': 'Milking Operations',
  'animal_health': 'Animal Health Monitoring',
  'breeding': 'Breeding Management',
  'poultry_care': 'Poultry Care',
  'livestock_housing': 'Livestock Housing',
  'pasture_management': 'Pasture Management',
  'tractor_operation': 'Tractor Operation',
  'equipment_maintenance': 'Equipment Maintenance',
  'irrigation_systems': 'Irrigation System Operation',
  'post_harvest_handling': 'Post-Harvest Handling',
  'storage_management': 'Storage Management',
  'quality_grading': 'Quality Grading',
  'packaging': 'Packaging',
};
