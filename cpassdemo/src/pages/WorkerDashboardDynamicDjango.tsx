import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { djangoClient } from '@/integrations/django/client';
import { Loader2 } from 'lucide-react';
interface WorkerDashboardDynamicDjangoProps {
  userId?: string | undefined;
}
const API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';
export default function WorkerDashboardDynamicDjango({ userId: propUserId }: WorkerDashboardDynamicDjangoProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // const [userId, setUserId] = useState<string | undefined>(user_id);
  // const userId = propUserId || location.state?.user_id || sessionStorage.getItem('user_id') || undefined;
  let userId = propUserId || undefined;

  useEffect(() => {
    const loadProfile = async () => {
      let user;
      try {
        // Get current authenticated user
        if (!userId) {
        const { data: userData, error: userError } = await djangoClient.auth.getUser();
        // debugger;
        console.log(")))> User Data:", userData);

        // if (userError || !userData?.user) {
        //   navigate('/worker-login');
        //   return;
        // }
        if (userError) {
          navigate('/worker-login');
          return;
        }

        user = userData.data.user;
	userId = user.id;

        }
        // else {
         
        // }
        // Fetch worker profile from Django API
        const response = await fetch(`${API_URL}/users/worker-profiles/${userId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          // No profile found, redirect to signup
          if (response.status === 404) {
            navigate('/signup/basic-info');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const result = await response.json();
        const profile = result.data || result;

        if (!profile) {
          // No profile yet, redirect to signup
          navigate('/signup/basic-info');
          return;
        }

        console.log(")))> EXISTS  Worker Profile:", profile);

        // Profile exists, redirect to dynamic dashboard with profile data
        navigate('/dashboard/worker/new', {
          state: { profile, userId: userId }
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        // On error, redirect to login
        navigate('/worker-login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );
}
