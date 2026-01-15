// Signup flow types and constants

export type WorkSituation = 'full-time' | 'casual' | 'self-employed' | 'looking' | 'student';
export type ExperienceDuration = '<6mo' | '6mo-2yr' | '2-5yr' | '5-10yr' | '10+yr';
export type Frequency = 'daily' | 'several_weekly' | 'weekly' | 'monthly' | 'seasonal' | 'rarely';
export type YearsExperience = '<6mo' | '6mo-1yr' | '1-3yr' | '3-5yr' | '5+yr';
export type SupervisionLevel = 'independent' | 'occasional_guidance' | 'regular_guidance' | 'close_supervision' | 'learning';
export type ScaleContext = 'small_plot' | 'small_farm' | 'medium_farm' | 'large_farm' | 'commercial';
export type EvidenceType = 'reference_letter' | 'photos' | 'work_records' | 'supervisor' | 'certificates' | 'other';
export type ReferenceRelationship = 'employer' | 'supervisor' | 'client' | 'peer';

export interface WorkContexts {
  farmSizes: string[];
  herdSizes: string[];
  equipmentTypes: string[];
  supervisionLevels: string[];
}

export interface SignupState {
  phoneNumber: string;
  email: string;
  assignedOrg: {
    name: string;
    type: 'tvet' | 'platform';
  } | null;
  fullName: string;
  location: string;
  workSituation: WorkSituation | null;
  experienceDuration: ExperienceDuration | null;
  selectedDomains: string[];
  selectedTasks: string[];
  skillProficiencies: SkillProficiency[];
  workContexts: WorkContexts;
  telegramId: string | null;
  tvetInstitutionId: string | null;
}

export interface SkillProficiency {
  skill_id: string;
  skill_name: string;
  years_experience: YearsExperience;
  frequency: Frequency;
  proficiency_rating: number;
  scale_context: string[];
  supervision_level: SupervisionLevel;
  evidence_types: EvidenceType[];
  reference_contact?: {
    name: string;
    phone: string;
    relationship: ReferenceRelationship;
  };
}

export interface DomainInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  skillCount: number;
}

export interface TaskInfo {
  skill_id: string;
  skill_name: string;
  domain_id: string;
  domain_name: string;
}

export const ORGANIZATIONS = [
  { name: "Bukura Agricultural College", type: "tvet" as const },
  { name: "Kenya School of Agriculture", type: "tvet" as const },
  { name: "Twiga Foods", type: "platform" as const },
  { name: "Hello Tractor", type: "platform" as const },
];

export const RANDOM_NAMES = [
  "Peter Mwangi", "Sarah Wanjiru", "John Kamau",
  "Mary Njeri", "David Omondi", "Grace Akinyi",
  "James Kipchoge", "Lucy Wambui", "Michael Otieno",
  "Faith Chebet", "Daniel Mutua"
];

export const LOCATIONS = [
  "Nakuru", "Nairobi", "Kiambu", "Eldoret", "Kisumu", "Mombasa", "Other"
];

export const DOMAINS: DomainInfo[] = [
  {
    id: "crop_production",
    name: "Crop Production",
    description: "Field crops, horticulture, nursery management, plant cultivation",
    icon: "🌾",
    skillCount: 21,
  },
  {
    id: "livestock",
    name: "Livestock Management",
    description: "Animal husbandry, feeding, health, breeding, livestock operations",
    icon: "🐄",
    skillCount: 15,
  },
  {
    id: "machinery",
    name: "Machinery & Equipment",
    description: "Mechanized operations, tractors, implements, agricultural machinery",
    icon: "🚜",
    skillCount: 7,
  },
  {
    id: "post_harvest",
    name: "Post-Harvest & Processing",
    description: "Grading, sorting, storage, packaging, produce processing",
    icon: "📦",
    skillCount: 8,
  },
  {
    id: "agribusiness",
    name: "Agri-Business Management",
    description: "Farm records, compliance, finance, digital tools, precision ag",
    icon: "💼",
    skillCount: 5,
  },
];

export const TASKS_BY_DOMAIN: Record<string, TaskInfo[]> = {
  crop_production: [
    { skill_id: "CP001", skill_name: "Watering crops / managing irrigation", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP002", skill_name: "Planting seeds or seedlings", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP003", skill_name: "Weeding by hand or with tools", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP004", skill_name: "Identifying pests and diseases", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP005", skill_name: "Spraying pesticides or fertilizers", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP006", skill_name: "Preparing land for planting", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP007", skill_name: "Pruning and trimming plants", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP008", skill_name: "Harvesting crops", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP009", skill_name: "Sorting and grading produce", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP010", skill_name: "Managing a nursery or seedbed", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP011", skill_name: "Greenhouse management", domain_id: "crop_production", domain_name: "Crop Production" },
    { skill_id: "CP012", skill_name: "Soil testing and analysis", domain_id: "crop_production", domain_name: "Crop Production" },
  ],
  livestock: [
    { skill_id: "LV001", skill_name: "Feeding and watering animals", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV002", skill_name: "Milking dairy cattle", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV003", skill_name: "Animal health monitoring", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV004", skill_name: "Breeding management", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV005", skill_name: "Poultry management", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV006", skill_name: "Livestock housing maintenance", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV007", skill_name: "Pasture management", domain_id: "livestock", domain_name: "Livestock Management" },
    { skill_id: "LV008", skill_name: "Veterinary assistance", domain_id: "livestock", domain_name: "Livestock Management" },
  ],
  machinery: [
    { skill_id: "MC001", skill_name: "Tractor operation", domain_id: "machinery", domain_name: "Machinery & Equipment" },
    { skill_id: "MC002", skill_name: "Implement attachment and use", domain_id: "machinery", domain_name: "Machinery & Equipment" },
    { skill_id: "MC003", skill_name: "Basic machinery maintenance", domain_id: "machinery", domain_name: "Machinery & Equipment" },
    { skill_id: "MC004", skill_name: "Irrigation system operation", domain_id: "machinery", domain_name: "Machinery & Equipment" },
    { skill_id: "MC005", skill_name: "Harvester operation", domain_id: "machinery", domain_name: "Machinery & Equipment" },
  ],
  post_harvest: [
    { skill_id: "PH001", skill_name: "Produce grading and sorting", domain_id: "post_harvest", domain_name: "Post-Harvest & Processing" },
    { skill_id: "PH002", skill_name: "Packaging and labeling", domain_id: "post_harvest", domain_name: "Post-Harvest & Processing" },
    { skill_id: "PH003", skill_name: "Cold storage management", domain_id: "post_harvest", domain_name: "Post-Harvest & Processing" },
    { skill_id: "PH004", skill_name: "Drying and preservation", domain_id: "post_harvest", domain_name: "Post-Harvest & Processing" },
    { skill_id: "PH005", skill_name: "Quality control inspection", domain_id: "post_harvest", domain_name: "Post-Harvest & Processing" },
  ],
  agribusiness: [
    { skill_id: "AB001", skill_name: "Farm record keeping", domain_id: "agribusiness", domain_name: "Agri-Business Management" },
    { skill_id: "AB002", skill_name: "Digital tools usage (mobile apps)", domain_id: "agribusiness", domain_name: "Agri-Business Management" },
    { skill_id: "AB003", skill_name: "Basic financial management", domain_id: "agribusiness", domain_name: "Agri-Business Management" },
    { skill_id: "AB004", skill_name: "Compliance documentation", domain_id: "agribusiness", domain_name: "Agri-Business Management" },
  ],
};

// Get domain-specific scale options
export function getScaleOptionsForDomain(domainId: string): { value: string; label: string; type: string }[] {
  if (domainId === 'crop_production' || domainId === 'post_harvest' || domainId === 'agribusiness') {
    return [
      { value: 'small_plot', label: 'Small plot/garden (< 0.5 acre)', type: 'farm_size' },
      { value: 'small_farm', label: 'Small farm (0.5-2 acres)', type: 'farm_size' },
      { value: 'medium_farm', label: 'Medium farm (2-10 acres)', type: 'farm_size' },
      { value: 'large_farm', label: 'Large farm (10-50 acres)', type: 'farm_size' },
      { value: 'commercial', label: 'Commercial operation (50+ acres)', type: 'farm_size' },
    ];
  } else if (domainId === 'livestock') {
    return [
      { value: 'few_animals', label: 'Few animals (1-5 head)', type: 'herd_size' },
      { value: 'small_herd', label: 'Small herd/flock (6-20 head)', type: 'herd_size' },
      { value: 'medium_herd', label: 'Medium herd/flock (21-50 head)', type: 'herd_size' },
      { value: 'large_herd', label: 'Large herd/flock (51-200 head)', type: 'herd_size' },
      { value: 'commercial_herd', label: 'Commercial operation (200+ head)', type: 'herd_size' },
    ];
  } else if (domainId === 'machinery') {
    return [
      { value: 'small_equipment', label: 'Small farm equipment', type: 'equipment_type' },
      { value: 'medium_equipment', label: 'Medium farm equipment', type: 'equipment_type' },
      { value: 'large_equipment', label: 'Large farm/commercial equipment', type: 'equipment_type' },
      { value: 'service_provider', label: 'Equipment service provider', type: 'equipment_type' },
    ];
  }
  // Default for soft skills and unknown domains
  return [
    { value: 'personal', label: 'Personal use', type: 'general' },
    { value: 'small_operation', label: 'Small operation', type: 'general' },
    { value: 'medium_operation', label: 'Medium operation', type: 'general' },
    { value: 'large_operation', label: 'Large operation', type: 'general' },
  ];
}

export function getAssignedOrg(phoneNumber: string) {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const index = cleanNumber.length % ORGANIZATIONS.length;
  return ORGANIZATIONS[index];
}

export function getRandomName() {
  const USED_NAMES_KEY = 'cpass_used_names';
  
  // Get previously used names from localStorage
  let usedNames: string[] = [];
  try {
    const stored = localStorage.getItem(USED_NAMES_KEY);
    if (stored) {
      usedNames = JSON.parse(stored);
    }
  } catch {
    usedNames = [];
  }
  
  // Find available names (not yet used)
  let availableNames = RANDOM_NAMES.filter(name => !usedNames.includes(name));
  
  // If all names used, reset the list
  if (availableNames.length === 0) {
    availableNames = [...RANDOM_NAMES];
    usedNames = [];
  }
  
  // Pick a random name from available ones
  const selectedName = availableNames[Math.floor(Math.random() * availableNames.length)];
  
  // Mark as used
  usedNames.push(selectedName);
  try {
    localStorage.setItem(USED_NAMES_KEY, JSON.stringify(usedNames));
  } catch {
    // Ignore localStorage errors
  }
  
  return selectedName;
}

export function generateAccessCode() {
  const chars = '0123456789ABCDEF';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function calculateTrustScore(proficiencies: SkillProficiency[]): number {
  if (proficiencies.length === 0) return 0;
  const avgRating = proficiencies.reduce((sum, p) => sum + p.proficiency_rating, 0) / proficiencies.length;
  return Math.round(avgRating * 10);
}