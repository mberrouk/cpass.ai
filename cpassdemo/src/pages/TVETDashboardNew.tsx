import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogOut, LayoutDashboard, Users, GraduationCap, Award, BarChart3, Upload } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TVETDashboardTab from '@/components/tvet/TVETDashboardTab';
import StudentsTab from '@/components/tvet/StudentsTab';
import RPLCandidatesTab from '@/components/tvet/RPLCandidatesTab';
import AlumniTab from '@/components/tvet/AlumniTab';
import AnalyticsTab from '@/components/tvet/AnalyticsTab';
import BulkUploadTab from '@/components/tvet/BulkUploadTab';

export default function TVETDashboardNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const demoInstitution = location.state?.demoInstitution || 'BUKURA';
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get current institution
  const { data: institution } = useQuery({
    queryKey: ['current-tvet-institution', demoInstitution],
    queryFn: async () => {
      const { data } = await supabase
        .from('tvet_institutions')
        .select('*')
        .eq('institution_code', demoInstitution)
        .maybeSingle();
      
      if (data) return data;

      const demoInstitutions: Record<string, any> = {
        'BUKURA': { institution_name: 'Bukura Agricultural College', location: 'Kakamega', institution_code: 'BUKURA' },
        'KSA': { institution_name: 'Kenya School of Agriculture', location: 'Nairobi', institution_code: 'KSA' },
        'BARAKA': { institution_name: 'Baraka Agricultural College', location: 'Molo', institution_code: 'BARAKA' },
      };
      return demoInstitutions[demoInstitution] || demoInstitutions['BUKURA'];
    }
  });

  // Get RPL candidates count from bulk_uploaded_workers
  const { data: rplCount } = useQuery({
    queryKey: ['rpl-candidates-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('bulk_uploaded_workers')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const handleSignOut = async () => {
    // await supabase.auth.signOut();
    navigate('/login/tvet-django');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <h1 className="text-xl font-bold text-foreground">TVET Institution Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {institution?.institution_name || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm hidden md:block">
                <div className="font-medium text-foreground">{institution?.institution_name}</div>
                <div className="text-muted-foreground">{institution?.location}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="enhanced-tabs-list w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="dashboard" className="enhanced-tab-trigger">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="enhanced-tab-trigger">
              <Users className="w-4 h-4" />
              <span>Students</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-green-100 text-green-700">12</Badge>
            </TabsTrigger>
            <TabsTrigger value="rpl" className="enhanced-tab-trigger">
              <GraduationCap className="w-4 h-4" />
              <span>RPL Candidates</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-purple-100 text-purple-700">{rplCount || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="alumni" className="enhanced-tab-trigger">
              <Award className="w-4 h-4" />
              <span>Alumni</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="enhanced-tab-trigger">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" className="enhanced-tab-trigger">
              <Upload className="w-4 h-4" />
              <span>Bulk Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-fade-up">
            <TVETDashboardTab 
              institutionName={institution?.institution_name} 
              onNavigateToTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="students" className="animate-fade-up"><StudentsTab /></TabsContent>
          <TabsContent value="rpl" className="animate-fade-up"><RPLCandidatesTab /></TabsContent>
          <TabsContent value="alumni" className="animate-fade-up"><AlumniTab /></TabsContent>
          <TabsContent value="analytics" className="animate-fade-up"><AnalyticsTab /></TabsContent>
          <TabsContent value="bulk-upload" className="animate-fade-up">
            <BulkUploadTab institutionCode={demoInstitution} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
