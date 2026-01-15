import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function WorkerDashboardRouter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndRoute();
  }, []);

  const checkUserAndRoute = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No user, redirect to login
        navigate('/worker-login');
        return;
      }

      // Since worker_profiles table doesn't exist, route to default bronze tier
      // In a real implementation, this would check the user's tier
      navigate('/profile/bronze');
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/worker-login');
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return null;
}
