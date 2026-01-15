import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSignup } from "@/context/SignupContext";
import { calculateTrustScore, generateAccessCode } from "@/lib/signupTypes";
import { useToast } from "@/hooks/use-toast";
import { djangoClient } from "@/integrations/django/client";
import {
  CheckCircle2,
  Copy,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Loader2,
} from "lucide-react";

export default function SignupSuccessDjango() {
  const navigate = useNavigate();
  const { state, resetState } = useSignup();
  const { toast } = useToast();
  const [accessCode] = useState(generateAccessCode());
  const [isCreating, setIsCreating] = useState(true);
  const [profileCreated, setProfileCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  const trustScore = calculateTrustScore(state.skillProficiencies);
  const avgProficiency =
    state.skillProficiencies.length > 0
      ? (
          state.skillProficiencies.reduce(
            (sum, p) => sum + p.proficiency_rating,
            0
          ) / state.skillProficiencies.length
        ).toFixed(1)
      : "0";

  // Create profile on mount
  useEffect(() => {
    createWorkerProfile();
  }, []);

  const createWorkerProfile = async () => {
    console.log("═══ CREATING WORKER PROFILE (Django) ═══");
    console.log("State:", state);

    if (!state.phoneNumber) {
      setError("Missing phone number. Please restart signup.");
      setIsCreating(false);
      return;
    }

    if (!state.email) {
      setError("Missing email. Please restart signup.");
      setIsCreating(false);
      return;
    }

    try {
      // Prepare skills data matching Django backend format
      const skillsData = state.skillProficiencies.map((skill) => ({
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        proficiency_level: getProficiencyLevel(skill.proficiency_rating),
        proficiency_rating: skill.proficiency_rating,
        frequency: skill.frequency || null,
        supervision_level: skill.supervision_level || null,
        scale_context: skill.scale_context || [],
        evidence_types: skill.evidence_types || [],
        reference_contact: skill.reference_contact
          ? `${skill.reference_contact.name} (${skill.reference_contact.phone})`
          : null,
      }));

      // Call Django signup endpoint (creates auth + profile + skills in one transaction)
      const { data, error: signupError } = await djangoClient.auth.signUp({
        phone: state.phoneNumber,
        password: accessCode, // TODO: This is not a safe practice for production
        access_code: accessCode, // TODO: This is not a safe practice for production
        email: state.email,
        telegram_id: state.telegramId,
        data: {
          full_name: state.fullName,
          phone_number: state.phoneNumber,
          location: state.location || "",
          experience_duration: state.experienceDuration || "",
          invited_by_org: state.assignedOrg?.name || "",
          invitation_code: accessCode,
          skills: skillsData,
          tvet_institution_id: state.tvetInstitutionId,
        },
      });

      if (signupError) {
        console.error("Signup error:", signupError);
        throw new Error(signupError.message || "Signup failed");
      }

      if (!data) {
        throw new Error("No data returned from signup");
      }

      // Store the auto-generated email for user reference
      if (data.email) {
        setEmail(data.email);
      }

      console.log("Profile created successfully");
      setProfileCreated(true);

      toast({
        title: "Profile Created!",
        description: "Your CPASS profile has been saved successfully.",
      });
    } catch (err: any) {
      console.error("Profile creation failed:", err);
      setError(err.message || "Profile creation failed");
      toast({
        title: "Profile Creation Failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getProficiencyLevel = (rating: number): string => {
    if (rating <= 3) return "beginner";
    if (rating <= 6) return "intermediate";
    if (rating <= 9) return "advanced";
    return "expert";
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast({
      title: "Copied!",
      description: "Access code copied to clipboard",
    });
  };

  const copyEmail = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      toast({
        title: "Copied!",
        description: "Email copied to clipboard",
      });
    }
  };

  const handleLogin = () => {
    navigate("/worker-login");
  };

  const handleViewProfile = () => {
    // TODO: This is not used currently
    if (profileCreated) {
      resetState();
      navigate("/dashboard/worker/dynamic");
    } else if (error) {
      navigate("/worker-login");
    } else {
      toast({
        title: "Please wait",
        description: "Profile is still being created...",
      });
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <h1 className="text-xl font-display font-bold">
                Creating Your Profile...
              </h1>
              <p className="text-sm text-muted-foreground">
                Setting up your CPASS credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
              </div>
              <h1 className="text-xl font-display font-bold">
                Profile Creation Failed
              </h1>
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button
              onClick={() => navigate("/worker-login")}
              className="w-full"
              size="lg"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">
              🎉 Profile Created Successfully!
            </h1>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="font-semibold text-center">Your CPASS Profile:</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tier Achieved:</span>
                <span className="font-medium flex items-center gap-1">
                  🥉 Bronze
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Skills Documented:
                </span>
                <span className="font-medium">
                  {state.skillProficiencies.length ||
                    state.selectedTasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connected to:</span>
                <span className="font-medium">
                  {state.assignedOrg?.name || "CPASS Network"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Average Proficiency:
                </span>
                <span className="font-medium">{avgProficiency}/10</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <p className="font-semibold text-center">What's Next:</p>

            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Track Your Progress</p>
                <p className="text-xs text-muted-foreground">
                  Build your skills and work toward Silver and Gold tiers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  Explore Certification Pathways
                </p>
                <p className="text-xs text-muted-foreground">
                  Discover which certifications you're ready for
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-success/5 rounded-lg">
              <Briefcase className="w-5 h-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Access Job Opportunities</p>
                <p className="text-xs text-muted-foreground">
                  Your profile is visible to 3+ platforms
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleViewProfile} className="w-full" size="lg">
            Login →
          </Button>

          <div className="border-t border-border" />

          <div className="text-center space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Your Login Email:</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <code className="px-3 py-2 bg-muted rounded-lg font-mono text-sm break-all max-w-full">
                  {email || "Loading..."}
                </code>
                {email && (
                  <Button variant="ghost" size="icon" onClick={copyEmail}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Your Password:</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <code className="px-4 py-2 bg-muted rounded-lg font-mono text-lg font-bold tracking-widest">
                  {accessCode}
                </code>
                <Button variant="ghost" size="icon" onClick={copyAccessCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Save these credentials to access your profile from any device
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
