import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Compass, Briefcase, Shield, ArrowLeft, HelpCircle, Loader2 } from 'lucide-react';
import { ProfileTab } from './dashboard/tabs/ProfileTab';
import { PathwaysTab } from './dashboard/tabs/PathwaysTab';
import { OpportunitiesTab } from './dashboard/tabs/OpportunitiesTab';
import { ProgressTab } from './dashboard/tabs/ProgressTab';
import cpassLogo from '@/assets/cpass-logo.png';

const API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';

export default function WorkerProfilePublic() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch worker profile without authentication
        const profileResponse = await fetch(`${API_URL}/users/worker-profiles/${userId}/`);
        
        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            setError('Profile not found');
          } else {
            setError('Failed to load profile');
          }
          setLoading(false);
          return;
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch worker skills
        const skillsResponse = await fetch(`${API_URL}/users/worker-profiles/${userId}/skills/`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setSkills(skillsData || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = profile?.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'W';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <img src={cpassLogo} alt="CPASS" className="h-10 object-contain" />
            </div>

            {/* Navigation Tabs - Desktop */}
            <nav className="hidden md:flex items-center">
              <div className="flex gap-1">
                <Button
                  variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === 'pathways' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('pathways')}
                  className="gap-2"
                >
                  <Compass className="w-4 h-4" />
                  Pathways
                </Button>
                <Button
                  variant={activeTab === 'opportunities' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('opportunities')}
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Opportunities
                </Button>
                <Button
                  variant={activeTab === 'progress' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('progress')}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Progress
                </Button>
              </div>
            </nav>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <HelpCircle className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-medium">{profile?.user?.full_name}</span>
                <Badge className="bg-yellow-500 text-white text-xs hidden sm:flex">
                  {profile?.tier || 'Bronze'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 mb-20 md:mb-6">
        {activeTab === 'profile' && <ProfileTab profile={profile} skills={skills} />}
        {activeTab === 'pathways' && <PathwaysTab profile={profile} skills={skills} />}
        {activeTab === 'opportunities' && <OpportunitiesTab profile={profile} skills={skills} />}
        {activeTab === 'progress' && <ProgressTab profile={profile} skills={skills} />}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card p-2">
        <div className="flex justify-around">
          <Button
            variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex-col h-auto py-2 px-3"
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
          <Button
            variant={activeTab === 'pathways' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pathways')}
            className="flex-col h-auto py-2 px-3"
          >
            <Compass className="w-5 h-5" />
            <span className="text-xs mt-1">Pathways</span>
          </Button>
          <Button
            variant={activeTab === 'opportunities' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('opportunities')}
            className="flex-col h-auto py-2 px-3"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-xs mt-1">Jobs</span>
          </Button>
          <Button
            variant={activeTab === 'progress' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('progress')}
            className="flex-col h-auto py-2 px-3"
          >
            <Shield className="w-5 h-5" />
            <span className="text-xs mt-1">Progress</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
