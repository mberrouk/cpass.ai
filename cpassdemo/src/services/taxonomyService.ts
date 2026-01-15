// Rule-based taxonomy mapping service
// Maps user task descriptions to the CPASS 82-skill taxonomy
// NO external AI calls - all mapping is local and deterministic

// Canonical task mappings with pre-calculated skill assignments
const CANONICAL_TASKS = [
  // LIVESTOCK MANAGEMENT
  { task_id: 'TASK_001', canonical_task_name: 'Milking dairy cows by hand', primary_skill_id: 'HS_LIVE_007', primary_skill_name: 'Manual Milking Operations', primary_confidence: 0.95 },
  { task_id: 'TASK_002', canonical_task_name: 'Milking cows using machines', primary_skill_id: 'HS_LIVE_008', primary_skill_name: 'Machine Milking Operations', primary_confidence: 0.95 },
  { task_id: 'TASK_003', canonical_task_name: 'Feeding cattle and livestock', primary_skill_id: 'HS_LIVE_001', primary_skill_name: 'Animal Feeding', primary_confidence: 0.92 },
  { task_id: 'TASK_004', canonical_task_name: 'Vaccinating animals', primary_skill_id: 'HS_LIVE_003', primary_skill_name: 'Animal Health Care', primary_confidence: 0.90 },
  { task_id: 'TASK_005', canonical_task_name: 'Treating sick animals', primary_skill_id: 'HS_LIVE_003', primary_skill_name: 'Animal Health Care', primary_confidence: 0.92 },
  { task_id: 'TASK_006', canonical_task_name: 'Artificial insemination', primary_skill_id: 'HS_LIVE_004', primary_skill_name: 'Breeding Management', primary_confidence: 0.95 },
  { task_id: 'TASK_007', canonical_task_name: 'Managing poultry birds', primary_skill_id: 'HS_LIVE_005', primary_skill_name: 'Poultry Management', primary_confidence: 0.92 },
  { task_id: 'TASK_008', canonical_task_name: 'Egg collection and grading', primary_skill_id: 'HS_LIVE_005', primary_skill_name: 'Poultry Management', primary_confidence: 0.88 },
  { task_id: 'TASK_009', canonical_task_name: 'Dehorning cattle', primary_skill_id: 'HS_LIVE_003', primary_skill_name: 'Animal Health Care', primary_confidence: 0.85 },
  { task_id: 'TASK_010', canonical_task_name: 'Castrating animals', primary_skill_id: 'HS_LIVE_003', primary_skill_name: 'Animal Health Care', primary_confidence: 0.85 },
  { task_id: 'TASK_011', canonical_task_name: 'Hoof trimming', primary_skill_id: 'HS_LIVE_003', primary_skill_name: 'Animal Health Care', primary_confidence: 0.85 },
  { task_id: 'TASK_012', canonical_task_name: 'Managing goats', primary_skill_id: 'HS_LIVE_006', primary_skill_name: 'Small Ruminant Management', primary_confidence: 0.90 },
  { task_id: 'TASK_013', canonical_task_name: 'Managing sheep', primary_skill_id: 'HS_LIVE_006', primary_skill_name: 'Small Ruminant Management', primary_confidence: 0.90 },
  { task_id: 'TASK_014', canonical_task_name: 'Shearing sheep', primary_skill_id: 'HS_LIVE_006', primary_skill_name: 'Small Ruminant Management', primary_confidence: 0.88 },
  { task_id: 'TASK_015', canonical_task_name: 'Managing pigs', primary_skill_id: 'HS_LIVE_009', primary_skill_name: 'Pig Husbandry', primary_confidence: 0.92 },
  { task_id: 'TASK_016', canonical_task_name: 'Rabbit keeping', primary_skill_id: 'HS_LIVE_010', primary_skill_name: 'Rabbit Production', primary_confidence: 0.90 },
  { task_id: 'TASK_017', canonical_task_name: 'Fish farming', primary_skill_id: 'HS_LIVE_011', primary_skill_name: 'Aquaculture Management', primary_confidence: 0.92 },
  { task_id: 'TASK_018', canonical_task_name: 'Beekeeping', primary_skill_id: 'HS_LIVE_012', primary_skill_name: 'Apiculture', primary_confidence: 0.95 },
  
  // CROP PRODUCTION
  { task_id: 'TASK_020', canonical_task_name: 'Ploughing land', primary_skill_id: 'HS_CROP_001', primary_skill_name: 'Land Preparation', primary_confidence: 0.92 },
  { task_id: 'TASK_021', canonical_task_name: 'Preparing seedbeds', primary_skill_id: 'HS_CROP_001', primary_skill_name: 'Land Preparation', primary_confidence: 0.90 },
  { task_id: 'TASK_022', canonical_task_name: 'Tilling soil', primary_skill_id: 'HS_CROP_001', primary_skill_name: 'Land Preparation', primary_confidence: 0.90 },
  { task_id: 'TASK_023', canonical_task_name: 'Planting seeds', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.95 },
  { task_id: 'TASK_024', canonical_task_name: 'Transplanting seedlings', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.92 },
  { task_id: 'TASK_025', canonical_task_name: 'Sowing maize', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.90 },
  { task_id: 'TASK_026', canonical_task_name: 'Planting beans', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.90 },
  { task_id: 'TASK_027', canonical_task_name: 'Irrigating crops', primary_skill_id: 'HS_CROP_003', primary_skill_name: 'Irrigation Management', primary_confidence: 0.95 },
  { task_id: 'TASK_028', canonical_task_name: 'Operating drip irrigation', primary_skill_id: 'HS_CROP_003', primary_skill_name: 'Irrigation Management', primary_confidence: 0.92 },
  { task_id: 'TASK_029', canonical_task_name: 'Watering plants', primary_skill_id: 'HS_CROP_003', primary_skill_name: 'Irrigation Management', primary_confidence: 0.85 },
  { task_id: 'TASK_030', canonical_task_name: 'Applying fertilizer', primary_skill_id: 'HS_CROP_004', primary_skill_name: 'Fertilizer Application', primary_confidence: 0.95 },
  { task_id: 'TASK_031', canonical_task_name: 'Spreading manure', primary_skill_id: 'HS_CROP_004', primary_skill_name: 'Fertilizer Application', primary_confidence: 0.88 },
  { task_id: 'TASK_032', canonical_task_name: 'Making compost', primary_skill_id: 'HS_CROP_004', primary_skill_name: 'Fertilizer Application', primary_confidence: 0.85 },
  { task_id: 'TASK_033', canonical_task_name: 'Spraying pesticides', primary_skill_id: 'HS_CROP_005', primary_skill_name: 'Pest Control', primary_confidence: 0.95 },
  { task_id: 'TASK_034', canonical_task_name: 'Controlling pests', primary_skill_id: 'HS_CROP_005', primary_skill_name: 'Pest Control', primary_confidence: 0.92 },
  { task_id: 'TASK_035', canonical_task_name: 'Managing insects', primary_skill_id: 'HS_CROP_005', primary_skill_name: 'Pest Control', primary_confidence: 0.88 },
  { task_id: 'TASK_036', canonical_task_name: 'Weeding crops', primary_skill_id: 'HS_CROP_006', primary_skill_name: 'Weed Management', primary_confidence: 0.95 },
  { task_id: 'TASK_037', canonical_task_name: 'Using herbicides', primary_skill_id: 'HS_CROP_006', primary_skill_name: 'Weed Management', primary_confidence: 0.90 },
  { task_id: 'TASK_038', canonical_task_name: 'Hand weeding', primary_skill_id: 'HS_CROP_006', primary_skill_name: 'Weed Management', primary_confidence: 0.92 },
  { task_id: 'TASK_039', canonical_task_name: 'Harvesting crops', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.95 },
  { task_id: 'TASK_040', canonical_task_name: 'Picking vegetables', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.90 },
  { task_id: 'TASK_041', canonical_task_name: 'Reaping maize', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.92 },
  { task_id: 'TASK_042', canonical_task_name: 'Drying crops', primary_skill_id: 'HS_CROP_008', primary_skill_name: 'Post-Harvest Handling', primary_confidence: 0.90 },
  { task_id: 'TASK_043', canonical_task_name: 'Storing grains', primary_skill_id: 'HS_CROP_008', primary_skill_name: 'Post-Harvest Handling', primary_confidence: 0.92 },
  { task_id: 'TASK_044', canonical_task_name: 'Grading produce', primary_skill_id: 'HS_CROP_008', primary_skill_name: 'Post-Harvest Handling', primary_confidence: 0.88 },
  { task_id: 'TASK_045', canonical_task_name: 'Processing crops', primary_skill_id: 'HS_CROP_008', primary_skill_name: 'Post-Harvest Handling', primary_confidence: 0.85 },
  { task_id: 'TASK_046', canonical_task_name: 'Pruning trees', primary_skill_id: 'HS_CROP_009', primary_skill_name: 'Pruning & Training', primary_confidence: 0.95 },
  { task_id: 'TASK_047', canonical_task_name: 'Training vines', primary_skill_id: 'HS_CROP_009', primary_skill_name: 'Pruning & Training', primary_confidence: 0.90 },
  { task_id: 'TASK_048', canonical_task_name: 'Grafting fruit trees', primary_skill_id: 'HS_CROP_010', primary_skill_name: 'Grafting & Budding', primary_confidence: 0.95 },
  { task_id: 'TASK_049', canonical_task_name: 'Budding seedlings', primary_skill_id: 'HS_CROP_010', primary_skill_name: 'Grafting & Budding', primary_confidence: 0.92 },
  { task_id: 'TASK_050', canonical_task_name: 'Running a nursery', primary_skill_id: 'HS_CROP_011', primary_skill_name: 'Nursery Management', primary_confidence: 0.92 },
  { task_id: 'TASK_051', canonical_task_name: 'Propagating plants', primary_skill_id: 'HS_CROP_011', primary_skill_name: 'Nursery Management', primary_confidence: 0.90 },
  { task_id: 'TASK_052', canonical_task_name: 'Managing greenhouse', primary_skill_id: 'HS_CROP_012', primary_skill_name: 'Greenhouse Management', primary_confidence: 0.95 },
  { task_id: 'TASK_053', canonical_task_name: 'Growing in tunnels', primary_skill_id: 'HS_CROP_012', primary_skill_name: 'Greenhouse Management', primary_confidence: 0.88 },
  { task_id: 'TASK_054', canonical_task_name: 'Testing soil', primary_skill_id: 'HS_CROP_013', primary_skill_name: 'Soil Testing & Analysis', primary_confidence: 0.95 },
  { task_id: 'TASK_055', canonical_task_name: 'Analyzing soil samples', primary_skill_id: 'HS_CROP_013', primary_skill_name: 'Soil Testing & Analysis', primary_confidence: 0.92 },
  { task_id: 'TASK_056', canonical_task_name: 'Managing crop diseases', primary_skill_id: 'HS_CROP_014', primary_skill_name: 'Disease Management', primary_confidence: 0.92 },
  { task_id: 'TASK_057', canonical_task_name: 'Identifying plant diseases', primary_skill_id: 'HS_CROP_014', primary_skill_name: 'Disease Management', primary_confidence: 0.90 },
  
  // MACHINERY & EQUIPMENT
  { task_id: 'TASK_060', canonical_task_name: 'Operating tractor', primary_skill_id: 'HS_MACH_001', primary_skill_name: 'Tractor Operation', primary_confidence: 0.95 },
  { task_id: 'TASK_061', canonical_task_name: 'Driving farm machinery', primary_skill_id: 'HS_MACH_001', primary_skill_name: 'Tractor Operation', primary_confidence: 0.90 },
  { task_id: 'TASK_062', canonical_task_name: 'Maintaining equipment', primary_skill_id: 'HS_MACH_002', primary_skill_name: 'Equipment Maintenance', primary_confidence: 0.92 },
  { task_id: 'TASK_063', canonical_task_name: 'Repairing farm machinery', primary_skill_id: 'HS_MACH_002', primary_skill_name: 'Equipment Maintenance', primary_confidence: 0.90 },
  { task_id: 'TASK_064', canonical_task_name: 'Servicing equipment', primary_skill_id: 'HS_MACH_002', primary_skill_name: 'Equipment Maintenance', primary_confidence: 0.88 },
  { task_id: 'TASK_065', canonical_task_name: 'Operating combine harvester', primary_skill_id: 'HS_MACH_003', primary_skill_name: 'Harvester Operation', primary_confidence: 0.95 },
  { task_id: 'TASK_066', canonical_task_name: 'Using water pump', primary_skill_id: 'HS_MACH_004', primary_skill_name: 'Pump Operation', primary_confidence: 0.90 },
  { task_id: 'TASK_067', canonical_task_name: 'Operating sprayer', primary_skill_id: 'HS_MACH_005', primary_skill_name: 'Sprayer Operation', primary_confidence: 0.92 },
  
  // HORTICULTURE
  { task_id: 'TASK_070', canonical_task_name: 'Growing vegetables', primary_skill_id: 'HS_HORT_001', primary_skill_name: 'Vegetable Production', primary_confidence: 0.92 },
  { task_id: 'TASK_071', canonical_task_name: 'Cultivating tomatoes', primary_skill_id: 'HS_HORT_001', primary_skill_name: 'Vegetable Production', primary_confidence: 0.90 },
  { task_id: 'TASK_072', canonical_task_name: 'Growing kale sukuma wiki', primary_skill_id: 'HS_HORT_001', primary_skill_name: 'Vegetable Production', primary_confidence: 0.90 },
  { task_id: 'TASK_073', canonical_task_name: 'Fruit production', primary_skill_id: 'HS_HORT_002', primary_skill_name: 'Fruit Production', primary_confidence: 0.92 },
  { task_id: 'TASK_074', canonical_task_name: 'Managing mango orchard', primary_skill_id: 'HS_HORT_002', primary_skill_name: 'Fruit Production', primary_confidence: 0.88 },
  { task_id: 'TASK_075', canonical_task_name: 'Growing flowers', primary_skill_id: 'HS_HORT_003', primary_skill_name: 'Floriculture', primary_confidence: 0.95 },
  { task_id: 'TASK_076', canonical_task_name: 'Cut flower production', primary_skill_id: 'HS_HORT_003', primary_skill_name: 'Floriculture', primary_confidence: 0.92 },
  
  // SOFT SKILLS & MANAGEMENT
  { task_id: 'TASK_080', canonical_task_name: 'Keeping farm records', primary_skill_id: 'FS_SOFT_001', primary_skill_name: 'Farm Record Keeping', primary_confidence: 0.95 },
  { task_id: 'TASK_081', canonical_task_name: 'Managing accounts', primary_skill_id: 'FS_SOFT_001', primary_skill_name: 'Farm Record Keeping', primary_confidence: 0.88 },
  { task_id: 'TASK_082', canonical_task_name: 'Supervising workers', primary_skill_id: 'FS_SOFT_002', primary_skill_name: 'Team Supervision', primary_confidence: 0.92 },
  { task_id: 'TASK_083', canonical_task_name: 'Managing farm team', primary_skill_id: 'FS_SOFT_002', primary_skill_name: 'Team Supervision', primary_confidence: 0.90 },
  { task_id: 'TASK_084', canonical_task_name: 'Leading workers', primary_skill_id: 'FS_SOFT_002', primary_skill_name: 'Team Supervision', primary_confidence: 0.88 },
  { task_id: 'TASK_085', canonical_task_name: 'Selling produce at market', primary_skill_id: 'FS_SOFT_003', primary_skill_name: 'Market Linkage', primary_confidence: 0.92 },
  { task_id: 'TASK_086', canonical_task_name: 'Finding buyers', primary_skill_id: 'FS_SOFT_003', primary_skill_name: 'Market Linkage', primary_confidence: 0.90 },
  { task_id: 'TASK_087', canonical_task_name: 'Negotiating prices', primary_skill_id: 'FS_SOFT_003', primary_skill_name: 'Market Linkage', primary_confidence: 0.88 },
  { task_id: 'TASK_088', canonical_task_name: 'Planning farm activities', primary_skill_id: 'FS_SOFT_004', primary_skill_name: 'Farm Planning', primary_confidence: 0.92 },
  { task_id: 'TASK_089', canonical_task_name: 'Budgeting farm expenses', primary_skill_id: 'FS_SOFT_005', primary_skill_name: 'Financial Management', primary_confidence: 0.90 },
  { task_id: 'TASK_090', canonical_task_name: 'Managing farm finances', primary_skill_id: 'FS_SOFT_005', primary_skill_name: 'Financial Management', primary_confidence: 0.92 },
  
  // ADDITIONAL COMMON TASKS
  { task_id: 'TASK_100', canonical_task_name: 'General farming', primary_skill_id: 'HS_CROP_001', primary_skill_name: 'Land Preparation', primary_confidence: 0.70 },
  { task_id: 'TASK_101', canonical_task_name: 'Mixed farming', primary_skill_id: 'HS_CROP_001', primary_skill_name: 'Land Preparation', primary_confidence: 0.65 },
  { task_id: 'TASK_102', canonical_task_name: 'Dairy farming', primary_skill_id: 'HS_LIVE_007', primary_skill_name: 'Manual Milking Operations', primary_confidence: 0.85 },
  { task_id: 'TASK_103', canonical_task_name: 'Crop farming', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.80 },
  { task_id: 'TASK_104', canonical_task_name: 'Livestock farming', primary_skill_id: 'HS_LIVE_001', primary_skill_name: 'Animal Feeding', primary_confidence: 0.80 },
  { task_id: 'TASK_105', canonical_task_name: 'Tea picking', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.88 },
  { task_id: 'TASK_106', canonical_task_name: 'Coffee picking', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.88 },
  { task_id: 'TASK_107', canonical_task_name: 'Sugar cane cutting', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.90 },
  { task_id: 'TASK_108', canonical_task_name: 'Rice farming', primary_skill_id: 'HS_CROP_002', primary_skill_name: 'Planting/Seeding', primary_confidence: 0.85 },
  { task_id: 'TASK_109', canonical_task_name: 'Cotton picking', primary_skill_id: 'HS_CROP_007', primary_skill_name: 'Harvesting', primary_confidence: 0.88 },
  { task_id: 'TASK_110', canonical_task_name: 'Agroforestry', primary_skill_id: 'HS_CROP_009', primary_skill_name: 'Pruning & Training', primary_confidence: 0.75 },
];

// Skills taxonomy (82 skills from SkillGraph)
const SKILLS_INDEX: Record<string, { skill_id: string; skill_name: string; skill_category: string; skill_type: string; domain_id: string; is_foundation: boolean }> = {
  // Livestock
  'HS_LIVE_001': { skill_id: 'HS_LIVE_001', skill_name: 'Animal Feeding', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: true },
  'HS_LIVE_002': { skill_id: 'HS_LIVE_002', skill_name: 'Animal Housing Management', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_003': { skill_id: 'HS_LIVE_003', skill_name: 'Animal Health Care', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_004': { skill_id: 'HS_LIVE_004', skill_name: 'Breeding Management', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_005': { skill_id: 'HS_LIVE_005', skill_name: 'Poultry Management', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_006': { skill_id: 'HS_LIVE_006', skill_name: 'Small Ruminant Management', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_007': { skill_id: 'HS_LIVE_007', skill_name: 'Manual Milking Operations', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_008': { skill_id: 'HS_LIVE_008', skill_name: 'Machine Milking Operations', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_009': { skill_id: 'HS_LIVE_009', skill_name: 'Pig Husbandry', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_010': { skill_id: 'HS_LIVE_010', skill_name: 'Rabbit Production', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_011': { skill_id: 'HS_LIVE_011', skill_name: 'Aquaculture Management', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  'HS_LIVE_012': { skill_id: 'HS_LIVE_012', skill_name: 'Apiculture', skill_category: 'Livestock Management', skill_type: 'Hard Skill', domain_id: 'DOM_LIVE', is_foundation: false },
  
  // Crop Production
  'HS_CROP_001': { skill_id: 'HS_CROP_001', skill_name: 'Land Preparation', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: true },
  'HS_CROP_002': { skill_id: 'HS_CROP_002', skill_name: 'Planting/Seeding', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: true },
  'HS_CROP_003': { skill_id: 'HS_CROP_003', skill_name: 'Irrigation Management', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_004': { skill_id: 'HS_CROP_004', skill_name: 'Fertilizer Application', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: true },
  'HS_CROP_005': { skill_id: 'HS_CROP_005', skill_name: 'Pest Control', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_006': { skill_id: 'HS_CROP_006', skill_name: 'Weed Management', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: true },
  'HS_CROP_007': { skill_id: 'HS_CROP_007', skill_name: 'Harvesting', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: true },
  'HS_CROP_008': { skill_id: 'HS_CROP_008', skill_name: 'Post-Harvest Handling', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_009': { skill_id: 'HS_CROP_009', skill_name: 'Pruning & Training', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_010': { skill_id: 'HS_CROP_010', skill_name: 'Grafting & Budding', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_011': { skill_id: 'HS_CROP_011', skill_name: 'Nursery Management', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_012': { skill_id: 'HS_CROP_012', skill_name: 'Greenhouse Management', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_013': { skill_id: 'HS_CROP_013', skill_name: 'Soil Testing & Analysis', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  'HS_CROP_014': { skill_id: 'HS_CROP_014', skill_name: 'Disease Management', skill_category: 'Crop Production', skill_type: 'Hard Skill', domain_id: 'DOM_CROP', is_foundation: false },
  
  // Machinery
  'HS_MACH_001': { skill_id: 'HS_MACH_001', skill_name: 'Tractor Operation', skill_category: 'Machinery & Equipment', skill_type: 'Hard Skill', domain_id: 'DOM_MACH', is_foundation: false },
  'HS_MACH_002': { skill_id: 'HS_MACH_002', skill_name: 'Equipment Maintenance', skill_category: 'Machinery & Equipment', skill_type: 'Hard Skill', domain_id: 'DOM_MACH', is_foundation: false },
  'HS_MACH_003': { skill_id: 'HS_MACH_003', skill_name: 'Harvester Operation', skill_category: 'Machinery & Equipment', skill_type: 'Hard Skill', domain_id: 'DOM_MACH', is_foundation: false },
  'HS_MACH_004': { skill_id: 'HS_MACH_004', skill_name: 'Pump Operation', skill_category: 'Machinery & Equipment', skill_type: 'Hard Skill', domain_id: 'DOM_MACH', is_foundation: false },
  'HS_MACH_005': { skill_id: 'HS_MACH_005', skill_name: 'Sprayer Operation', skill_category: 'Machinery & Equipment', skill_type: 'Hard Skill', domain_id: 'DOM_MACH', is_foundation: false },
  
  // Horticulture
  'HS_HORT_001': { skill_id: 'HS_HORT_001', skill_name: 'Vegetable Production', skill_category: 'Horticulture', skill_type: 'Hard Skill', domain_id: 'DOM_HORT', is_foundation: false },
  'HS_HORT_002': { skill_id: 'HS_HORT_002', skill_name: 'Fruit Production', skill_category: 'Horticulture', skill_type: 'Hard Skill', domain_id: 'DOM_HORT', is_foundation: false },
  'HS_HORT_003': { skill_id: 'HS_HORT_003', skill_name: 'Floriculture', skill_category: 'Horticulture', skill_type: 'Hard Skill', domain_id: 'DOM_HORT', is_foundation: false },
  
  // Soft Skills
  'FS_SOFT_001': { skill_id: 'FS_SOFT_001', skill_name: 'Farm Record Keeping', skill_category: 'Management', skill_type: 'Soft Skill', domain_id: 'DOM_MGMT', is_foundation: true },
  'FS_SOFT_002': { skill_id: 'FS_SOFT_002', skill_name: 'Team Supervision', skill_category: 'Management', skill_type: 'Soft Skill', domain_id: 'DOM_MGMT', is_foundation: false },
  'FS_SOFT_003': { skill_id: 'FS_SOFT_003', skill_name: 'Market Linkage', skill_category: 'Management', skill_type: 'Soft Skill', domain_id: 'DOM_MGMT', is_foundation: false },
  'FS_SOFT_004': { skill_id: 'FS_SOFT_004', skill_name: 'Farm Planning', skill_category: 'Management', skill_type: 'Soft Skill', domain_id: 'DOM_MGMT', is_foundation: false },
  'FS_SOFT_005': { skill_id: 'FS_SOFT_005', skill_name: 'Financial Management', skill_category: 'Management', skill_type: 'Soft Skill', domain_id: 'DOM_MGMT', is_foundation: false },
};

export interface MappingResult {
  primary_skill: {
    skill_id: string;
    skill_name: string;
    confidence: number;
    tier: 'high' | 'medium' | 'low';
  } | null;
  canonical_task_matched: string | null;
  matching_method: 'rule_based_taxonomy';
  needs_review: boolean;
  user_input: string;
}

class TaxonomyService {
  /**
   * Main mapping function - maps user task description to skills
   * NO external AI calls - all mapping is local and deterministic
   */
  mapTaskToSkills(userTaskDescription: string): MappingResult {
    if (!userTaskDescription || userTaskDescription.trim().length === 0) {
      return this.createEmptyResult(userTaskDescription);
    }

    // Normalize input
    const normalizedInput = this.normalizeText(userTaskDescription);

    // Find best matching canonical task
    const matches = CANONICAL_TASKS.map(task => ({
      task,
      similarity: this.calculateSimilarity(
        normalizedInput,
        this.normalizeText(task.canonical_task_name)
      )
    }));

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    const topMatch = matches[0];

    // Determine confidence tier based on similarity score
    if (topMatch.similarity >= 0.85) {
      // HIGH CONFIDENCE - auto-approve
      return {
        primary_skill: {
          skill_id: topMatch.task.primary_skill_id,
          skill_name: topMatch.task.primary_skill_name,
          confidence: Math.min(topMatch.similarity * topMatch.task.primary_confidence, 0.99),
          tier: 'high'
        },
        canonical_task_matched: topMatch.task.canonical_task_name,
        matching_method: 'rule_based_taxonomy',
        needs_review: false,
        user_input: userTaskDescription
      };
    } else if (topMatch.similarity >= 0.60) {
      // MEDIUM CONFIDENCE - needs review
      return {
        primary_skill: {
          skill_id: topMatch.task.primary_skill_id,
          skill_name: topMatch.task.primary_skill_name,
          confidence: topMatch.similarity * topMatch.task.primary_confidence,
          tier: 'medium'
        },
        canonical_task_matched: topMatch.task.canonical_task_name,
        matching_method: 'rule_based_taxonomy',
        needs_review: true,
        user_input: userTaskDescription
      };
    } else {
      // LOW CONFIDENCE - needs manual mapping
      return {
        primary_skill: topMatch.similarity >= 0.40 ? {
          skill_id: topMatch.task.primary_skill_id,
          skill_name: topMatch.task.primary_skill_name,
          confidence: topMatch.similarity * topMatch.task.primary_confidence,
          tier: 'low'
        } : null,
        canonical_task_matched: topMatch.task.canonical_task_name,
        matching_method: 'rule_based_taxonomy',
        needs_review: true,
        user_input: userTaskDescription
      };
    }
  }

  /**
   * Batch map multiple tasks
   */
  batchMapTasks(tasks: string[]): MappingResult[] {
    return tasks
      .filter(task => task && task.trim().length > 0)
      .map(task => this.mapTaskToSkills(task));
  }

  /**
   * Calculate similarity between two strings
   * Uses combination of keyword matching and Jaccard similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Word-based Jaccard similarity
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccardSimilarity = union.size > 0 
      ? intersection.size / union.size 
      : 0;

    // Substring matching bonus
    let substringBonus = 0;
    const longerStr = str1.length > str2.length ? str1 : str2;
    const shorterStr = str1.length > str2.length ? str2 : str1;
    
    if (longerStr.includes(shorterStr)) {
      substringBonus = 0.3;
    }

    // Keyword matching bonus
    const keywords = this.extractKeywords(str1);
    const taskKeywords = this.extractKeywords(str2);
    const keywordMatches = keywords.filter(k => taskKeywords.includes(k)).length;
    const keywordBonus = keywords.length > 0 ? (keywordMatches / Math.max(keywords.length, taskKeywords.length)) * 0.4 : 0;

    // Combined score
    return Math.min(jaccardSimilarity + substringBonus + keywordBonus, 1.0);
  }

  /**
   * Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    const keywords = [
      'milk', 'milking', 'cow', 'cattle', 'dairy', 'livestock', 'animal', 'feed', 'feeding',
      'vaccin', 'treat', 'health', 'breed', 'inseminat', 'poultry', 'chicken', 'egg',
      'goat', 'sheep', 'pig', 'rabbit', 'fish', 'bee', 'honey',
      'plough', 'till', 'land', 'soil', 'plant', 'seed', 'sow', 'transplant',
      'irrigat', 'water', 'drip', 'spray', 'fertiliz', 'manure', 'compost',
      'pest', 'insect', 'weed', 'herbicide', 'harvest', 'pick', 'reap',
      'dry', 'store', 'grade', 'process', 'prune', 'graft', 'bud',
      'nursery', 'greenhouse', 'tunnel', 'test', 'disease',
      'tractor', 'machine', 'equipment', 'maintain', 'repair',
      'vegetable', 'tomato', 'kale', 'fruit', 'mango', 'flower',
      'record', 'account', 'supervis', 'manage', 'lead', 'market', 'sell', 'buyer'
    ];
    
    const textLower = text.toLowerCase();
    return keywords.filter(k => textLower.includes(k));
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Create empty result for invalid input
   */
  private createEmptyResult(userInput: string): MappingResult {
    return {
      primary_skill: null,
      canonical_task_matched: null,
      matching_method: 'rule_based_taxonomy',
      needs_review: true,
      user_input: userInput
    };
  }

  /**
   * Validate that a skill ID exists in taxonomy
   */
  isValidSkillId(skillId: string): boolean {
    return skillId in SKILLS_INDEX;
  }

  /**
   * Get skill details by ID
   */
  getSkillById(skillId: string) {
    return SKILLS_INDEX[skillId];
  }

  /**
   * Get all valid skill IDs
   */
  getAllSkillIds(): string[] {
    return Object.keys(SKILLS_INDEX);
  }

  /**
   * Get taxonomy statistics
   */
  getTaxonomyStats() {
    return {
      total_canonical_tasks: CANONICAL_TASKS.length,
      total_skills: Object.keys(SKILLS_INDEX).length,
      skills_by_domain: this.getSkillsByDomain()
    };
  }

  private getSkillsByDomain() {
    const domainCounts: Record<string, number> = {};
    Object.values(SKILLS_INDEX).forEach(skill => {
      domainCounts[skill.domain_id] = (domainCounts[skill.domain_id] || 0) + 1;
    });
    return domainCounts;
  }
}

// Export singleton instance
export const taxonomyService = new TaxonomyService();
export default taxonomyService;
