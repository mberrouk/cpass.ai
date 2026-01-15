import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MapPin, Trash2, Eye, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Mock pipeline data - database tables don't exist yet
const mockPipeline = [
  { 
    id: '1', 
    worker_id: '1',
    status: 'interested',
    interest_date: new Date().toISOString(),
    notes: '',
    worker_profiles: { 
      id: '1', 
      full_name: 'Grace Njeri', 
      location: 'Nakuru', 
      trust_score: 85, 
      overall_tier: 'Gold' 
    }
  },
  { 
    id: '2', 
    worker_id: '2',
    status: 'contacted',
    interest_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Scheduled interview for next week',
    worker_profiles: { 
      id: '2', 
      full_name: 'Peter Omondi', 
      location: 'Kisumu', 
      trust_score: 72, 
      overall_tier: 'Silver' 
    }
  },
];

const mockSkills = [
  { worker_id: '1', skill_name: 'Crop Management', skill_verification_tier: 'Gold' },
  { worker_id: '1', skill_name: 'Irrigation', skill_verification_tier: 'Silver' },
  { worker_id: '2', skill_name: 'Livestock Care', skill_verification_tier: 'Silver' },
];

export default function TalentPipelineTab({ partnerId }: { partnerId: string }) {
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [pipeline, setPipeline] = useState(mockPipeline);
  const { toast } = useToast();
  
  const allSkills = mockSkills;
  const isLoading = false;

  const getWorkerSkills = (workerId: string) => {
    return allSkills?.filter(s => s.worker_id === workerId) || [];
  };

  const handleUpdateNotes = (interestId: string) => {
    setPipeline(prev => prev.map(p => 
      p.id === interestId ? { ...p, notes } : p
    ));
    toast({
      title: "Notes Updated",
      description: "Your notes have been saved"
    });
    setSelectedWorker(null);
  };

  const handleRemove = (interestId: string) => {
    setPipeline(prev => prev.filter(p => p.id !== interestId));
    toast({
      title: "Removed",
      description: "Worker removed from your pipeline"
    });
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'interviewing': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Talent Pipeline</h2>
        <p className="text-muted-foreground">
          Workers you've expressed interest in
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : pipeline.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No workers in your pipeline yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse the Discover tab to find talent
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pipeline.map(interest => {
            const worker = interest.worker_profiles;
            const skills = getWorkerSkills(interest.worker_id);
            
            return (
              <Card key={interest.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {worker?.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{worker?.full_name}</h3>
                          <Badge className={getTierColor(worker?.overall_tier)}>
                            {worker?.overall_tier || 'Bronze'}
                          </Badge>
                          <Badge className={getStatusColor(interest.status)}>
                            {interest.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {worker?.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" /> {worker?.trust_score}% Trust
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            Saved {new Date(interest.interest_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill.skill_name}
                            </Badge>
                          ))}
                        </div>
                        {interest.notes && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {interest.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWorker(interest);
                          setNotes(interest.notes || '');
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" /> Notes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(interest.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add private notes about {selectedWorker?.worker_profiles?.full_name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Interview notes, contact info, etc..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWorker(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateNotes(selectedWorker?.id)}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
