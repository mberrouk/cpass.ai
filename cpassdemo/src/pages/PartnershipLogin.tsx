import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PartnershipLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // For now, just navigate to dashboard with demo data since partner_auth table doesn't exist
      navigate('/dashboard/partnership', { 
        state: { 
          demo: true,
          partnerCode: 'TWIGA',
          partnerName: 'Twiga Foods'
        } 
      });
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (partnerCode: string) => {
    navigate('/dashboard/partnership', {
      state: { 
        demo: true,
        partnerCode,
        partnerName: partnerCode === 'TWIGA' ? 'Twiga Foods' : 
                     partnerCode === 'HELLO_TRACTOR' ? 'Hello Tractor' : 
                     'Safaricom DigiFarm'
      }
    });
  };

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
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8">
        {/* Left: Value Proposition */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Platform Partner Portal</h1>
            <p className="text-xl text-muted-foreground">
              Access pre-verified agricultural worker credentials via API
            </p>
          </div>

          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Why CPASS?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Pre-Verified Credentials</div>
                  <div className="text-sm text-muted-foreground">Bronze → Silver → Gold → Platinum tiers</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">75-90% Cost Savings</div>
                  <div className="text-sm text-muted-foreground">$0.06/API call vs. $25 manual verification</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Cross-Platform Reputation</div>
                  <div className="text-sm text-muted-foreground">Discover multi-skilled workers (Uber + Twiga + packaging)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Real-Time API</div>
                  <div className="text-sm text-muted-foreground">Skills verified as work happens, not months later</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <strong>Trusted by:</strong> Twiga Foods, Hello Tractor, Safaricom DigiFarm
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Login</CardTitle>
              <CardDescription>Access your verified worker talent pool</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Access */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-sm">Demo Access (No Login Required)</CardTitle>
              <CardDescription>Explore the platform with sample data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => handleDemoLogin('TWIGA')}
              >
                <span>🥬 Twiga Foods Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => handleDemoLogin('HELLO_TRACTOR')}
              >
                <span>🚜 Hello Tractor Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => handleDemoLogin('DIGIFARM')}
              >
                <span>📱 DigiFarm Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Contact Sales */}
          <div className="text-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Don't have access? Contact Sales →
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
