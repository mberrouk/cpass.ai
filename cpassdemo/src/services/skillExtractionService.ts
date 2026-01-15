// Enhanced Skill Extraction Service
// Maps free-text work history to 82-skill agricultural taxonomy
// Uses canonical tasks with worker phrases, variations, and Swahili terms

// ============= TYPES =============

export interface TaskMapping {
  task_id: string;
  canonical_task_name: string;
  primary_skill_id: string;
  primary_skill_name: string;
  primary_confidence: number;
  search_phrases: string[]; // Combines worker_phrases + variations + canonical name + swahili
}

export interface ExtractedSkill {
  skill_id: string;
  skill_name: string;
  confidence: number; // 0.0-1.0
  source_text: string; // The sentence that matched
  matched_phrase: string; // Which search phrase matched
  estimated_proficiency: number; // 1-10 based on context
}

export interface ExtractionContext {
  years_experience?: string; // "1-3 years", "5-10 years", etc.
  work_type?: string; // "Crop Production", "Livestock Management", etc.
  farm_size?: string; // "Small farm (0.5-2 acres)", etc.
  frequency?: string; // "Daily", "Weekly", etc.
  supervision_level?: string; // "Independent", "Supervised", etc.
}

// ============= ENHANCED CANONICAL TASKS WITH PHRASES =============

const ENHANCED_CANONICAL_TASKS: Array<{
  task_id: string;
  canonical_task_name: string;
  primary_skill_id: string;
  primary_skill_name: string;
  primary_confidence: number;
  worker_phrases: string[];
  variations: string[];
  swahili_terms: string[];
}> = [
  // LIVESTOCK MANAGEMENT
  {
    task_id: 'TASK_001',
    canonical_task_name: 'Milking dairy cows by hand',
    primary_skill_id: 'HS_LIVE_007',
    primary_skill_name: 'Manual Milking Operations',
    primary_confidence: 0.95,
    worker_phrases: ['milking cows', 'hand milking', 'milking cattle', 'milk cows manually'],
    variations: ['hand-milking dairy cows', 'manual cow milking', 'milking by hand'],
    swahili_terms: ['kukamua ng\'ombe', 'kukamua maziwa', 'kamua ng\'ombe']
  },
  {
    task_id: 'TASK_002',
    canonical_task_name: 'Milking cows using machines',
    primary_skill_id: 'HS_LIVE_008',
    primary_skill_name: 'Machine Milking Operations',
    primary_confidence: 0.95,
    worker_phrases: ['machine milking', 'using milking machine', 'mechanical milking'],
    variations: ['operating milking machine', 'automated milking', 'dairy machine operation'],
    swahili_terms: ['kukamua na mashine', 'mashine ya kukamua']
  },
  {
    task_id: 'TASK_003',
    canonical_task_name: 'Feeding cattle and livestock',
    primary_skill_id: 'HS_LIVE_001',
    primary_skill_name: 'Animal Feeding',
    primary_confidence: 0.92,
    worker_phrases: ['feeding animals', 'animal feeding', 'feeding livestock', 'feeding cattle', 'giving food to animals'],
    variations: ['livestock feeding', 'cattle feeding', 'providing animal nutrition', 'supplementary feeding'],
    swahili_terms: ['kulisha mifugo', 'kulisha ng\'ombe', 'kulisha wanyama']
  },
  {
    task_id: 'TASK_004',
    canonical_task_name: 'Vaccinating animals',
    primary_skill_id: 'HS_LIVE_003',
    primary_skill_name: 'Animal Health Care',
    primary_confidence: 0.90,
    worker_phrases: ['vaccinating', 'giving vaccines', 'animal vaccination', 'immunizing animals'],
    variations: ['vaccination program', 'administering vaccines', 'livestock vaccination'],
    swahili_terms: ['kuchanja mifugo', 'chanjo ya wanyama']
  },
  {
    task_id: 'TASK_005',
    canonical_task_name: 'Treating sick animals',
    primary_skill_id: 'HS_LIVE_003',
    primary_skill_name: 'Animal Health Care',
    primary_confidence: 0.92,
    worker_phrases: ['treating animals', 'animal treatment', 'giving medicine to animals', 'caring for sick animals'],
    variations: ['veterinary care', 'animal healthcare', 'treating livestock diseases'],
    swahili_terms: ['kutibu wanyama', 'kutoa dawa kwa mifugo']
  },
  {
    task_id: 'TASK_006',
    canonical_task_name: 'Artificial insemination',
    primary_skill_id: 'HS_LIVE_004',
    primary_skill_name: 'Breeding Management',
    primary_confidence: 0.95,
    worker_phrases: ['AI services', 'insemination', 'breeding cattle', 'artificial breeding'],
    variations: ['cattle AI', 'livestock insemination', 'assisted reproduction'],
    swahili_terms: ['kupandisha ng\'ombe', 'AI ya ng\'ombe']
  },
  {
    task_id: 'TASK_007',
    canonical_task_name: 'Managing poultry birds',
    primary_skill_id: 'HS_LIVE_005',
    primary_skill_name: 'Poultry Management',
    primary_confidence: 0.92,
    worker_phrases: ['keeping chickens', 'poultry farming', 'managing chickens', 'chicken rearing', 'raising birds'],
    variations: ['poultry production', 'broiler management', 'layer management', 'keeping layers'],
    swahili_terms: ['kufuga kuku', 'ufugaji wa kuku', 'kulea kuku']
  },
  {
    task_id: 'TASK_008',
    canonical_task_name: 'Egg collection and grading',
    primary_skill_id: 'HS_LIVE_005',
    primary_skill_name: 'Poultry Management',
    primary_confidence: 0.88,
    worker_phrases: ['collecting eggs', 'egg collection', 'grading eggs', 'sorting eggs'],
    variations: ['egg harvesting', 'egg sorting', 'egg handling'],
    swahili_terms: ['kukusanya mayai', 'kuchagua mayai']
  },
  {
    task_id: 'TASK_009',
    canonical_task_name: 'Dehorning cattle',
    primary_skill_id: 'HS_LIVE_003',
    primary_skill_name: 'Animal Health Care',
    primary_confidence: 0.85,
    worker_phrases: ['dehorning', 'removing horns', 'horn removal'],
    variations: ['cattle dehorning', 'disbudding calves'],
    swahili_terms: ['kuondoa pembe']
  },
  {
    task_id: 'TASK_010',
    canonical_task_name: 'Castrating animals',
    primary_skill_id: 'HS_LIVE_003',
    primary_skill_name: 'Animal Health Care',
    primary_confidence: 0.85,
    worker_phrases: ['castration', 'castrating', 'neutering animals'],
    variations: ['animal castration', 'livestock castration'],
    swahili_terms: ['kuhasi mifugo']
  },
  {
    task_id: 'TASK_011',
    canonical_task_name: 'Hoof trimming',
    primary_skill_id: 'HS_LIVE_003',
    primary_skill_name: 'Animal Health Care',
    primary_confidence: 0.85,
    worker_phrases: ['hoof trimming', 'trimming hooves', 'foot care'],
    variations: ['hoof care', 'cattle foot trimming'],
    swahili_terms: ['kukata kwato']
  },
  {
    task_id: 'TASK_012',
    canonical_task_name: 'Managing goats',
    primary_skill_id: 'HS_LIVE_006',
    primary_skill_name: 'Small Ruminant Management',
    primary_confidence: 0.90,
    worker_phrases: ['goat farming', 'keeping goats', 'raising goats', 'goat rearing', 'managing dairy goats'],
    variations: ['goat husbandry', 'goat production', 'dairy goat management'],
    swahili_terms: ['kufuga mbuzi', 'ufugaji wa mbuzi']
  },
  {
    task_id: 'TASK_013',
    canonical_task_name: 'Managing sheep',
    primary_skill_id: 'HS_LIVE_006',
    primary_skill_name: 'Small Ruminant Management',
    primary_confidence: 0.90,
    worker_phrases: ['sheep farming', 'keeping sheep', 'raising sheep', 'sheep rearing'],
    variations: ['sheep husbandry', 'sheep production'],
    swahili_terms: ['kufuga kondoo', 'ufugaji wa kondoo']
  },
  {
    task_id: 'TASK_014',
    canonical_task_name: 'Shearing sheep',
    primary_skill_id: 'HS_LIVE_006',
    primary_skill_name: 'Small Ruminant Management',
    primary_confidence: 0.88,
    worker_phrases: ['shearing', 'wool shearing', 'sheep shearing'],
    variations: ['fleece removal', 'wool harvesting'],
    swahili_terms: ['kunyoa kondoo']
  },
  {
    task_id: 'TASK_015',
    canonical_task_name: 'Managing pigs',
    primary_skill_id: 'HS_LIVE_009',
    primary_skill_name: 'Pig Husbandry',
    primary_confidence: 0.92,
    worker_phrases: ['pig farming', 'keeping pigs', 'raising pigs', 'pig rearing', 'piggery management'],
    variations: ['swine management', 'pig production', 'piggery'],
    swahili_terms: ['kufuga nguruwe', 'ufugaji wa nguruwe']
  },
  {
    task_id: 'TASK_016',
    canonical_task_name: 'Rabbit keeping',
    primary_skill_id: 'HS_LIVE_010',
    primary_skill_name: 'Rabbit Production',
    primary_confidence: 0.90,
    worker_phrases: ['rabbit farming', 'keeping rabbits', 'raising rabbits', 'rabbit rearing'],
    variations: ['rabbit husbandry', 'rabbit production'],
    swahili_terms: ['kufuga sungura', 'ufugaji wa sungura']
  },
  {
    task_id: 'TASK_017',
    canonical_task_name: 'Fish farming',
    primary_skill_id: 'HS_LIVE_011',
    primary_skill_name: 'Aquaculture Management',
    primary_confidence: 0.92,
    worker_phrases: ['fish farming', 'fish rearing', 'keeping fish', 'aquaculture', 'fish ponds'],
    variations: ['fish production', 'tilapia farming', 'catfish farming', 'pond management'],
    swahili_terms: ['ufugaji wa samaki', 'kufuga samaki']
  },
  {
    task_id: 'TASK_018',
    canonical_task_name: 'Beekeeping',
    primary_skill_id: 'HS_LIVE_012',
    primary_skill_name: 'Apiculture',
    primary_confidence: 0.95,
    worker_phrases: ['beekeeping', 'keeping bees', 'honey production', 'bee farming'],
    variations: ['apiary management', 'bee hive management', 'honey harvesting'],
    swahili_terms: ['ufugaji wa nyuki', 'kufuga nyuki', 'kuvuna asali']
  },

  // CROP PRODUCTION
  {
    task_id: 'TASK_020',
    canonical_task_name: 'Ploughing land',
    primary_skill_id: 'HS_CROP_001',
    primary_skill_name: 'Land Preparation',
    primary_confidence: 0.92,
    worker_phrases: ['ploughing', 'plowing', 'tilling land', 'preparing land', 'breaking ground'],
    variations: ['land ploughing', 'soil ploughing', 'field preparation'],
    swahili_terms: ['kulima shamba', 'kuchimbua ardhi']
  },
  {
    task_id: 'TASK_021',
    canonical_task_name: 'Preparing seedbeds',
    primary_skill_id: 'HS_CROP_001',
    primary_skill_name: 'Land Preparation',
    primary_confidence: 0.90,
    worker_phrases: ['seedbed preparation', 'making seedbeds', 'preparing beds'],
    variations: ['bed preparation', 'nursery bed preparation'],
    swahili_terms: ['kutengeneza kitalu', 'kuandaa kitalu']
  },
  {
    task_id: 'TASK_022',
    canonical_task_name: 'Tilling soil',
    primary_skill_id: 'HS_CROP_001',
    primary_skill_name: 'Land Preparation',
    primary_confidence: 0.90,
    worker_phrases: ['tilling', 'soil tilling', 'cultivating soil', 'digging'],
    variations: ['soil cultivation', 'land tilling'],
    swahili_terms: ['kuchimba udongo', 'kulima']
  },
  {
    task_id: 'TASK_023',
    canonical_task_name: 'Planting seeds',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.95,
    worker_phrases: ['planting', 'sowing', 'seeding', 'planting seeds', 'seed planting'],
    variations: ['crop planting', 'seed sowing', 'manual planting'],
    swahili_terms: ['kupanda mbegu', 'kupanda']
  },
  {
    task_id: 'TASK_024',
    canonical_task_name: 'Transplanting seedlings',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.92,
    worker_phrases: ['transplanting', 'transplant seedlings', 'moving seedlings'],
    variations: ['seedling transplanting', 'plant transplanting'],
    swahili_terms: ['kupandikiza miche', 'kuhamisha miche']
  },
  {
    task_id: 'TASK_025',
    canonical_task_name: 'Sowing maize',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.90,
    worker_phrases: ['planting maize', 'sowing maize', 'maize planting', 'growing maize', 'maize farming'],
    variations: ['corn planting', 'maize sowing', 'corn farming'],
    swahili_terms: ['kupanda mahindi', 'kilimo cha mahindi']
  },
  {
    task_id: 'TASK_026',
    canonical_task_name: 'Planting beans',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.90,
    worker_phrases: ['planting beans', 'sowing beans', 'bean planting', 'growing beans'],
    variations: ['bean farming', 'legume planting'],
    swahili_terms: ['kupanda maharagwe', 'kilimo cha maharagwe']
  },
  {
    task_id: 'TASK_027',
    canonical_task_name: 'Irrigating crops',
    primary_skill_id: 'HS_CROP_003',
    primary_skill_name: 'Irrigation Management',
    primary_confidence: 0.95,
    worker_phrases: ['irrigation', 'irrigating', 'watering crops', 'managing irrigation'],
    variations: ['crop irrigation', 'field irrigation', 'water management'],
    swahili_terms: ['kumwagilia', 'umwagiliaji']
  },
  {
    task_id: 'TASK_028',
    canonical_task_name: 'Operating drip irrigation',
    primary_skill_id: 'HS_CROP_003',
    primary_skill_name: 'Irrigation Management',
    primary_confidence: 0.92,
    worker_phrases: ['drip irrigation', 'drip system', 'operating drip', 'drip watering'],
    variations: ['drip irrigation system', 'trickle irrigation'],
    swahili_terms: ['umwagiliaji wa matone', 'drip']
  },
  {
    task_id: 'TASK_029',
    canonical_task_name: 'Watering plants',
    primary_skill_id: 'HS_CROP_003',
    primary_skill_name: 'Irrigation Management',
    primary_confidence: 0.85,
    worker_phrases: ['watering', 'watering plants', 'giving water', 'plant watering'],
    variations: ['manual watering', 'hand watering'],
    swahili_terms: ['kumwagilia mimea', 'kumwagilia maji']
  },
  {
    task_id: 'TASK_030',
    canonical_task_name: 'Applying fertilizer',
    primary_skill_id: 'HS_CROP_004',
    primary_skill_name: 'Fertilizer Application',
    primary_confidence: 0.95,
    worker_phrases: ['fertilizer application', 'applying fertilizer', 'spreading fertilizer', 'fertilizing'],
    variations: ['fertilizer spreading', 'top dressing', 'basal application'],
    swahili_terms: ['kuweka mbolea', 'kutia mbolea']
  },
  {
    task_id: 'TASK_031',
    canonical_task_name: 'Spreading manure',
    primary_skill_id: 'HS_CROP_004',
    primary_skill_name: 'Fertilizer Application',
    primary_confidence: 0.88,
    worker_phrases: ['spreading manure', 'applying manure', 'manure application', 'organic fertilizer'],
    variations: ['manure spreading', 'composting', 'organic matter application'],
    swahili_terms: ['kuweka samadi', 'kutia samadi']
  },
  {
    task_id: 'TASK_032',
    canonical_task_name: 'Making compost',
    primary_skill_id: 'HS_CROP_004',
    primary_skill_name: 'Fertilizer Application',
    primary_confidence: 0.85,
    worker_phrases: ['composting', 'making compost', 'compost preparation'],
    variations: ['compost making', 'organic composting'],
    swahili_terms: ['kutengeneza mboji', 'mboji']
  },
  {
    task_id: 'TASK_033',
    canonical_task_name: 'Spraying pesticides',
    primary_skill_id: 'HS_CROP_005',
    primary_skill_name: 'Pest Control',
    primary_confidence: 0.95,
    worker_phrases: ['spraying', 'pesticide spraying', 'applying pesticides', 'chemical spraying'],
    variations: ['crop spraying', 'pest spraying', 'insecticide application'],
    swahili_terms: ['kunyunyizia dawa', 'kupulizia dawa']
  },
  {
    task_id: 'TASK_034',
    canonical_task_name: 'Controlling pests',
    primary_skill_id: 'HS_CROP_005',
    primary_skill_name: 'Pest Control',
    primary_confidence: 0.92,
    worker_phrases: ['pest control', 'controlling pests', 'pest management', 'killing pests'],
    variations: ['integrated pest management', 'IPM', 'pest prevention'],
    swahili_terms: ['kudhibiti wadudu', 'kupambana na wadudu']
  },
  {
    task_id: 'TASK_035',
    canonical_task_name: 'Managing insects',
    primary_skill_id: 'HS_CROP_005',
    primary_skill_name: 'Pest Control',
    primary_confidence: 0.88,
    worker_phrases: ['insect control', 'managing insects', 'insect management'],
    variations: ['insect pest control', 'bug control'],
    swahili_terms: ['kudhibiti wadudu waharibifu']
  },
  {
    task_id: 'TASK_036',
    canonical_task_name: 'Weeding crops',
    primary_skill_id: 'HS_CROP_006',
    primary_skill_name: 'Weed Management',
    primary_confidence: 0.95,
    worker_phrases: ['weeding', 'removing weeds', 'weed control', 'clearing weeds'],
    variations: ['crop weeding', 'field weeding', 'weed management'],
    swahili_terms: ['kupalilia', 'kung\'oa magugu']
  },
  {
    task_id: 'TASK_037',
    canonical_task_name: 'Using herbicides',
    primary_skill_id: 'HS_CROP_006',
    primary_skill_name: 'Weed Management',
    primary_confidence: 0.90,
    worker_phrases: ['herbicide application', 'applying herbicides', 'chemical weeding'],
    variations: ['herbicide spraying', 'weedkiller application'],
    swahili_terms: ['kutumia dawa ya magugu']
  },
  {
    task_id: 'TASK_038',
    canonical_task_name: 'Hand weeding',
    primary_skill_id: 'HS_CROP_006',
    primary_skill_name: 'Weed Management',
    primary_confidence: 0.92,
    worker_phrases: ['hand weeding', 'manual weeding', 'weeding by hand', 'pulling weeds'],
    variations: ['manual weed removal', 'hand weed control'],
    swahili_terms: ['kupalilia kwa mkono']
  },
  {
    task_id: 'TASK_039',
    canonical_task_name: 'Harvesting crops',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.95,
    worker_phrases: ['harvesting', 'crop harvesting', 'picking crops', 'gathering harvest'],
    variations: ['harvest operations', 'crop gathering', 'reaping'],
    swahili_terms: ['kuvuna', 'mavuno']
  },
  {
    task_id: 'TASK_040',
    canonical_task_name: 'Picking vegetables',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.90,
    worker_phrases: ['picking vegetables', 'vegetable harvesting', 'harvesting vegetables'],
    variations: ['vegetable picking', 'garden harvest'],
    swahili_terms: ['kuchuma mboga', 'kuvuna mboga']
  },
  {
    task_id: 'TASK_041',
    canonical_task_name: 'Reaping maize',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.92,
    worker_phrases: ['harvesting maize', 'reaping maize', 'maize harvesting', 'picking maize'],
    variations: ['corn harvesting', 'maize reaping'],
    swahili_terms: ['kuvuna mahindi']
  },
  {
    task_id: 'TASK_042',
    canonical_task_name: 'Drying crops',
    primary_skill_id: 'HS_CROP_008',
    primary_skill_name: 'Post-Harvest Handling',
    primary_confidence: 0.90,
    worker_phrases: ['drying', 'crop drying', 'drying produce', 'sun drying'],
    variations: ['grain drying', 'post-harvest drying'],
    swahili_terms: ['kuanika', 'kukausha mazao']
  },
  {
    task_id: 'TASK_043',
    canonical_task_name: 'Storing grains',
    primary_skill_id: 'HS_CROP_008',
    primary_skill_name: 'Post-Harvest Handling',
    primary_confidence: 0.92,
    worker_phrases: ['grain storage', 'storing grains', 'crop storage', 'storing produce'],
    variations: ['post-harvest storage', 'cereal storage'],
    swahili_terms: ['kuhifadhi nafaka', 'kuhifadhi mazao']
  },
  {
    task_id: 'TASK_044',
    canonical_task_name: 'Grading produce',
    primary_skill_id: 'HS_CROP_008',
    primary_skill_name: 'Post-Harvest Handling',
    primary_confidence: 0.88,
    worker_phrases: ['grading', 'produce grading', 'sorting produce', 'quality grading'],
    variations: ['crop grading', 'fruit grading', 'vegetable grading'],
    swahili_terms: ['kupanga mazao', 'kuchagua mazao']
  },
  {
    task_id: 'TASK_045',
    canonical_task_name: 'Processing crops',
    primary_skill_id: 'HS_CROP_008',
    primary_skill_name: 'Post-Harvest Handling',
    primary_confidence: 0.85,
    worker_phrases: ['processing', 'crop processing', 'produce processing'],
    variations: ['agricultural processing', 'value addition'],
    swahili_terms: ['kusindika mazao', 'usindikaji']
  },
  {
    task_id: 'TASK_046',
    canonical_task_name: 'Pruning trees',
    primary_skill_id: 'HS_CROP_009',
    primary_skill_name: 'Pruning & Training',
    primary_confidence: 0.95,
    worker_phrases: ['pruning', 'tree pruning', 'cutting branches', 'trimming trees'],
    variations: ['fruit tree pruning', 'plant pruning'],
    swahili_terms: ['kupogoa miti', 'kukata matawi']
  },
  {
    task_id: 'TASK_047',
    canonical_task_name: 'Training vines',
    primary_skill_id: 'HS_CROP_009',
    primary_skill_name: 'Pruning & Training',
    primary_confidence: 0.90,
    worker_phrases: ['training vines', 'vine training', 'trellising', 'staking plants'],
    variations: ['plant training', 'vine management'],
    swahili_terms: ['kufunga mizabibu', 'kusimamisha mimea']
  },
  {
    task_id: 'TASK_048',
    canonical_task_name: 'Grafting fruit trees',
    primary_skill_id: 'HS_CROP_010',
    primary_skill_name: 'Grafting & Budding',
    primary_confidence: 0.95,
    worker_phrases: ['grafting', 'tree grafting', 'grafting mango', 'grafting avocado', 'fruit tree grafting'],
    variations: ['side veneer grafting', 'cleft grafting', 'approach grafting'],
    swahili_terms: ['kuchanganya miti', 'kupandikiza']
  },
  {
    task_id: 'TASK_049',
    canonical_task_name: 'Budding seedlings',
    primary_skill_id: 'HS_CROP_010',
    primary_skill_name: 'Grafting & Budding',
    primary_confidence: 0.92,
    worker_phrases: ['budding', 'bud grafting', 'T-budding', 'chip budding'],
    variations: ['seedling budding', 'propagation by budding'],
    swahili_terms: ['kupandikiza kwa mbegu']
  },
  {
    task_id: 'TASK_050',
    canonical_task_name: 'Running a nursery',
    primary_skill_id: 'HS_CROP_011',
    primary_skill_name: 'Nursery Management',
    primary_confidence: 0.92,
    worker_phrases: ['nursery management', 'running nursery', 'managing nursery', 'seedling production'],
    variations: ['plant nursery', 'tree nursery', 'seedling nursery'],
    swahili_terms: ['kusimamia kitalu', 'kuendesha kitalu']
  },
  {
    task_id: 'TASK_051',
    canonical_task_name: 'Propagating plants',
    primary_skill_id: 'HS_CROP_011',
    primary_skill_name: 'Nursery Management',
    primary_confidence: 0.90,
    worker_phrases: ['propagation', 'plant propagation', 'multiplying plants', 'raising seedlings'],
    variations: ['vegetative propagation', 'seed propagation'],
    swahili_terms: ['kuzalisha miche', 'kueneza mimea']
  },
  {
    task_id: 'TASK_052',
    canonical_task_name: 'Managing greenhouse',
    primary_skill_id: 'HS_CROP_012',
    primary_skill_name: 'Greenhouse Management',
    primary_confidence: 0.95,
    worker_phrases: ['greenhouse management', 'managing greenhouse', 'greenhouse farming', 'protected cultivation'],
    variations: ['greenhouse production', 'controlled environment'],
    swahili_terms: ['kusimamia greenhouse', 'kilimo cha greenhouse']
  },
  {
    task_id: 'TASK_053',
    canonical_task_name: 'Growing in tunnels',
    primary_skill_id: 'HS_CROP_012',
    primary_skill_name: 'Greenhouse Management',
    primary_confidence: 0.88,
    worker_phrases: ['tunnel farming', 'growing in tunnels', 'polytunnel'],
    variations: ['tunnel production', 'shade net growing'],
    swahili_terms: ['kilimo cha tunnel']
  },
  {
    task_id: 'TASK_054',
    canonical_task_name: 'Testing soil',
    primary_skill_id: 'HS_CROP_013',
    primary_skill_name: 'Soil Testing & Analysis',
    primary_confidence: 0.95,
    worker_phrases: ['soil testing', 'testing soil', 'soil analysis', 'checking soil'],
    variations: ['soil sampling', 'soil pH testing'],
    swahili_terms: ['kupima udongo', 'uchunguzi wa udongo']
  },
  {
    task_id: 'TASK_055',
    canonical_task_name: 'Analyzing soil samples',
    primary_skill_id: 'HS_CROP_013',
    primary_skill_name: 'Soil Testing & Analysis',
    primary_confidence: 0.92,
    worker_phrases: ['soil analysis', 'analyzing soil', 'soil sample analysis'],
    variations: ['laboratory soil analysis', 'soil nutrient analysis'],
    swahili_terms: ['kuchunguza sampuli za udongo']
  },
  {
    task_id: 'TASK_056',
    canonical_task_name: 'Managing crop diseases',
    primary_skill_id: 'HS_CROP_014',
    primary_skill_name: 'Disease Management',
    primary_confidence: 0.92,
    worker_phrases: ['disease management', 'managing diseases', 'controlling plant diseases', 'disease control'],
    variations: ['crop disease control', 'plant pathology'],
    swahili_terms: ['kudhibiti magonjwa ya mimea']
  },
  {
    task_id: 'TASK_057',
    canonical_task_name: 'Identifying plant diseases',
    primary_skill_id: 'HS_CROP_014',
    primary_skill_name: 'Disease Management',
    primary_confidence: 0.90,
    worker_phrases: ['identifying diseases', 'disease identification', 'spotting plant diseases'],
    variations: ['disease diagnosis', 'plant disease recognition'],
    swahili_terms: ['kutambua magonjwa ya mimea']
  },

  // MACHINERY & EQUIPMENT
  {
    task_id: 'TASK_060',
    canonical_task_name: 'Operating tractor',
    primary_skill_id: 'HS_MACH_001',
    primary_skill_name: 'Tractor Operation',
    primary_confidence: 0.95,
    worker_phrases: ['tractor operation', 'driving tractor', 'operating tractor', 'tractor driving'],
    variations: ['farm tractor operation', 'tractor work'],
    swahili_terms: ['kuendesha trekta', 'kazi ya trekta']
  },
  {
    task_id: 'TASK_061',
    canonical_task_name: 'Driving farm machinery',
    primary_skill_id: 'HS_MACH_001',
    primary_skill_name: 'Tractor Operation',
    primary_confidence: 0.90,
    worker_phrases: ['driving machinery', 'farm machinery operation', 'operating farm equipment'],
    variations: ['agricultural machinery operation'],
    swahili_terms: ['kuendesha mashine za shamba']
  },
  {
    task_id: 'TASK_062',
    canonical_task_name: 'Maintaining equipment',
    primary_skill_id: 'HS_MACH_002',
    primary_skill_name: 'Equipment Maintenance',
    primary_confidence: 0.92,
    worker_phrases: ['equipment maintenance', 'maintaining equipment', 'machine maintenance', 'servicing machines'],
    variations: ['farm equipment maintenance', 'machinery upkeep'],
    swahili_terms: ['kutunza mashine', 'matengenezo ya mashine']
  },
  {
    task_id: 'TASK_063',
    canonical_task_name: 'Repairing farm machinery',
    primary_skill_id: 'HS_MACH_002',
    primary_skill_name: 'Equipment Maintenance',
    primary_confidence: 0.90,
    worker_phrases: ['repairing machinery', 'machine repair', 'fixing equipment', 'equipment repair'],
    variations: ['farm machinery repair', 'mechanical repairs'],
    swahili_terms: ['kurekebisha mashine', 'kutengeneza mashine']
  },
  {
    task_id: 'TASK_064',
    canonical_task_name: 'Servicing equipment',
    primary_skill_id: 'HS_MACH_002',
    primary_skill_name: 'Equipment Maintenance',
    primary_confidence: 0.88,
    worker_phrases: ['servicing', 'equipment servicing', 'machine servicing'],
    variations: ['regular servicing', 'preventive maintenance'],
    swahili_terms: ['kuhudumia mashine']
  },
  {
    task_id: 'TASK_065',
    canonical_task_name: 'Operating combine harvester',
    primary_skill_id: 'HS_MACH_003',
    primary_skill_name: 'Harvester Operation',
    primary_confidence: 0.95,
    worker_phrases: ['combine operation', 'operating harvester', 'combine harvester operation'],
    variations: ['harvester driving', 'mechanized harvesting'],
    swahili_terms: ['kuendesha mashine ya kuvunia']
  },
  {
    task_id: 'TASK_066',
    canonical_task_name: 'Using water pump',
    primary_skill_id: 'HS_MACH_004',
    primary_skill_name: 'Pump Operation',
    primary_confidence: 0.90,
    worker_phrases: ['pump operation', 'using pump', 'water pump operation', 'operating pump'],
    variations: ['irrigation pump operation', 'diesel pump operation'],
    swahili_terms: ['kutumia pampu', 'kuendesha pampu ya maji']
  },
  {
    task_id: 'TASK_067',
    canonical_task_name: 'Operating sprayer',
    primary_skill_id: 'HS_MACH_005',
    primary_skill_name: 'Sprayer Operation',
    primary_confidence: 0.92,
    worker_phrases: ['sprayer operation', 'operating sprayer', 'using sprayer', 'knapsack spraying'],
    variations: ['boom sprayer operation', 'backpack sprayer'],
    swahili_terms: ['kutumia sprayer', 'kuendesha sprayer']
  },

  // HORTICULTURE
  {
    task_id: 'TASK_070',
    canonical_task_name: 'Growing vegetables',
    primary_skill_id: 'HS_HORT_001',
    primary_skill_name: 'Vegetable Production',
    primary_confidence: 0.92,
    worker_phrases: ['vegetable farming', 'growing vegetables', 'vegetable production', 'vegetable gardening'],
    variations: ['horticulture', 'market gardening'],
    swahili_terms: ['kilimo cha mboga', 'kupanda mboga']
  },
  {
    task_id: 'TASK_071',
    canonical_task_name: 'Cultivating tomatoes',
    primary_skill_id: 'HS_HORT_001',
    primary_skill_name: 'Vegetable Production',
    primary_confidence: 0.90,
    worker_phrases: ['tomato farming', 'growing tomatoes', 'tomato production', 'cultivating tomatoes'],
    variations: ['tomato cultivation', 'tomato gardening'],
    swahili_terms: ['kilimo cha nyanya', 'kupanda nyanya']
  },
  {
    task_id: 'TASK_072',
    canonical_task_name: 'Growing kale sukuma wiki',
    primary_skill_id: 'HS_HORT_001',
    primary_skill_name: 'Vegetable Production',
    primary_confidence: 0.90,
    worker_phrases: ['growing kale', 'sukuma wiki farming', 'kale production', 'growing sukuma'],
    variations: ['kale cultivation', 'collard greens farming'],
    swahili_terms: ['kilimo cha sukuma wiki', 'kupanda sukuma']
  },
  {
    task_id: 'TASK_073',
    canonical_task_name: 'Fruit production',
    primary_skill_id: 'HS_HORT_002',
    primary_skill_name: 'Fruit Production',
    primary_confidence: 0.92,
    worker_phrases: ['fruit farming', 'fruit production', 'growing fruits', 'orchard management'],
    variations: ['fruit cultivation', 'fruit tree management'],
    swahili_terms: ['kilimo cha matunda', 'kupanda matunda']
  },
  {
    task_id: 'TASK_074',
    canonical_task_name: 'Managing mango orchard',
    primary_skill_id: 'HS_HORT_002',
    primary_skill_name: 'Fruit Production',
    primary_confidence: 0.88,
    worker_phrases: ['mango farming', 'mango orchard', 'growing mangoes', 'mango production'],
    variations: ['mango cultivation', 'orchard management'],
    swahili_terms: ['kilimo cha maembe', 'bustani ya maembe']
  },
  {
    task_id: 'TASK_075',
    canonical_task_name: 'Growing flowers',
    primary_skill_id: 'HS_HORT_003',
    primary_skill_name: 'Floriculture',
    primary_confidence: 0.95,
    worker_phrases: ['flower farming', 'growing flowers', 'floriculture', 'flower production'],
    variations: ['cut flower production', 'ornamental horticulture'],
    swahili_terms: ['kilimo cha maua', 'kupanda maua']
  },
  {
    task_id: 'TASK_076',
    canonical_task_name: 'Cut flower production',
    primary_skill_id: 'HS_HORT_003',
    primary_skill_name: 'Floriculture',
    primary_confidence: 0.92,
    worker_phrases: ['cut flowers', 'rose farming', 'flower harvesting', 'exporting flowers'],
    variations: ['rose production', 'flower export'],
    swahili_terms: ['uzalishaji wa maua']
  },

  // SOFT SKILLS & MANAGEMENT
  {
    task_id: 'TASK_080',
    canonical_task_name: 'Keeping farm records',
    primary_skill_id: 'FS_SOFT_001',
    primary_skill_name: 'Farm Record Keeping',
    primary_confidence: 0.95,
    worker_phrases: ['record keeping', 'keeping records', 'farm records', 'maintaining records'],
    variations: ['bookkeeping', 'documentation', 'farm accounting'],
    swahili_terms: ['kuweka kumbukumbu', 'rekodi za shamba']
  },
  {
    task_id: 'TASK_081',
    canonical_task_name: 'Managing accounts',
    primary_skill_id: 'FS_SOFT_001',
    primary_skill_name: 'Farm Record Keeping',
    primary_confidence: 0.88,
    worker_phrases: ['managing accounts', 'accounting', 'financial records', 'bookkeeping'],
    variations: ['farm accounting', 'financial management'],
    swahili_terms: ['kusimamia hesabu', 'uhasibu']
  },
  {
    task_id: 'TASK_082',
    canonical_task_name: 'Supervising workers',
    primary_skill_id: 'FS_SOFT_002',
    primary_skill_name: 'Team Supervision',
    primary_confidence: 0.92,
    worker_phrases: ['supervising', 'worker supervision', 'supervising workers', 'managing workers'],
    variations: ['team management', 'staff supervision', 'labor management'],
    swahili_terms: ['kusimamia wafanyakazi', 'usimamizi']
  },
  {
    task_id: 'TASK_083',
    canonical_task_name: 'Managing farm team',
    primary_skill_id: 'FS_SOFT_002',
    primary_skill_name: 'Team Supervision',
    primary_confidence: 0.90,
    worker_phrases: ['team management', 'managing team', 'farm team management', 'leading team'],
    variations: ['staff management', 'workforce management'],
    swahili_terms: ['kusimamia timu', 'uongozi wa timu']
  },
  {
    task_id: 'TASK_084',
    canonical_task_name: 'Leading workers',
    primary_skill_id: 'FS_SOFT_002',
    primary_skill_name: 'Team Supervision',
    primary_confidence: 0.88,
    worker_phrases: ['leading', 'leadership', 'leading workers', 'worker leadership'],
    variations: ['farm leadership', 'team leadership'],
    swahili_terms: ['kuongoza wafanyakazi']
  },
  {
    task_id: 'TASK_085',
    canonical_task_name: 'Selling produce at market',
    primary_skill_id: 'FS_SOFT_003',
    primary_skill_name: 'Market Linkage',
    primary_confidence: 0.92,
    worker_phrases: ['selling produce', 'marketing', 'market selling', 'selling at market'],
    variations: ['produce marketing', 'farm sales'],
    swahili_terms: ['kuuza mazao', 'biashara ya mazao']
  },
  {
    task_id: 'TASK_086',
    canonical_task_name: 'Finding buyers',
    primary_skill_id: 'FS_SOFT_003',
    primary_skill_name: 'Market Linkage',
    primary_confidence: 0.90,
    worker_phrases: ['finding buyers', 'buyer linkage', 'market access', 'connecting with buyers'],
    variations: ['buyer identification', 'market linkage'],
    swahili_terms: ['kutafuta wanunuzi', 'kuunganisha na soko']
  },
  {
    task_id: 'TASK_087',
    canonical_task_name: 'Negotiating prices',
    primary_skill_id: 'FS_SOFT_003',
    primary_skill_name: 'Market Linkage',
    primary_confidence: 0.88,
    worker_phrases: ['negotiating', 'price negotiation', 'bargaining', 'negotiating prices'],
    variations: ['price setting', 'market negotiation'],
    swahili_terms: ['kujadiliana bei', 'mazungumzo ya bei']
  },
  {
    task_id: 'TASK_088',
    canonical_task_name: 'Planning farm activities',
    primary_skill_id: 'FS_SOFT_004',
    primary_skill_name: 'Farm Planning',
    primary_confidence: 0.92,
    worker_phrases: ['farm planning', 'planning activities', 'crop planning', 'seasonal planning'],
    variations: ['agricultural planning', 'activity scheduling'],
    swahili_terms: ['kupanga shughuli za shamba', 'mpango wa kilimo']
  },
  {
    task_id: 'TASK_089',
    canonical_task_name: 'Budgeting farm expenses',
    primary_skill_id: 'FS_SOFT_005',
    primary_skill_name: 'Financial Management',
    primary_confidence: 0.90,
    worker_phrases: ['budgeting', 'farm budgeting', 'expense planning', 'financial planning'],
    variations: ['cost management', 'budget planning'],
    swahili_terms: ['kupanga bajeti', 'usimamizi wa fedha']
  },
  {
    task_id: 'TASK_090',
    canonical_task_name: 'Managing farm finances',
    primary_skill_id: 'FS_SOFT_005',
    primary_skill_name: 'Financial Management',
    primary_confidence: 0.92,
    worker_phrases: ['financial management', 'managing finances', 'farm finances', 'money management'],
    variations: ['farm financial management', 'cash flow management'],
    swahili_terms: ['kusimamia fedha za shamba']
  },

  // ADDITIONAL COMMON TASKS
  {
    task_id: 'TASK_100',
    canonical_task_name: 'General farming',
    primary_skill_id: 'HS_CROP_001',
    primary_skill_name: 'Land Preparation',
    primary_confidence: 0.70,
    worker_phrases: ['general farming', 'farming', 'farm work', 'agricultural work'],
    variations: ['mixed farming', 'subsistence farming'],
    swahili_terms: ['kilimo', 'kazi ya shamba']
  },
  {
    task_id: 'TASK_101',
    canonical_task_name: 'Mixed farming',
    primary_skill_id: 'HS_CROP_001',
    primary_skill_name: 'Land Preparation',
    primary_confidence: 0.65,
    worker_phrases: ['mixed farming', 'crop and livestock', 'integrated farming'],
    variations: ['diversified farming', 'agro-pastoral'],
    swahili_terms: ['kilimo mseto', 'kilimo na ufugaji']
  },
  {
    task_id: 'TASK_102',
    canonical_task_name: 'Dairy farming',
    primary_skill_id: 'HS_LIVE_007',
    primary_skill_name: 'Manual Milking Operations',
    primary_confidence: 0.85,
    worker_phrases: ['dairy farming', 'milk production', 'dairy production', 'keeping dairy cows'],
    variations: ['dairy management', 'milk farming'],
    swahili_terms: ['ufugaji wa ng\'ombe wa maziwa', 'kilimo cha maziwa']
  },
  {
    task_id: 'TASK_103',
    canonical_task_name: 'Crop farming',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.80,
    worker_phrases: ['crop farming', 'crop production', 'growing crops', 'arable farming'],
    variations: ['field crop production', 'crop cultivation'],
    swahili_terms: ['kilimo cha mazao']
  },
  {
    task_id: 'TASK_104',
    canonical_task_name: 'Livestock farming',
    primary_skill_id: 'HS_LIVE_001',
    primary_skill_name: 'Animal Feeding',
    primary_confidence: 0.80,
    worker_phrases: ['livestock farming', 'animal farming', 'keeping livestock', 'livestock production'],
    variations: ['animal husbandry', 'pastoral farming'],
    swahili_terms: ['ufugaji wa mifugo', 'kilimo cha mifugo']
  },
  {
    task_id: 'TASK_105',
    canonical_task_name: 'Tea picking',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.88,
    worker_phrases: ['tea picking', 'picking tea', 'tea harvesting', 'tea plucking'],
    variations: ['tea leaf harvesting', 'tea collection'],
    swahili_terms: ['kuchuma chai', 'kuvuna chai']
  },
  {
    task_id: 'TASK_106',
    canonical_task_name: 'Coffee picking',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.88,
    worker_phrases: ['coffee picking', 'picking coffee', 'coffee harvesting', 'coffee cherry picking'],
    variations: ['coffee bean harvesting', 'coffee collection'],
    swahili_terms: ['kuchuma kahawa', 'kuvuna kahawa']
  },
  {
    task_id: 'TASK_107',
    canonical_task_name: 'Sugar cane cutting',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.90,
    worker_phrases: ['sugarcane cutting', 'cutting sugarcane', 'cane cutting', 'sugarcane harvesting'],
    variations: ['cane harvesting', 'sugar cane harvest'],
    swahili_terms: ['kukata miwa', 'kuvuna miwa']
  },
  {
    task_id: 'TASK_108',
    canonical_task_name: 'Rice farming',
    primary_skill_id: 'HS_CROP_002',
    primary_skill_name: 'Planting/Seeding',
    primary_confidence: 0.85,
    worker_phrases: ['rice farming', 'growing rice', 'rice production', 'paddy farming'],
    variations: ['rice cultivation', 'wetland rice farming'],
    swahili_terms: ['kilimo cha mpunga', 'kupanda mpunga']
  },
  {
    task_id: 'TASK_109',
    canonical_task_name: 'Cotton picking',
    primary_skill_id: 'HS_CROP_007',
    primary_skill_name: 'Harvesting',
    primary_confidence: 0.88,
    worker_phrases: ['cotton picking', 'picking cotton', 'cotton harvesting'],
    variations: ['cotton harvest', 'cotton collection'],
    swahili_terms: ['kuchuma pamba', 'kuvuna pamba']
  },
  {
    task_id: 'TASK_110',
    canonical_task_name: 'Agroforestry',
    primary_skill_id: 'HS_CROP_009',
    primary_skill_name: 'Pruning & Training',
    primary_confidence: 0.75,
    worker_phrases: ['agroforestry', 'tree farming', 'farm forestry', 'growing trees on farm'],
    variations: ['silvopasture', 'alley cropping'],
    swahili_terms: ['kilimo msitu', 'kilimo cha miti']
  }
];

// ============= CACHED TAXONOMY =============

let cachedTaxonomy: TaskMapping[] | null = null;

// ============= CORE FUNCTIONS =============

/**
 * Load and cache the skill taxonomy
 */
export function loadSkillTaxonomy(): TaskMapping[] {
  if (cachedTaxonomy) {
    return cachedTaxonomy;
  }

  cachedTaxonomy = ENHANCED_CANONICAL_TASKS.map(task => {
    // Combine all search phrases
    const searchPhrases: string[] = [
      task.canonical_task_name.toLowerCase(),
      ...task.worker_phrases.map(p => p.toLowerCase().trim()),
      ...task.variations.map(v => v.toLowerCase().trim()),
      ...task.swahili_terms.map(s => s.toLowerCase().trim())
    ].filter(p => p.length > 0);

    return {
      task_id: task.task_id,
      canonical_task_name: task.canonical_task_name,
      primary_skill_id: task.primary_skill_id,
      primary_skill_name: task.primary_skill_name,
      primary_confidence: task.primary_confidence,
      search_phrases: searchPhrases
    };
  });

  return cachedTaxonomy;
}

/**
 * Calculate similarity between two strings using Jaccard + Levenshtein hybrid
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const clean1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const clean2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (clean1 === clean2) return 1.0;
  if (clean1.length === 0 || clean2.length === 0) return 0;

  // Check for substring match (one contains the other)
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    const longer = Math.max(clean1.length, clean2.length);
    const shorter = Math.min(clean1.length, clean2.length);
    return 0.7 + (0.3 * (shorter / longer));
  }

  // Jaccard similarity (word-based)
  const words1 = new Set(clean1.split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(clean2.split(/\s+/).filter(w => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  const jaccardScore = intersection.size / union.size;

  // Keyword overlap score (for partial matches)
  let keywordScore = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1.includes(w2) || w2.includes(w1)) {
        keywordScore += 0.5;
      }
    }
  }
  keywordScore = Math.min(keywordScore / Math.max(words1.size, words2.size), 1);

  // Combined score (weighted)
  return (jaccardScore * 0.6) + (keywordScore * 0.4);
}

/**
 * Estimate proficiency based on context
 */
export function estimateProficiency(
  context: ExtractionContext
): number {
  let baseScore = 5; // Default middle proficiency

  // Adjust by years of experience
  if (context.years_experience) {
    const exp = context.years_experience.toLowerCase();
    if (exp.includes('10+') || exp.includes('10 years') || exp.includes('more than 10')) {
      baseScore += 3;
    } else if (exp.includes('5-10') || exp.includes('5 to 10') || exp.includes('5+ years')) {
      baseScore += 2;
    } else if (exp.includes('3-5') || exp.includes('3 to 5') || exp.includes('3+ years')) {
      baseScore += 1;
    } else if (exp.includes('<1') || exp.includes('less than 1') || exp.includes('6 months')) {
      baseScore -= 1;
    }
  }

  // Adjust by frequency
  if (context.frequency) {
    const freq = context.frequency.toLowerCase();
    if (freq.includes('daily') || freq.includes('every day')) {
      baseScore += 1;
    } else if (freq.includes('weekly') || freq.includes('several') || freq.includes('often')) {
      baseScore += 0.5;
    } else if (freq.includes('rarely') || freq.includes('seasonal') || freq.includes('occasionally')) {
      baseScore -= 0.5;
    }
  }

  // Adjust by supervision level
  if (context.supervision_level) {
    const sup = context.supervision_level.toLowerCase();
    if (sup.includes('independent') || sup.includes('no supervision') || sup.includes('self')) {
      baseScore += 1;
    } else if (sup.includes('minimal') || sup.includes('occasional')) {
      baseScore += 0.5;
    } else if (sup.includes('close') || sup.includes('learning') || sup.includes('supervised')) {
      baseScore -= 1;
    }
  }

  // Adjust by farm size (larger = more complex)
  if (context.farm_size) {
    const size = context.farm_size.toLowerCase();
    if (size.includes('commercial') || size.includes('large')) {
      baseScore += 0.5;
    } else if (size.includes('small') || size.includes('subsistence')) {
      baseScore -= 0.5;
    }
  }

  // Cap at 1-10
  return Math.max(1, Math.min(10, Math.round(baseScore)));
}

/**
 * Main function: Extract skills from work history text
 */
export async function extractSkillsFromText(
  workHistory: string,
  context: ExtractionContext = {}
): Promise<ExtractedSkill[]> {
  // Handle empty or too short input
  if (!workHistory || workHistory.trim().length < 10) {
    return [];
  }

  // Load taxonomy
  const taxonomy = loadSkillTaxonomy();

  // Clean and split work history into sentences/segments
  const segments = workHistory
    .toLowerCase()
    .replace(/[;.\n,]+/g, '|') // Replace delimiters with |
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length >= 5); // Ignore very short fragments

  if (segments.length === 0) {
    return [];
  }

  // For each segment, find best matching tasks
  const matches: Array<{
    segment: string;
    task: TaskMapping;
    similarity: number;
    matchedPhrase: string;
  }> = [];

  for (const segment of segments) {
    let bestMatch: { task: TaskMapping; similarity: number; phrase: string } | null = null;

    for (const task of taxonomy) {
      for (const phrase of task.search_phrases) {
        const similarity = calculateSimilarity(segment, phrase);

        // Only consider matches above threshold
        if (similarity >= 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { task, similarity, phrase };
        }
      }
    }

    if (bestMatch) {
      matches.push({
        segment,
        task: bestMatch.task,
        similarity: bestMatch.similarity,
        matchedPhrase: bestMatch.phrase
      });
    }
  }

  // Group by skill_id (avoid duplicates, keep highest confidence)
  const skillMap = new Map<string, ExtractedSkill>();
  const proficiency = estimateProficiency(context);

  for (const match of matches) {
    const existingSkill = skillMap.get(match.task.primary_skill_id);
    const confidence = Math.min(match.similarity * match.task.primary_confidence, 0.99);

    if (!existingSkill || confidence > existingSkill.confidence) {
      skillMap.set(match.task.primary_skill_id, {
        skill_id: match.task.primary_skill_id,
        skill_name: match.task.primary_skill_name,
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        source_text: match.segment,
        matched_phrase: match.task.canonical_task_name,
        estimated_proficiency: proficiency
      });
    }
  }

  // Return sorted by confidence (highest first)
  return Array.from(skillMap.values())
    .filter(skill => skill.confidence >= 0.5) // Only return skills with ≥50% confidence
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Batch process multiple work histories
 */
export async function batchExtractSkills(
  workHistories: Array<{ id: string; text: string; context?: ExtractionContext }>
): Promise<Map<string, ExtractedSkill[]>> {
  const results = new Map<string, ExtractedSkill[]>();

  for (const item of workHistories) {
    const skills = await extractSkillsFromText(item.text, item.context);
    results.set(item.id, skills);
  }

  return results;
}

/**
 * Get taxonomy statistics
 */
export function getTaxonomyStats(): {
  totalTasks: number;
  totalSkills: number;
  totalSearchPhrases: number;
} {
  const taxonomy = loadSkillTaxonomy();
  const uniqueSkills = new Set(taxonomy.map(t => t.primary_skill_id));
  const totalPhrases = taxonomy.reduce((sum, t) => sum + t.search_phrases.length, 0);

  return {
    totalTasks: taxonomy.length,
    totalSkills: uniqueSkills.size,
    totalSearchPhrases: totalPhrases
  };
}

// Export singleton for convenient access
export const skillExtractionService = {
  loadSkillTaxonomy,
  calculateSimilarity,
  estimateProficiency,
  extractSkillsFromText,
  batchExtractSkills,
  getTaxonomyStats
};
