import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function WorkerDashboardDynamic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/worker/login');
        return;
      }

      // Fetch worker profile from database
      const { data: profile } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // No profile yet, redirect to signup
        navigate('/signup/basic-info');
        return;
      }

      // Profile exists, redirect to dynamic dashboard with profile data
      navigate('/dashboard/worker/new', { 
        state: { profile, userId: user.id } 
      });
    };

    loadProfile();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );
}
