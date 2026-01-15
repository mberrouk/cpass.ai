import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSignup } from '@/context/SignupContext';
import cpassLogo from '@/assets/cpass-logo.jpg';

const FARM_SIZE_OPTIONS = [
  { value: 'small_plot', label: 'Small plot/garden (< 0.5 acre)' },
  { value: 'small_farm', label: 'Small farm (0.5-2 acres)' },
  { value: 'medium_farm', label: 'Medium farm (2-10 acres)' },
  { value: 'large_farm', label: 'Large farm (10-50 acres)' },
  { value: 'commercial', label: 'Commercial operation (50+ acres)' },
];

const HERD_SIZE_OPTIONS = [
  { value: 'few_animals', label: 'Few animals (1-5 head)' },
  { value: 'small_herd', label: 'Small herd/flock (6-20 head)' },
  { value: 'medium_herd', label: 'Medium herd/flock (21-50 head)' },
  { value: 'large_herd', label: 'Large herd/flock (51-200 head)' },
  { value: 'commercial_herd', label: 'Commercial operation (200+ head)' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'small_equipment', label: 'Small farm equipment' },
  { value: 'medium_equipment', label: 'Medium farm equipment' },
  { value: 'large_equipment', label: 'Large farm/commercial equipment' },
  { value: 'service_provider', label: 'Equipment service provider' },
];

const SUPERVISION_OPTIONS = [
  { value: 'independent', label: 'I work independently' },
  { value: 'occasional_guidance', label: 'Independent with occasional guidance' },
  { value: 'regular_guidance', label: 'Regular supervisor guidance' },
  { value: 'close_supervision', label: 'Close supervision' },
  { value: 'learning', label: 'Still learning, need constant help' },
];

export default function WorkContexts() {
  const navigate = useNavigate();
  const { state, setWorkContexts } = useSignup();
  
  const [farmSizes, setFarmSizes] = useState<string[]>(state.workContexts?.farmSizes || []);
  const [herdSizes, setHerdSizes] = useState<string[]>(state.workContexts?.herdSizes || []);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>(state.workContexts?.equipmentTypes || []);
  const [supervisionLevels, setSupervisionLevels] = useState<string[]>(state.workContexts?.supervisionLevels || []);

  // Check which domains are selected to show relevant sections
  const hasCropDomain = state.selectedDomains.some(d => 
    d === 'crop_production' || d === 'post_harvest' || d === 'agribusiness'
  );
  const hasLivestockDomain = state.selectedDomains.includes('livestock');
  const hasMachineryDomain = state.selectedDomains.includes('machinery');

  const toggleFarmSize = (value: string) => {
    setFarmSizes(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleHerdSize = (value: string) => {
    setHerdSizes(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleEquipment = (value: string) => {
    setEquipmentTypes(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleSupervision = (value: string) => {
    setSupervisionLevels(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleContinue = () => {
    setWorkContexts({
      farmSizes,
      herdSizes,
      equipmentTypes,
      supervisionLevels,
    });
    navigate('/signup/task-selection');
  };

  const canContinue = supervisionLevels.length > 0 && (
    (hasCropDomain && farmSizes.length > 0) ||
    (hasLivestockDomain && herdSizes.length > 0) ||
    (hasMachineryDomain && equipmentTypes.length > 0) ||
    (!hasCropDomain && !hasLivestockDomain && !hasMachineryDomain)
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={cpassLogo} alt="CPASS" className="h-12" />
          </div>
          <CardTitle className="text-xl font-display">
            📋 Tell us about your work experience
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Help us understand the contexts where you've worked. You'll select which contexts apply to each skill later.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Farm Sizes - Show if crop-related domains selected */}
          {hasCropDomain && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">
                🌾 What farm sizes have you worked on?
              </Label>
              <p className="text-xs text-muted-foreground">Select all that apply</p>
              <div className="space-y-2">
                {FARM_SIZE_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`farm-${opt.value}`}
                      checked={farmSizes.includes(opt.value)}
                      onCheckedChange={() => toggleFarmSize(opt.value)}
                    />
                    <Label htmlFor={`farm-${opt.value}`} className="text-sm font-normal cursor-pointer flex-1">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Herd Sizes - Show if livestock domain selected */}
          {hasLivestockDomain && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">
                🐄 What herd/flock sizes have you worked with?
              </Label>
              <p className="text-xs text-muted-foreground">Select all that apply</p>
              <div className="space-y-2">
                {HERD_SIZE_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`herd-${opt.value}`}
                      checked={herdSizes.includes(opt.value)}
                      onCheckedChange={() => toggleHerdSize(opt.value)}
                    />
                    <Label htmlFor={`herd-${opt.value}`} className="text-sm font-normal cursor-pointer flex-1">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Types - Show if machinery domain selected */}
          {hasMachineryDomain && (
            <div className="space-y-3">
              <Label className="font-semibold text-base">
                🚜 What equipment types have you worked with?
              </Label>
              <p className="text-xs text-muted-foreground">Select all that apply</p>
              <div className="space-y-2">
                {EQUIPMENT_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`equip-${opt.value}`}
                      checked={equipmentTypes.includes(opt.value)}
                      onCheckedChange={() => toggleEquipment(opt.value)}
                    />
                    <Label htmlFor={`equip-${opt.value}`} className="text-sm font-normal cursor-pointer flex-1">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supervision Levels - Always show */}
          <div className="space-y-3">
            <Label className="font-semibold text-base">
              👥 How do you typically work?
            </Label>
            <p className="text-xs text-muted-foreground">Select all that apply to your experience</p>
            <div className="space-y-2">
              {SUPERVISION_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={`sup-${opt.value}`}
                    checked={supervisionLevels.includes(opt.value)}
                    onCheckedChange={() => toggleSupervision(opt.value)}
                  />
                  <Label htmlFor={`sup-${opt.value}`} className="text-sm font-normal cursor-pointer flex-1">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full" 
            size="lg"
            disabled={!canContinue}
          >
            Continue →
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            These selections will save you time when documenting individual skills
          </p>
        </CardContent>
      </Card>
    </div>
  );
}