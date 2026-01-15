import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useSignup } from "@/context/SignupContext";
import { LOCATIONS } from "@/lib/signupTypes";
import cpassLogo from "@/assets/cpass-logo.jpg";

interface TVETInstitution {
  id: string;
  institution_code: string;
  institution_name: string;
  location: string | null;
}

const API_URL = import.meta.env.VITE_DJANGO_API_URL || "http://localhost:8000/api";

export default function BasicInfo() {
  const navigate = useNavigate();
  const { state, setFullName, setLocation, setEmail, setTvetInstitutionId, setAssignedOrg } = useSignup();
  const [institutions, setInstitutions] = useState<TVETInstitution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch(`${API_URL}/users/tvet-institutions/`);
        if (response.ok) {
          const data = await response.json();
          setInstitutions(data);
        }
      } catch (error) {
        console.error("Failed to fetch institutions:", error);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchInstitutions();
  }, []);

  const handleInstitutionChange = (institutionId: string) => {
    if (institutionId === "none") {
      setTvetInstitutionId(null);
      setAssignedOrg(null);
    } else {
      setTvetInstitutionId(institutionId);
      const institution = institutions.find(i => i.id === institutionId);
      if (institution) {
        setAssignedOrg({ name: institution.institution_name, type: "tvet" });
      }
    }
  };

  const handleContinue = () => {
    if (state.fullName && state.location && state.email) {
      navigate("/signup/work-situation");
    }
  };

  const userDataIsComplete = () => {
    if (state.fullName && state.location && state.email) {
      const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (regex.test(state.email)) return true;
    }
    return false;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    return `+254 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={cpassLogo} alt="CPASS" className="h-12" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Step 1 of 5</span>
            </div>
            <Progress value={20} className="h-2" />
          </div>
          <CardTitle className="text-2xl font-display mt-4">
            Tell us about yourself
          </CardTitle>
          <CardDescription>
            Basic information to set up your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={state.fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formatPhone(state.phoneNumber)}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              value={state.email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>TVET Institution (optional)</Label>
            <Select 
              value={state.tvetInstitutionId || "none"} 
              onValueChange={handleInstitutionChange}
              disabled={loadingInstitutions}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingInstitutions ? "Loading..." : "Select your institution"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No institution</SelectItem>
                {institutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    {institution.institution_name}
                    {institution.location && ` - ${institution.location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select if you are affiliated with a TVET institution for skill verification
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={state.location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select your location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!userDataIsComplete()}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
