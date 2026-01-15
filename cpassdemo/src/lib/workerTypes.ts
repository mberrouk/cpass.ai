// Worker-related type definitions for CPASS platform

export type WorkerProfile = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  tier?: string;
  overall_tier?: string;
  trust_score?: number;
  total_points?: number;
  total_skills?: number;
  bronze_skill_count?: number;
  silver_skill_count?: number;
  gold_skill_count?: number;
  platinum_skill_count?: number;
  invited_by_org?: string;
  invited_by_type?: string;
  created_at: string;
  updated_at?: string;
};

export type WorkerSkill = {
  id: string;
  worker_id: string;
  skill_id: string;
  skill_name: string;
  proficiency_level?: string;
  proficiency_rating?: number;
  frequency?: string;
  years_experience?: string;
  scale_context?: string[];
  supervision_level?: string;
  evidence_types?: string[];
  reference_contact?: string;
  skill_verification_tier?: string;
  platform_task_count?: number;
  platform_name?: string;
  supervisor_attestations?: number;
  credibility_score?: number;
  last_practiced_date?: string;
  verification_source?: string;
  verified_by?: string;
  created_at: string;
};

export type SkillReference = {
  skill_id: string;
  skill_name: string;
  skill_category?: string;
  skill_type?: string;
  domain_id?: string;
  is_foundation?: boolean;
};

export type WorkerDomain = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
};

// Helper to check if a skill is verified
export const isSkillVerified = (skill: WorkerSkill): boolean => {
  return skill.verification_source != null && skill.verification_source !== '';
};
