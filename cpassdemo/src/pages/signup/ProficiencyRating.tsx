import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSignup } from '@/context/SignupContext';
import { 
  TASKS_BY_DOMAIN, 
  SkillProficiency, 
  YearsExperience, 
  Frequency, 
  SupervisionLevel, 
  EvidenceType, 
  ReferenceRelationship,
  getScaleOptionsForDomain 
} from '@/lib/signupTypes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import cpassLogo from '@/assets/cpass-logo.jpg';

const YEARS_OPTIONS: { value: YearsExperience; label: string }[] = [
  { value: '<6mo', label: 'Less than 6 months' },
  { value: '6mo-1yr', label: '6 months - 1 year' },
  { value: '1-3yr', label: '1-3 years' },
  { value: '3-5yr', label: '3-5 years' },
  { value: '5+yr', label: '5+ years' },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily (5-7 days/week)' },
  { value: 'several_weekly', label: 'Several times per week (3-4 days)' },
  { value: 'weekly', label: 'Weekly (1-2 days/week)' },
  { value: 'monthly', label: 'Monthly (a few times per month)' },
  { value: 'seasonal', label: 'Seasonally (certain seasons only)' },
  { value: 'rarely', label: 'Rarely (less than once per month)' },
];

const SUPERVISION_OPTIONS: { value: SupervisionLevel; label: string }[] = [
  { value: 'independent', label: 'I work independently' },
  { value: 'occasional_guidance', label: 'Independent with occasional guidance' },
  { value: 'regular_guidance', label: 'Work with regular supervisor guidance' },
  { value: 'close_supervision', label: 'Work under close supervision' },
  { value: 'learning', label: 'Still learning, need constant help' },
];

const EVIDENCE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: 'reference_letter', label: 'I have a reference letter' },
  { value: 'photos', label: 'I have photos/videos of my work' },
  { value: 'work_records', label: 'I have work records or logs' },
  { value: 'supervisor', label: 'Supervisor can verify' },
  { value: 'certificates', label: 'I have training certificates' },
  { value: 'other', label: 'Other evidence' },
];

const RELATIONSHIP_OPTIONS: { value: ReferenceRelationship; label: string }[] = [
  { value: 'employer', label: 'Employer' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'client', label: 'Client' },
  { value: 'peer', label: 'Peer' },
];

export default function ProficiencyRating() {
  const navigate = useNavigate();
  const { state, addSkillProficiency } = useSignup();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);

  // Get all selected tasks with their info
  const allTasks = Object.values(TASKS_BY_DOMAIN).flat();
  const selectedTasksInfo = state.selectedTasks
    .map(taskId => allTasks.find(t => t.skill_id === taskId))
    .filter(Boolean);

  const currentTask = selectedTasksInfo[currentIndex];
  const totalTasks = selectedTasksInfo.length;

  // Get scale options based on current task's domain
  const currentScaleOptions = currentTask ? getScaleOptionsForDomain(currentTask.domain_id) : [];
  
  // Get relevant scale contexts from work contexts based on domain
  const getRelevantContextsFromWorkContexts = () => {
    if (!currentTask) return [];
    const domainId = currentTask.domain_id;
    
    if (domainId === 'crop_production' || domainId === 'post_harvest' || domainId === 'agribusiness') {
      return state.workContexts.farmSizes;
    } else if (domainId === 'livestock') {
      return state.workContexts.herdSizes;
    } else if (domainId === 'machinery') {
      return state.workContexts.equipmentTypes;
    }
    return [];
  };

  const relevantContexts = getRelevantContextsFromWorkContexts();
  const hasPreselectedContexts = relevantContexts.length > 0;
  const hasPreselectedSupervision = state.workContexts.supervisionLevels.length > 0;

  // Form state for current skill
  const [yearsExp, setYearsExp] = useState<YearsExperience>('1-3yr');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [proficiencyRating, setProficiencyRating] = useState(7);
  const [scaleContext, setScaleContext] = useState<string[]>([]);
  const [supervisionLevel, setSupervisionLevel] = useState<SupervisionLevel>(
    state.workContexts.supervisionLevels[0] as SupervisionLevel || 'occasional_guidance'
  );
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refRelationship, setRefRelationship] = useState<ReferenceRelationship>('supervisor');

  const getProficiencyLabel = (value: number) => {
    if (value <= 3) return 'Beginner - Limited experience';
    if (value <= 6) return 'Intermediate - Can work independently';
    if (value <= 9) return 'Advanced - Handle complex situations';
    return 'Expert - Can train others';
  };

  const getScaleLabel = () => {
    if (!currentTask) return 'What scale have you worked at?';
    const domainId = currentTask.domain_id;
    
    if (domainId === 'livestock') {
      return 'What herd/flock sizes have you worked with?';
    } else if (domainId === 'machinery') {
      return 'What equipment types have you used?';
    }
    return 'What farm sizes have you worked on?';
  };

  const toggleScale = (scale: string) => {
    setScaleContext(prev => 
      prev.includes(scale) 
        ? prev.filter(s => s !== scale)
        : [...prev, scale]
    );
  };

  const toggleEvidence = (evidence: EvidenceType) => {
    setEvidenceTypes(prev => 
      prev.includes(evidence)
        ? prev.filter(e => e !== evidence)
        : [...prev, evidence]
    );
  };

  const handleSaveAndNext = () => {
    if (!currentTask) return;

    // Use preselected contexts if user hasn't made a selection and they exist
    const finalScaleContext = scaleContext.length > 0 
      ? scaleContext 
      : (hasPreselectedContexts && relevantContexts.length === 1 ? relevantContexts : scaleContext);

    const proficiency: SkillProficiency = {
      skill_id: currentTask.skill_id,
      skill_name: currentTask.skill_name,
      years_experience: yearsExp,
      frequency,
      proficiency_rating: proficiencyRating,
      scale_context: finalScaleContext,
      supervision_level: supervisionLevel,
      evidence_types: evidenceTypes,
      reference_contact: refName ? {
        name: refName,
        phone: refPhone,
        relationship: refRelationship,
      } : undefined,
    };

    addSkillProficiency(proficiency);

    // Reset for next skill
    setYearsExp('1-3yr');
    setFrequency('daily');
    setProficiencyRating(7);
    setScaleContext([]);
    setSupervisionLevel(state.workContexts.supervisionLevels[0] as SupervisionLevel || 'occasional_guidance');
    setEvidenceTypes([]);
    setRefName('');
    setRefPhone('');
    setMoreDetailsOpen(false);

    if (currentIndex < totalTasks - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigate('/signup/success');
    }
  };

  if (!currentTask) {
    navigate('/signup/success');
    return null;
  }

  const progressPercent = ((currentIndex + 1) / totalTasks) * 100;

  // Filter scale options to only show those the user selected in WorkContexts
  const filteredScaleOptions = hasPreselectedContexts 
    ? currentScaleOptions.filter(opt => relevantContexts.includes(opt.value))
    : currentScaleOptions;

  // Filter supervision options to only show those the user selected in WorkContexts
  const filteredSupervisionOptions = hasPreselectedSupervision
    ? SUPERVISION_OPTIONS.filter(opt => state.workContexts.supervisionLevels.includes(opt.value))
    : SUPERVISION_OPTIONS;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <img src={cpassLogo} alt="CPASS" className="h-10" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Completing {currentIndex + 1} of {totalTasks} skills</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <CardTitle className="text-xl font-display mt-4">
            💪 Building Your Complete Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This detailed information helps you get hired faster
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current skill name */}
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <p className="font-semibold text-lg">{currentTask.skill_name}</p>
            <p className="text-xs text-muted-foreground">{currentTask.domain_name}</p>
          </div>

          {/* 1. Years of experience */}
          <div className="space-y-2">
            <Label className="font-medium">1. Years of experience *</Label>
            <Select value={yearsExp} onValueChange={(v) => setYearsExp(v as YearsExperience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Frequency */}
          <div className="space-y-2">
            <Label className="font-medium">2. How often do you do this? *</Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              {FREQUENCY_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} />
                  <Label htmlFor={`freq-${opt.value}`} className="text-sm font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 3. Proficiency rating */}
          <div className="space-y-3">
            <Label className="font-medium">3. Rate your experience (1-10) *</Label>
            <div className="px-2">
              <Slider
                value={[proficiencyRating]}
                onValueChange={([v]) => setProficiencyRating(v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium text-foreground">{proficiencyRating}</span>
                <span>10</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {getProficiencyLabel(proficiencyRating)}
            </p>
          </div>

          {/* More Details (Collapsible) */}
          <Collapsible open={moreDetailsOpen} onOpenChange={setMoreDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>▼ More Details (Optional but recommended)</span>
                {moreDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
              {/* 4. Scale context - Domain specific */}
              {filteredScaleOptions.length > 1 && (
                <div className="space-y-2">
                  <Label className="font-medium">4. {getScaleLabel()}</Label>
                  <p className="text-xs text-muted-foreground">Select contexts where you used this skill</p>
                  <div className="space-y-2">
                    {filteredScaleOptions.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`scale-${opt.value}`}
                          checked={scaleContext.includes(opt.value)}
                          onCheckedChange={() => toggleScale(opt.value)}
                        />
                        <Label htmlFor={`scale-${opt.value}`} className="text-sm font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Supervision level - Only show if multiple options pre-selected */}
              {filteredSupervisionOptions.length > 1 && (
                <div className="space-y-2">
                  <Label className="font-medium">5. How do you typically work on this task?</Label>
                  <RadioGroup value={supervisionLevel} onValueChange={(v) => setSupervisionLevel(v as SupervisionLevel)}>
                    {filteredSupervisionOptions.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={`sup-${opt.value}`} />
                        <Label htmlFor={`sup-${opt.value}`} className="text-sm font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* 6. Evidence types */}
              <div className="space-y-2">
                <Label className="font-medium">6. Evidence of your work (Select all)</Label>
                <div className="space-y-2">
                  {EVIDENCE_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ev-${opt.value}`}
                        checked={evidenceTypes.includes(opt.value)}
                        onCheckedChange={() => toggleEvidence(opt.value)}
                      />
                      <Label htmlFor={`ev-${opt.value}`} className="text-sm font-normal cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Reference contact */}
              <div className="space-y-3">
                <Label className="font-medium">7. Reference contact (Optional)</Label>
                <Input
                  placeholder="Name"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                />
                <Input
                  placeholder="Phone"
                  value={refPhone}
                  onChange={(e) => setRefPhone(e.target.value)}
                />
                <Select value={refRelationship} onValueChange={(v) => setRefRelationship(v as ReferenceRelationship)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Save button */}
          <Button onClick={handleSaveAndNext} className="w-full" size="lg">
            {currentIndex < totalTasks - 1 ? 'Save & Next Skill →' : 'Complete Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}