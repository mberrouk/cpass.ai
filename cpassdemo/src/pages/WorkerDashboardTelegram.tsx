import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { 
  authenticateWithToken, 
  authenticateWithTelegram, 
  checkSignupStatus, 
  getAuthTokenFromUrl 
} from '@/lib/telegramAuth';
import { djangoClient } from '@/integrations/django/client';
import WorkerDashboardDynamicDjango from './WorkerDashboardDynamicDjango';
import { set } from 'date-fns';

const API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

// ...existing imports...

export default function WorkerDashboardTelegram() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { webApp, user, isTelegramMiniApp, initData } = useTelegramWebApp();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log("LOAD PROFILE _MD_");
        
        // Check for auth token from URL
        const authToken = getAuthTokenFromUrl();
        
        if (authToken) {
          console.log('Auth token found in URL, authenticating...');
          
          const authResult = await authenticateWithToken(authToken);
          
          if (!authResult.success) {
            setError(authResult.error || 'Token authentication failed');
            setLoading(false);
            return;
          }
          
          console.log('Token authentication successful:', authResult.user);
          
          const telegramId = authResult.user?.telegram_id;
          if (!telegramId) {
            setError('No Telegram ID found');
            setLoading(false);
            return;
          }
          
          // Check signup status
          const signup_status = await checkSignupStatus(telegramId);
          console.log('Signup status:', signup_status);
          
          if (!signup_status.completed) {
            navigate(`/signup/basic-info-telegram?token=${authToken}`);
            return;
          }

          // Redirect to public profile page
          navigate(`/worker-profile/${signup_status.workerId}`);
          return;
        }
        else {
          setError('No auth token found in URL');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isTelegramMiniApp ? 'Authenticating with Telegram...' : 'Loading profile...'}
        </p>
      </div>
    </div>
  );
}