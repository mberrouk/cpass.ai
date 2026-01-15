import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import cpassLogo from "@/assets/cpass-logo.jpg";

// Demo profile type
type DemoProfile = {
  name: string;
  phone: string;
  email: string;
  password: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  skills: number;
  location: string;
  accessCode?: string;
};

// Demo profiles - use consistent password for auto-creation
const DEMO_PASSWORD = "Demo1234!";
const DEMO_PROFILES: DemoProfile[] = [
  {
    name: "Grace Njeri",
    phone: "+254700000001",
    email: "grace@demo.agriworker.co",
    password: DEMO_PASSWORD,
    tier: "gold",
    skills: 11,
    location: "Nakuru",
    accessCode: "GRACE001",
  },
  {
    name: "Peter Ochieng",
    phone: "+254700000002",
    email: "peter@demo.agriworker.co",
    password: DEMO_PASSWORD,
    tier: "bronze",
    skills: 5,
    location: "Kisumu",
    accessCode: "PETER002",
  },
  {
    name: "Mary Wanjiku",
    phone: "+254700000003",
    email: "mary@demo.agriworker.co",
    password: DEMO_PASSWORD,
    tier: "silver",
    skills: 8,
    location: "Kiambu",
    accessCode: "MARY0003",
  },
  {
    name: "John Kamau",
    phone: "+254700000004",
    email: "john@demo.agriworker.co",
    password: DEMO_PASSWORD,
    tier: "platinum",
    skills: 17,
    location: "Eldoret",
    accessCode: "JOHN0004",
  },
];

const TIER_COLORS = {
  bronze: "bg-orange-100 text-orange-700 border-orange-200",
  silver: "bg-gray-100 text-gray-600 border-gray-200",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-purple-100 text-purple-700 border-purple-200",
};

const TIER_ICONS = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "🏆",
};

export default function WorkerLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone login state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log(data);
      if (error) throw error;

      toast({
        title: "Login successful!",
        description: "Redirecting to your dashboard...",
      });

      navigate("/dashboard/worker/dynamic");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleDemoProfileClick = async (profile: DemoProfile) => {
    setLoading(true);

    // Legacy passwords for existing demo accounts
    const legacyPasswords: Record<string, string> = {
      "grace@demo.agriworker.co": "gold2024",
      "peter@demo.agriworker.co": "bronze2024",
      "mary@demo.agriworker.co": "silver2024",
      "john@demo.agriworker.co": "platinum2024",
    };

    // Try new standard password first
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: DEMO_PASSWORD,
    });

    // If new password fails, try legacy password for existing accounts
    if (signInError && legacyPasswords[profile.email]) {
      const { error: legacyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: legacyPasswords[profile.email],
      });
      signInError = legacyError;
    }

    if (signInError) {
      // If both passwords fail, try to create the account
      const { error: signUpError } = await supabase.auth.signUp({
        email: profile.email,
        password: DEMO_PASSWORD,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: profile.name,
            tier: profile.tier,
          },
        },
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        toast({
          title: "Demo login failed",
          description: signUpError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Try to sign in again after signup
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: DEMO_PASSWORD,
      });

      if (retryError) {
        toast({
          title: "Login failed",
          description: `Could not login. Try manually with email: ${profile.email}`,
          variant: "destructive",
        });
        setEmail(profile.email);
        setLoading(false);
        return;
      }
    }

    toast({
      title: "Login successful!",
      description: `Welcome, ${profile.name}!`,
    });

    setLoading(false);
    navigate("/dashboard/worker");
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 9) {
      toast({
        title: "Invalid phone",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    toast({
      title: "Code Sent!",
      description: `Verification code sent to +254 ${phone}`,
    });
    setOtpSent(true);
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // For demo purposes, any 6-digit code works
    toast({
      title: "Phone verified!",
      description: "Redirecting to registration...",
    });

    navigate("/signup/basic-info");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Back to Home */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Selection
        </Button>
      </div>

      <div className="flex items-center justify-center px-4 pb-8">
        <div className="max-w-md w-full space-y-6">
          {/* Logo & Header */}
          <div className="text-center">
            <img src={cpassLogo} alt="CPASS" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Worker Login</h1>
            <p className="text-muted-foreground">Access your skills passport</p>
          </div>

          {/* Login Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Choose your preferred login method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email">
                <TabsList className="grid grid-cols-2 w-full mb-6">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone">
                  {!otpSent ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                            +254
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) =>
                              setPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 9)
                              )
                            }
                            placeholder="712345678"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleSendOtp}
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Send Verification Code
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleOtpLogin} className="space-y-4">
                      <div>
                        <Label>Enter 6-digit code</Label>
                        <div className="flex gap-2 justify-center mt-2">
                          {otp.map((digit, i) => (
                            <Input
                              key={i}
                              id={`otp-${i}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) =>
                                handleOtpChange(i, e.target.value)
                              }
                              className="w-10 h-12 text-center text-lg font-mono"
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Verify & Continue
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp(["", "", "", "", "", ""]);
                        }}
                      >
                        Change phone number
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Demo Profiles */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Demo Profiles
              </CardTitle>
              <CardDescription>
                Click to auto-fill login credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PROFILES.map((profile) => (
                  <button
                    key={profile.email}
                    onClick={() => handleDemoProfileClick(profile)}
                    className="p-3 text-left rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{TIER_ICONS[profile.tier]}</span>
                      <span className="font-medium text-sm">
                        {profile.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${TIER_COLORS[profile.tier]}`}>
                        {profile.tier}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {profile.skills} skills
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/signup/verify-phone")}
              >
                Create one →
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
