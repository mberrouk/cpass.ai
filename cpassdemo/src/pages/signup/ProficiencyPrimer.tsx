import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSignup } from '@/context/SignupContext';
import { Target, CheckCircle2, Briefcase, TrendingUp } from 'lucide-react';
import cpassLogo from '@/assets/cpass-logo.jpg';

export default function ProficiencyPrimer() {
  const navigate = useNavigate();
  const { state } = useSignup();

  const handleBuildProfile = () => {
    navigate('/signup/proficiency-rating');
  };

  const handleSkip = () => {
    navigate('/signup/success');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">Almost There!</h1>
            <p className="text-muted-foreground">One More Important Step</p>
          </div>

          {/* Skills count */}
          <div className="text-center py-3 bg-muted/50 rounded-lg">
            <p className="text-lg">
              You've selected <span className="font-bold text-primary">{state.selectedTasks.length}</span> skills.
            </p>
            <p className="text-sm text-muted-foreground">
              Now let's make your profile POWERFUL.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Benefits */}
          <div className="space-y-4">
            <p className="font-medium text-center">Why this matters:</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">Training institutions</span> can fast-track your certification (save months!)
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">Employers</span> see detailed proof of your experience (not just claims)
                </p>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-sm">
                  You're <span className="font-medium">10x more likely to be hired</span> with a complete profile
                </p>
              </div>
            </div>

            <div className="p-3 bg-accent/10 rounded-lg text-center">
              <p className="text-sm">
                📊 Workers with detailed profiles earn{' '}
                <span className="font-bold text-accent">40% more</span> on average
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Time estimate */}
          <p className="text-center text-sm text-muted-foreground">
            This takes 5-10 minutes and makes a HUGE difference to your opportunities.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleBuildProfile} className="w-full" size="lg">
              Let's Build My Complete Profile! →
            </Button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
