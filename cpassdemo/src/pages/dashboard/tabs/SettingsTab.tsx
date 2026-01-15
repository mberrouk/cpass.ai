import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Settings, Eye, GraduationCap, Bell, Lock, Download, FileText, Key } from 'lucide-react';

interface WorkerProfileData {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  location?: string;
}

interface SettingsTabProps {
  profile: WorkerProfileData | null;
  onProfileUpdate: () => void;
}

export function SettingsTab({ profile, onProfileUpdate }: SettingsTabProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    visibleToPartners: true,
    visibleToTVET: true,
    completedTVET: false,
    emailJobOpportunities: true,
    emailCertificationPathways: true,
    emailUpskilling: false,
    email: profile?.email || '',
    phone: profile?.phone_number || profile?.phone || '',
    fullName: profile?.full_name || '',
    location: profile?.location || '',
  });

  const handleSave = async () => {
    setSaving(true);
    // Settings save functionality requires worker_profiles table
    toast({
      title: 'Settings',
      description: 'Settings save requires worker profiles table to be configured.',
    });
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your profile preferences and account settings</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Profile Visibility</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Who can see your profile?</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="partners" className="flex-1">
              Make profile visible to platform partners
            </Label>
            <Switch
              id="partners"
              checked={settings.visibleToPartners}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, visibleToPartners: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="tvet" className="flex-1">
              Make profile visible to TVET institutions
            </Label>
            <Switch
              id="tvet"
              checked={settings.visibleToTVET}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, visibleToTVET: checked }))}
            />
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Education History</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Did you attend TVET training?</p>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="tvet-training"
            checked={settings.completedTVET}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, completedTVET: checked as boolean }))}
          />
          <Label htmlFor="tvet-training">Yes, I completed formal training</Label>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Notifications</h2>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-jobs"
              checked={settings.emailJobOpportunities}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, emailJobOpportunities: checked as boolean }))}
            />
            <Label htmlFor="email-jobs">Email me about job opportunities</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-certs"
              checked={settings.emailCertificationPathways}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, emailCertificationPathways: checked as boolean }))}
            />
            <Label htmlFor="email-certs">Email me about certification pathways</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-upskill"
              checked={settings.emailUpskilling}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, emailUpskilling: checked as boolean }))}
            />
            <Label htmlFor="email-upskill">Email me about upskilling programs</Label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={settings.fullName}
              onChange={(e) => setSettings(s => ({ ...s, fullName: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={settings.location}
              onChange={(e) => setSettings(s => ({ ...s, location: e.target.value }))}
              placeholder="City, Region"
            />
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Account</h2>
        </div>
        
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Key className="w-4 h-4 mr-2" /> Change Password
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" /> Download My Data
          </Button>
          
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <FileText className="w-4 h-4 mr-2" /> Privacy Policy
          </Button>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
