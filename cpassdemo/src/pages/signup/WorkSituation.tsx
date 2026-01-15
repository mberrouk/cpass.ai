import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSignup } from '@/context/SignupContext';
import { WorkSituation as WorkSituationType, ExperienceDuration } from '@/lib/signupTypes';
import cpassLogo from '@/assets/cpass-logo.jpg';

const WORK_SITUATIONS: { value: WorkSituationType; label: string }[] = [
  { value: 'full-time', label: 'I work full-time for a farm/employer' },
  { value: 'casual', label: 'I do casual or seasonal work' },
  { value: 'self-employed', label: 'I work for myself' },
  { value: 'looking', label: "I'm currently looking for work" },
  { value: 'student', label: "I'm a student or in training" },
];

const EXPERIENCE_DURATIONS: { value: ExperienceDuration; label: string }[] = [
  { value: '<6mo', label: '< 6 months' },
  { value: '6mo-2yr', label: '6mo - 2yr' },
  { value: '2-5yr', label: '2-5 years' },
  { value: '5-10yr', label: '5-10 years' },
  { value: '10+yr', label: '10+ years' },
];

export default function WorkSituation() {
  const navigate = useNavigate();
  const { state, setWorkSituation, setExperienceDuration } = useSignup();

  const handleContinue = () => {
    if (state.workSituation && state.experienceDuration) {
      navigate('/signup/domain-selection');
    }
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
              <span>Step 2 of 5</span>
            </div>
            <Progress value={40} className="h-2" />
          </div>
          <CardTitle className="text-2xl font-display mt-4">About your work</CardTitle>
          <CardDescription>
            This helps us match you with opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Do you have a supervisor or employer? *
            </Label>
            <RadioGroup
              value={state.workSituation || ''}
              onValueChange={(value) => setWorkSituation(value as WorkSituationType)}
            >
              {WORK_SITUATIONS.map((situation) => (
                <div key={situation.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={situation.value} id={situation.value} />
                  <Label htmlFor={situation.value} className="text-sm font-normal cursor-pointer">
                    {situation.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How long have you been doing agricultural work? *
            </Label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_DURATIONS.map((duration) => (
                <Button
                  key={duration.value}
                  type="button"
                  variant={state.experienceDuration === duration.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExperienceDuration(duration.value)}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full"
            disabled={!state.workSituation || !state.experienceDuration}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
