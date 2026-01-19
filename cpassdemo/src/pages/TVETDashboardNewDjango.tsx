import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  BarChart3,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tvetClient } from "@/integrations/django/tvetClient";
import { toast } from "sonner";
import TVETDashboardTabDjango from "@/components/tvet/TVETDashboardTabDjango";
import StudentsTab from "@/components/tvet/StudentsTab";
import RPLCandidatesTabDjango from "@/components/tvet/RPLCandidatesTabDjango";
import AlumniTab from "@/components/tvet/AlumniTab";
import AnalyticsTabDjango from "@/components/tvet/AnalyticsTabDjango";
import BulkUploadTabDjango from "@/components/tvet/BulkUploadTabDjango";

export default function TVETDashboardNewDjango() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if in demo mode
  const isDemoMode = localStorage.getItem("demo_mode") === "true";
  const demoInstitutionCode =
    localStorage.getItem("demo_institution_code") || "KIAMBU001";

  // Demo institution data
  const demoInstitutions: Record<string, any> = {
    KIAMBU001: {
      institution_name: "Kiambu Institute of Science and Technology",
      location: "Kiambu",
      institution_code: "KIAMBU001",
    },
    NAKURU001: {
      institution_name: "Nakuru Technical Training Institute",
      location: "Nakuru",
      institution_code: "NAKURU001",
    },
    MOMBASA001: {
      institution_name: "Mombasa Technical University",
      location: "Mombasa",
      institution_code: "MOMBASA001",
    },
  };

  // Get current institution from Django backend (skip in demo mode)
  const { data: institution, isLoading: institutionLoading } = useQuery({
    queryKey: ["current-tvet-institution-django"],
    queryFn: async () => {
      const { data, error } = await tvetClient.getCurrentInstitution();
      if (error) {
        console.error("Failed to fetch institution:", error);
        toast.error("Failed to load institution data");
        return null;
      }
      return data;
    },
    retry: 1,
    enabled: !isDemoMode, // Only run if not in demo mode
  });

  // Get dashboard stats including RPL count (skip in demo mode)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["tvet-dashboard-stats-django"],
    queryFn: async () => {
      const { data, error } = await tvetClient.getDashboardStats();
      if (error) {
        console.error("Failed to fetch stats:", error);
        return null;
      }
      return data;
    },
    retry: 1,
    enabled: !isDemoMode, // Only run if not in demo mode
  });

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("institution");
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("demo_institution_code");
    toast.success("Signed out successfully");
    navigate("/login/tvet-django");
  };

  // Use demo data if in demo mode
  const currentInstitution = isDemoMode
    ? demoInstitutions[demoInstitutionCode]
    : institution;

  const rplCount = stats?.rpl_candidates || 0;

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
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Portals
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  TVET Institution Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {institutionLoading && !isDemoMode
                    ? "Loading..."
                    : currentInstitution?.institution_name ||
                      "TVET Institution"}
                  {isDemoMode && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      DEMO
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm hidden md:block">
                <div className="font-medium text-foreground">
                  {currentInstitution?.institution_name || "Institution"}
                </div>
                <div className="text-muted-foreground">
                  {currentInstitution?.location || ""}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-border"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="enhanced-tabs-list w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="dashboard" className="enhanced-tab-trigger">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="enhanced-tab-trigger">
              <Users className="w-4 h-4" />
              <span>Students</span>
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs bg-green-100 text-green-700"
              >
                12
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rpl" className="enhanced-tab-trigger">
              <GraduationCap className="w-4 h-4" />
              <span>RPL Candidates</span>
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs bg-purple-100 text-purple-700"
              >
                {statsLoading ? "..." : rplCount}
              </Badge>
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
            <TVETDashboardTabDjango
              institutionName={currentInstitution?.institution_name}
              onNavigateToTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="students" className="animate-fade-up">
            <StudentsTab />
          </TabsContent>
          <TabsContent value="rpl" className="animate-fade-up">
            <RPLCandidatesTabDjango />
          </TabsContent>
          <TabsContent value="alumni" className="animate-fade-up">
            <AlumniTab />
          </TabsContent>
          <TabsContent value="analytics" className="animate-fade-up">
            <AnalyticsTabDjango />
          </TabsContent>
          <TabsContent value="bulk-upload" className="animate-fade-up">
            <BulkUploadTabDjango
              institutionCode={currentInstitution?.institution_code || ""}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
