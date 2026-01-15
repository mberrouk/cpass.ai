import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock types since tables don't exist yet
export interface WorkerProfile {
  id: string;
  full_name: string;
  phone?: string;
  location?: string;
  tier?: string;
  trust_score?: number;
  avatar_url?: string;
  bio?: string;
  total_points?: number;
  email?: string;
}

export interface WorkerSkill {
  id: string;
  worker_id: string;
  skill_id: string;
  skill_name: string;
  proficiency_level?: string;
  years_experience?: number;
  verification_source?: string;
}

export interface WorkerProfileData {
  profile: WorkerProfile | null;
  skills: WorkerSkill[];
}

export function useWorkerProfile(workerId: string | null) {
  return useQuery({
    queryKey: ['worker-complete-profile', workerId],
    queryFn: async (): Promise<WorkerProfileData> => {
      if (!workerId) {
        return { profile: null, skills: [] };
      }

      // Try to get from bulk_uploaded_workers first (the only table that exists)
      const { data: bulkWorker } = await supabase
        .from('bulk_uploaded_workers')
        .select('*')
        .eq('id', workerId)
        .maybeSingle();

      if (bulkWorker) {
        return {
          profile: {
            id: bulkWorker.id,
            full_name: bulkWorker.full_name,
            phone: bulkWorker.phone || undefined,
            location: bulkWorker.location || undefined,
            tier: 'Bronze',
            trust_score: 0,
          },
          skills: [],
        };
      }

      return { profile: null, skills: [] };
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
      const { data: { user } } = await supabase.auth.getUser();
      return user;
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
