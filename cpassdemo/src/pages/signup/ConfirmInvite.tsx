import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useSignup } from '@/context/SignupContext';
import { CheckCircle2, Loader2 } from 'lucide-react';
import cpassLogo from '@/assets/cpass-logo.jpg';

export default function ConfirmInvite() {
  const navigate = useNavigate();
  const { state } = useSignup();
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendCode = () => {
    setSending(true);
    // Mock sending - simulate delay
    setTimeout(() => {
      setCodeSent(true);
      setSending(false);
    }, 1000);
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      // Accept any 6-digit code (mock verification)
      navigate('/signup/basic-info');
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return `+254 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={cpassLogo} alt="CPASS" className="h-12" />
          </div>
          <CardTitle className="text-2xl font-display">Verify Your Identity</CardTitle>
          <CardDescription>
            Confirm your connection to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization confirmation */}
          {/* <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your number is registered with:</p>
                <p className="text-lg font-display font-bold mt-1">
                  {state.assignedOrg?.name || 'Loading...'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {state.assignedOrg?.type === 'tvet' ? 'RPL Candidate' : 'Platform Worker'}
                </p>
              </div>
            </div>
          </div> */}

          {!codeSent ? (
            <>
              <div className="text-center text-sm text-muted-foreground">
                We'll send a verification code to:
                <p className="font-medium text-foreground mt-1">
                  {formatPhone(state.phoneNumber)}
                </p>
              </div>

              <Button onClick={handleSendCode} className="w-full" disabled={sending}>
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Verification Code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code:
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Didn't receive code?{' '}
                  <button 
                    onClick={handleSendCode}
                    className="text-primary hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>

              <Button 
                onClick={handleVerify} 
                className="w-full"
                disabled={otp.length !== 6}
              >
                Verify & Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
