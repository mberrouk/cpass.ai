import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSignup } from '@/context/SignupContext';
import { DOMAINS, TASKS_BY_DOMAIN } from '@/lib/signupTypes';
import { ArrowLeft, Search } from 'lucide-react';
import cpassLogo from '@/assets/cpass-logo.jpg';

export default function TaskSelection() {
  const navigate = useNavigate();
  const { state, toggleTask, setSelectedTasks } = useSignup();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDomainData = DOMAINS.filter(d => state.selectedDomains.includes(d.id));
  
  const getTasksForDomain = (domainId: string) => {
    const tasks = TASKS_BY_DOMAIN[domainId] || [];
    if (!searchQuery) return tasks;
    return tasks.filter(t => 
      t.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getSelectedCountForDomain = (domainId: string) => {
    const domainTasks = TASKS_BY_DOMAIN[domainId] || [];
    return domainTasks.filter(t => state.selectedTasks.includes(t.skill_id)).length;
  };

  const selectAllInDomain = (domainId: string) => {
    const domainTasks = TASKS_BY_DOMAIN[domainId] || [];
    const domainTaskIds = domainTasks.map(t => t.skill_id);
    const currentSelected = new Set(state.selectedTasks);
    domainTaskIds.forEach(id => currentSelected.add(id));
    setSelectedTasks(Array.from(currentSelected));
  };

  const clearAllInDomain = (domainId: string) => {
    const domainTasks = TASKS_BY_DOMAIN[domainId] || [];
    const domainTaskIds = new Set(domainTasks.map(t => t.skill_id));
    setSelectedTasks(state.selectedTasks.filter(id => !domainTaskIds.has(id)));
  };

  const handleContinue = () => {
    if (state.selectedTasks.length > 0) {
      navigate('/signup/proficiency-primer');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={cpassLogo} alt="CPASS" className="h-10" />
            <div className="w-10" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Step 4 of 5</span>
            </div>
            <Progress value={80} className="h-2" />
          </div>
          <CardTitle className="text-2xl font-display mt-4">
            What tasks have you done before?
          </CardTitle>
          <CardDescription>
            Select all that apply - this helps us understand your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-muted-foreground text-center">
            {state.selectedTasks.length} tasks selected
          </div>

          {/* Task lists by domain */}
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {selectedDomainData.map((domain) => {
              const tasks = getTasksForDomain(domain.id);
              const selectedCount = getSelectedCountForDomain(domain.id);
              const totalCount = (TASKS_BY_DOMAIN[domain.id] || []).length;

              return (
                <div key={domain.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>{domain.icon}</span>
                      {domain.name}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({selectedCount}/{totalCount})
                      </span>
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllInDomain(domain.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => clearAllInDomain(domain.id)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.skill_id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={task.skill_id}
                          checked={state.selectedTasks.includes(task.skill_id)}
                          onCheckedChange={() => toggleTask(task.skill_id)}
                        />
                        <label
                          htmlFor={task.skill_id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {task.skill_name}
                        </label>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No tasks match your search
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full"
            disabled={state.selectedTasks.length === 0}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
