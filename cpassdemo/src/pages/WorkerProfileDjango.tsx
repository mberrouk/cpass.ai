import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { djangoClient } from "@/integrations/django/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Compass,
  Briefcase,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeft,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { ProfileTab } from "./dashboard/tabs/ProfileTab";
import { PathwaysTab } from "./dashboard/tabs/PathwaysTab";
import { OpportunitiesTab } from "./dashboard/tabs/OpportunitiesTab";
import { ProgressTab } from "./dashboard/tabs/ProgressTab";
import { SettingsTab } from "./dashboard/tabs/SettingsTab";
import cpassLogo from "@/assets/cpass-logo.png";

const API_URL =
  import.meta.env.VITE_DJANGO_API_URL || "http://localhost:8000/api";

export default function WorkerProfileDjango() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile"
  );
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current authenticated user
        const { data: userData, error: userError } =
          await djangoClient.auth.getUser();

        // if (userError || !userData?.user) {
        //   navigate('/worker-login');
        //   return;
        // }

        // debugger;

        if (userError) {
          navigate("/worker-login");
          return;
        }

        const user = userData.data.user;

        // Fetch worker profile from Django API
        const profileResponse = await fetch(
          `${API_URL}/users/worker-profiles/${user.id}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            navigate("/signup/basic-info");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const profileResult = await profileResponse.json();
        const profileData = profileResult.data || profileResult;

        if (!profileData) {
          navigate("/signup/basic-info");
          return;
        }

        setProfile(profileData);

        // Fetch worker skills from Django API
        const skillsResponse = await fetch(
          `${API_URL}/worker-skills/?worker_id=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (skillsResponse.ok) {
          const skillsResult = await skillsResponse.json();
          const skillsData = skillsResult.data || skillsResult || [];
          setSkills(skillsData);
        } else {
          setSkills([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        navigate("/worker-login");
      }
    };

    loadProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await djangoClient.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "W";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Back to portals button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Portals
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <img
                src={cpassLogo}
                alt="CPASS"
                className="h-10 object-contain"
              />
            </div>

            {/* Navigation Tabs - Desktop */}
            <nav className="hidden md:flex items-center">
              <div className="flex gap-1">
                <Button
                  variant={activeTab === "profile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Button>
                <Button
                  variant={activeTab === "pathways" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("pathways")}
                  className="gap-2"
                >
                  <Compass className="w-4 h-4" />
                  Pathways
                </Button>
                <Button
                  variant={
                    activeTab === "opportunities" ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => setActiveTab("opportunities")}
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Opportunities
                </Button>
                <Button
                  variant={activeTab === "progress" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("progress")}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Progress
                </Button>
                <Button
                  variant={activeTab === "settings" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("settings")}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <HelpCircle className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {profile?.full_name}
                    </span>
                    <Badge className="bg-yellow-500 text-white text-xs hidden sm:flex">
                      {profile?.tier || "Bronze"}
                    </Badge>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "profile" && (
          <ProfileTab profile={profile} skills={skills} />
        )}
        {activeTab === "pathways" && (
          <PathwaysTab profile={profile} skills={skills} />
        )}
        {activeTab === "opportunities" && (
          <OpportunitiesTab profile={profile} skills={skills} />
        )}
        {activeTab === "progress" && (
          <ProgressTab profile={profile} skills={skills} />
        )}
        {activeTab === "settings" && (
          <SettingsTab profile={profile} onProfileUpdate={() => {}} />
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card p-2">
        <div className="flex justify-around">
          <Button
            variant={activeTab === "profile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("profile")}
            className="flex-col h-auto py-2 px-3"
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Button>
          <Button
            variant={activeTab === "pathways" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("pathways")}
            className="flex-col h-auto py-2 px-3"
          >
            <Compass className="w-5 h-5" />
            <span className="text-xs mt-1">Pathways</span>
          </Button>
          <Button
            variant={activeTab === "opportunities" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("opportunities")}
            className="flex-col h-auto py-2 px-3"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-xs mt-1">Jobs</span>
          </Button>
          <Button
            variant={activeTab === "progress" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("progress")}
            className="flex-col h-auto py-2 px-3"
          >
            <Shield className="w-5 h-5" />
            <span className="text-xs mt-1">Progress</span>
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("settings")}
            className="flex-col h-auto py-2 px-3"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
