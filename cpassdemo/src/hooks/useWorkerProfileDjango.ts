import { useQuery } from '@tanstack/react-query';
import { djangoClient } from '@/integrations/django/client';

export interface WorkerProfile {
  id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  location?: string;
  tier?: string;
  overall_tier?: string;
  trust_score?: number;
  total_points?: number;
  total_skills?: number;
  bronze_skills?: number;
  silver_skills?: number;
  gold_skills?: number;
  platinum_skills?: number;
  work_status?: string;
  experience_duration?: string;
  invited_by_org?: string;
  upload_source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkerSkill {
  id: string;
  worker_id: string;
  skill_id?: string;
  skill_name: string;
  proficiency_level?: string;
  proficiency_rating?: number;
  frequency?: string;
  years_experience?: number;
  supervision_level?: string;
  scale_context?: any[];
  evidence_types?: any[];
  reference_contact?: string;
  skill_verification_tier?: string;
  verification_source?: string;
  verified_by?: string;
  last_practiced_date?: string;
  credibility_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkerCertification {
  id: string;
  worker_id: string;
  certification_name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  certification_url?: string;
}

export interface WorkerDomain {
  id: string;
  worker_id: string;
  domain_name: string;
}

export interface WorkerProfileData {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
  certifications?: WorkerCertification[];
  domains?: WorkerDomain[];
}

const API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

export function useWorkerProfile(workerId: string | null) {
  return useQuery({
    queryKey: ['worker-complete-profile', workerId],
    queryFn: async (): Promise<WorkerProfileData> => {
      if (!workerId) {
        return { profile: null, skills: [], certifications: [], domains: [] };
      }

      try {
        // Get worker profile with all related data
        const response = await fetch(`${API_URL}/users/worker-profiles/${workerId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          // Try bulk uploaded workers if profile not found
          const bulkResponse = await fetch(`${API_URL}/bulk-uploaded-workers/?id=${workerId}`);
          if (bulkResponse.ok) {
            const bulkData = await bulkResponse.json();
            if (bulkData.data && bulkData.data.length > 0) {
              const bulkWorker = bulkData.data[0];
              return {
                profile: {
                  id: bulkWorker.id,
                  full_name: bulkWorker.full_name,
                  phone_number: bulkWorker.phone_number,
                  location: bulkWorker.location,
                  tier: 'bronze',
                  trust_score: 0,
                  total_skills: 0,
                },
                skills: [],
                certifications: [],
                domains: [],
              };
            }
          }
          throw new Error('Profile not found');
        }

        const data = await response.json();
        const profileData = data.data || data;

        return {
          profile: profileData,
          skills: profileData.skills || [],
          certifications: profileData.certifications || [],
          domains: profileData.domains || [],
        };
      } catch (error) {
        console.error('Error fetching worker profile:', error);
        return { profile: null, skills: [], certifications: [], domains: [] };
      }
    },
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCurrentWorkerProfile() {
  const userQuery = useQuery({
    queryKey: ['current-auth-user'],
    queryFn: async () => {
      const { data, error } = await djangoClient.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const workerId = userQuery.data?.id || null;
  const profileQuery = useWorkerProfile(workerId);

  return {
    ...profileQuery,
    userId: workerId,
    isAuthLoading: userQuery.isLoading,
    authError: userQuery.error,
  };
}

// Additional hook for fetching worker skills separately
export function useWorkerSkills(workerId: string | null) {
  return useQuery({
    queryKey: ['worker-skills', workerId],
    queryFn: async (): Promise<WorkerSkill[]> => {
      if (!workerId) return [];

      try {
        const response = await fetch(`${API_URL}/worker-skills/?worker_id=${workerId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch skills');

        const data = await response.json();
        return data.data || data || [];
      } catch (error) {
        console.error('Error fetching worker skills:', error);
        return [];
      }
    },
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for demo profiles
export function useDemoProfiles() {
  return useQuery({
    queryKey: ['demo-profiles'],
    queryFn: async (): Promise<WorkerProfile[]> => {
      try {
        const response = await fetch(`${API_URL}/worker-profiles/demo_profiles/`);

        if (!response.ok) throw new Error('Failed to fetch demo profiles');

        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching demo profiles:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}
