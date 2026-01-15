import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SilverProfile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-display font-bold">Worker Profile</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Individual Worker Profiles</h2>
          <p className="text-muted-foreground mb-4">
            This feature requires worker authentication tables to be configured.
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </main>
    </div>
  );
}
