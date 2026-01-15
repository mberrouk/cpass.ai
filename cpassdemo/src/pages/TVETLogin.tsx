import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Phone, Building, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function TVETLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactSales, setShowContactSales] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verify TVET access
      const { data: tvetAuth, error: tvetError } = await supabase
        .from('tvet_auth')
        .select('*, tvet_institutions(*)')
        .eq('user_id', authData.user.id)
        .single();

      if (tvetError || !tvetAuth) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized for TVET access');
      }

      toast.success(`Welcome back, ${tvetAuth.tvet_institutions.institution_name}!`);
      navigate('/dashboard/tvet');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo mode - navigate directly for demo purposes
  const handleDemoLogin = (code: string) => {
    toast.success(`Demo: Logging in as ${code}`);
    navigate('/dashboard/tvet', { state: { demoInstitution: code } });
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
                  <a href="tel:+254700000000" className="text-primary">+254 700 000 000</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Schedule Demo</div>
                  <a 
                    href="https://calendly.com/cpass-demo" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Book a 30-minute demo
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Back to Home Navigation */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Selection
        </Button>
      </div>

      <div className="flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-2xl font-bold text-portal-tvet">
              CPASS.ai
            </div>
            <CardTitle>TVET Institution Login</CardTitle>
          <CardDescription>Access your institution's dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="admin@your-institution.ac.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-portal-tvet hover:bg-portal-tvet/90"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => toast.info('Please contact your institution administrator')}
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Demo Mode - Quick Access:
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleDemoLogin('BUKURA')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Bukura Agricultural College
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleDemoLogin('KSA')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Kenya School of Agriculture
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleDemoLogin('BARAKA')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Baraka Agricultural College
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-3">New institution?</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowContactSales(true)}
            >
              Contact Sales →
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
