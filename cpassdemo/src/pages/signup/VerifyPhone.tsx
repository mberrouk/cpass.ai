import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignup } from '@/context/SignupContext';
import { getAssignedOrg } from '@/lib/signupTypes';
import cpassLogo from '@/assets/cpass-logo.jpg';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { setPhoneNumber, setAssignedOrg } = useSignup();
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (!phone.trim()) return;
    
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone;
    
    setPhoneNumber(fullPhone);
    setAssignedOrg(getAssignedOrg(fullPhone));
    navigate('/signup/confirm-invite');
  };

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={cpassLogo} alt="CPASS" className="h-12" />
          </div>
          <CardTitle className="text-2xl font-display">Create Your Skills Profile</CardTitle>
          <CardDescription>
            Enter your phone number to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted rounded-md border border-input text-sm">
                +254
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="712 345 678"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your phone number (with or without leading 0)
            </p>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full"
            disabled={phone.replace(/\D/g, '').length < 9}
          >
            Continue
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to CPASS Terms & Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
