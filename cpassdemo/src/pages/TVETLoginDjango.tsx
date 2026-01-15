import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Phone, Building, ArrowLeft } from 'lucide-react';
import { tvetClient } from '@/integrations/django/tvetClient';
import { toast } from 'sonner';

// Demo institutions with their login credentials
const DEMO_INSTITUTIONS = [
  { code: 'KIAMBU001', name: 'Kiambu Institute of Science and Technology', email: 'admin@kiambu001.demo', password: 'demo123' },
  { code: 'NAKURU001', name: 'Nakuru Technical Training Institute', email: 'admin@nakuru001.demo', password: 'demo123' },
  { code: 'MOMBASA001', name: 'Mombasa Technical University', email: 'admin@mombasa001.demo', password: 'demo123' },
];

export default function TVETLoginDjango() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactSales, setShowContactSales] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use TVET Dashboard backend login
      const { data, error } = await tvetClient.login(email, password);

      if (error || !data) {
        throw new Error(error?.error || error?.message || 'Login failed');
      }

      toast.success(`Welcome back, ${data.institution.name}!`);
      navigate('/dashboard/tvet-django', { state: { institution: data.institution } });
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo mode - login with actual demo credentials
  const handleDemoLogin = async (demoInstitution: typeof DEMO_INSTITUTIONS[0]) => {
    setLoading(true);
    try {
      const { data, error } = await tvetClient.login(demoInstitution.email, demoInstitution.password);

      if (error || !data) {
        throw new Error(error?.error || error?.message || 'Demo login failed');
      }

      toast.success(`Welcome to ${data.institution.name}!`);
      navigate('/dashboard/tvet-django', { 
        state: { institution: data.institution } 
      });
    } catch (error: any) {
      toast.error(error.message || 'Demo login failed. Make sure the TVET Dashboard server is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  if (showContactSales) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md relative">
          <CardHeader className="text-center pt-12">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4"
              onClick={() => setShowContactSales(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="mx-auto mb-4 w-16 h-16 bg-portal-tvet rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Get CPASS for Your Institution</CardTitle>
            <CardDescription>Contact our team to set up TVET access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <h3 className="font-semibold text-blue-900">What You'll Get:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ RPL candidate pipeline management</li>
                <li>✓ WBL student tracking system</li>
                <li>✓ Alumni outcomes dashboard (privacy-protected)</li>
                <li>✓ Integration with your existing systems</li>
                <li>✓ Custom assessment workflows</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Email</div>
                  <a href="mailto:sales@cpass.ai" className="text-primary hover:underline">
                    sales@cpass.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Phone</div>
                  <div className="text-sm text-muted-foreground">+254 700 000 000</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Office</div>
                  <div className="text-sm text-muted-foreground">
                    Nairobi, Kenya
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal Selection
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-portal-tvet rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle>TVET Institution Login</CardTitle>
            <CardDescription>
              Access your institution's dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@institution.ac.ke"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-center text-muted-foreground mb-3">
                Demo Institutions (Click to login):
              </p>
              <div className="space-y-2">
                {DEMO_INSTITUTIONS.map((inst) => (
                  <Button
                    key={inst.code}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDemoLogin(inst)}
                    disabled={loading}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {inst.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setShowContactSales(true)}
                className="text-sm"
              >
                Don't have access? Contact Sales →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
