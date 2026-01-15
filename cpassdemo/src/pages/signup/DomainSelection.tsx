import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSignup } from '@/context/SignupContext';
import { DOMAINS } from '@/lib/signupTypes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import cpassLogo from '@/assets/cpass-logo.jpg';

export default function DomainSelection() {
  const navigate = useNavigate();
  const { state, toggleDomain } = useSignup();

  const handleContinue = () => {
    if (state.selectedDomains.length > 0) {
      navigate('/signup/work-contexts');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={cpassLogo} alt="CPASS" className="h-12" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Step 3 of 5</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
          <CardTitle className="text-2xl font-display mt-4">What type of work do you do?</CardTitle>
          <CardDescription>
            Select all that apply - most workers do multiple types of work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {DOMAINS.map((domain) => {
              const isSelected = state.selectedDomains.includes(domain.id);
              return (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{domain.icon}</span>
                      <div>
                        <h3 className="font-semibold">{domain.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {domain.description}
                        </p>
                        <p className="text-xs text-primary mt-1">
                          {domain.skillCount} skills available
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {state.selectedDomains.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">
              Please select at least one domain
            </p>
          )}

          <Button 
            onClick={handleContinue} 
            className="w-full"
            disabled={state.selectedDomains.length === 0}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
