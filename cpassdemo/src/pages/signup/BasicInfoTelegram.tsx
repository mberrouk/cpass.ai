import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { useEffect, useState } from "react";
import {
  authenticateWithToken,
  authenticateWithTelegram,
  checkSignupStatus,
  getAuthTokenFromUrl,
} from "@/lib/telegramAuth";
import { Loader2 } from "lucide-react";

interface TVETInstitution {
  id: string;
  institution_code: string;
  institution_name: string;
  location: string | null;
}

const API_URL = import.meta.env.VITE_DJANGO_API_URL || "http://localhost:8000/api";

export default function BasicInfoTelegram() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    state,
    setFullName,
    setLocation,
    setEmail,
    setPhoneNumber,
    setTelegramId,
    setTvetInstitutionId,
    setAssignedOrg,
  } = useSignup();
  const { webApp, user, isTelegramMiniApp, initData } = useTelegramWebApp();
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
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

  useEffect(() => {
    const initTelegramUser = async () => {
      try {
        // First, try to get auth token from URL (primary method for keyboard WebApp)
        const authToken = getAuthTokenFromUrl();

        if (authToken) {
          console.log("Auth token found in URL, authenticating...");
          setAuthenticating(true);

          const authResult = await authenticateWithToken(authToken);

          if (!authResult.success) {
            console.error("Token authentication failed:", authResult.error);
            setLoading(false);
            setAuthenticating(false);
            return;
          }

          console.log("Token authentication successful:", authResult.user);

          // Set user data from auth result
          const telegramId = authResult.user?.telegram_id;
          if (telegramId) {
            setTelegramId(telegramId);

            // Check signup status
            const status = await checkSignupStatus(telegramId);

            if (status.completed && status.workerId) {
              navigate("/worker-dashboard-dynamic-django");
              return;
            }
          }

          // Pre-fill data from auth result
          if (authResult.user?.phone_number) {
            setPhoneNumber(authResult.user.phone_number);
          }

          if (authResult.user?.full_name) {
            setFullName(authResult.user.full_name);
          }

          setAuthenticating(false);
          setLoading(false);
          return;
        }

        // Fallback: Try URL params (legacy) or WebApp initData
        const telegramIdFromUrl = searchParams.get("telegram_id");
        const telegramId = user?.id?.toString() || telegramIdFromUrl;
        const phoneFromUrl = searchParams.get("phone_number");

        if (!telegramId) {
          console.error("No Telegram ID or auth token found");
          setLoading(false);
          return;
        }

        // Set telegram ID in context
        setTelegramId(telegramId);

        // If phone number provided in URL, set it
        if (phoneFromUrl) {
          setPhoneNumber(phoneFromUrl);
        }

        // Check signup status
        const status = await checkSignupStatus(telegramId);

        if (status.completed && status.workerId) {
          // User already completed signup, redirect to dashboard
          navigate("/worker-dashboard-dynamic-django");
          return;
        }

        // If we have initData from Telegram WebApp, authenticate (fallback for menu button)
        if (initData && isTelegramMiniApp) {
          setAuthenticating(true);
          const authResult = await authenticateWithTelegram(initData);

          if (authResult.success) {
            console.log("Telegram initData authentication successful");

            // Pre-fill name from Telegram if available
            if (user?.first_name) {
              const fullName = user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name;
              setFullName(fullName);
            }
          }
          setAuthenticating(false);
        }
      } catch (error) {
        console.error("Error initializing Telegram user:", error);
      } finally {
        setLoading(false);
      }
    };

    initTelegramUser();
  }, []);
    // user,
    // initData,
    // isTelegramMiniApp,
    // searchParams,
    // navigate,
    // setTelegramId,
    // setPhoneNumber,
    // setFullName,

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
    // Remove +254 prefix if present
    // const cleanPhone = phone.replace(/^\+254/, '');
    // if (cleanPhone.length >= 9) {
    //   return `+254 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
    // }
    return phone;
  };

  if (loading || authenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {authenticating ? "Authenticating..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

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
          {isTelegramMiniApp && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <p className="text-blue-800">✅ Connected via Telegram</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={state.fullName}
              onChange={(e) => setFullName(e.target.value)}
              
              placeholder="Enter your full name"
            />
          </div>

          {state.phoneNumber && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formatPhone(state.phoneNumber)}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
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
