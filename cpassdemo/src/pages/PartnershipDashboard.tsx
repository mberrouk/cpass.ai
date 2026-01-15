import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, BarChart3, Search, ClipboardList, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import APIUsageTab from '@/components/partnerships/APIUsageTab';
import DiscoverTalentTab from '@/components/partnerships/DiscoverTalentTab';
import TalentPipelineTab from '@/components/partnerships/TalentPipelineTab';
import TalentPoolOverviewTab from '@/components/partnerships/TalentPoolOverviewTab';

// Mock partner data since platform_partners table doesn't exist
const mockPartners: Record<string, any> = {
  'TWIGA': {
    id: '1',
    partner_name: 'Twiga Foods',
    partner_code: 'TWIGA',
    contact_person: 'John Kariuki',
    industry: 'Agricultural Supply Chain',
  },
  'HTRACTOR': {
    id: '2',
    partner_name: 'Hello Tractor',
    partner_code: 'HTRACTOR',
    contact_person: 'Mary Osei',
    industry: 'AgriTech Services',
  },
  'KCEP': {
    id: '3',
    partner_name: 'Kenya Cereal Enhancement Programme',
    partner_code: 'KCEP',
    contact_person: 'Peter Mutua',
    industry: 'Government Programme',
  },
};

export default function PartnershipDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPartner = async () => {
      const state = location.state as any;
      
      if (state?.demo && state?.partnerCode) {
        // Use mock data for demo mode
        const mockPartner = mockPartners[state.partnerCode];
        setPartner(mockPartner || mockPartners['TWIGA']);
      } else if (state?.partnerId) {
        // Try to find in mock data
        const mockPartner = Object.values(mockPartners).find(p => p.id === state.partnerId);
        setPartner(mockPartner || mockPartners['TWIGA']);
      } else {
        navigate('/login/partnership');
        return;
      }
      
      setLoading(false);
    };

    loadPartner();
  }, [location.state, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login/partnership');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Partner not found.</p>
          <Button onClick={() => navigate('/login/partnership')}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Portals
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Platform Partner Dashboard</h1>
                <p className="text-sm text-muted-foreground">{partner.partner_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm hidden md:block">
                <div className="font-medium text-foreground">{partner.contact_person}</div>
                <div className="text-muted-foreground">{partner.industry}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="api">
              <BarChart3 className="w-4 h-4 mr-2" />
              API Usage
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Search className="w-4 h-4 mr-2" />
              Discover Talent
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              <ClipboardList className="w-4 h-4 mr-2" />
              My Pipeline
            </TabsTrigger>
            <TabsTrigger value="overview">
              <Globe className="w-4 h-4 mr-2" />
              Talent Pool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api">
            <APIUsageTab partner={partner} />
          </TabsContent>

          <TabsContent value="discover">
            <DiscoverTalentTab partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="pipeline">
            <TalentPipelineTab partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="overview">
            <TalentPoolOverviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
