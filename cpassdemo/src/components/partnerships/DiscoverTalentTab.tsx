import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Star, MapPin, Clock, Eye, Heart, Shield, Building2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock worker data - database tables don't exist yet
const mockWorkers = [
  { id: '1', full_name: 'Grace Njeri', location: 'Nakuru', trust_score: 85, overall_tier: 'Gold', open_to_opportunities: true },
  { id: '2', full_name: 'Peter Omondi', location: 'Kisumu', trust_score: 72, overall_tier: 'Silver', open_to_opportunities: true },
  { id: '3', full_name: 'Mary Wanjiku', location: 'Nairobi', trust_score: 91, overall_tier: 'Platinum', open_to_opportunities: true },
  { id: '4', full_name: 'John Kamau', location: 'Mombasa', trust_score: 65, overall_tier: 'Bronze', open_to_opportunities: false },
];

const mockSkills = [
  { worker_id: '1', skill_name: 'Crop Management', skill_verification_tier: 'Gold' },
  { worker_id: '1', skill_name: 'Irrigation', skill_verification_tier: 'Silver' },
  { worker_id: '2', skill_name: 'Livestock Care', skill_verification_tier: 'Silver' },
  { worker_id: '3', skill_name: 'Machinery Operation', skill_verification_tier: 'Platinum' },
];

export default function DiscoverTalentTab({ partnerId }: { partnerId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('available');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [savedWorkers, setSavedWorkers] = useState<string[]>([]);
  const { toast } = useToast();

  // Using mock data
  const workers = mockWorkers;
  const allSkills = mockSkills;
  const existingInterests = savedWorkers;
  const isLoading = false;

  const getWorkerSkills = (workerId: string) => {
    return allSkills?.filter(s => s.worker_id === workerId) || [];
  };

  const filteredWorkers = workers?.filter(w => {
    const matchesSearch = w.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         w.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || w.overall_tier?.toLowerCase() === tierFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                                (availabilityFilter === 'available' && w.open_to_opportunities);
    return matchesSearch && matchesTier && matchesAvailability;
  }) || [];

  const handleShowInterest = async (workerId: string) => {
    setSavedWorkers(prev => [...prev, workerId]);
    toast({
      title: "Interest Saved",
      description: "Worker added to your talent pipeline"
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Discover Talent</h2>
        <p className="text-muted-foreground">
          Browse verified workers available for opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Open to Opportunities</SelectItem>
                <SelectItem value="all">All Workers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredWorkers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No workers found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWorkers.map(worker => {
            const skills = getWorkerSkills(worker.id);
            const isInterested = existingInterests?.includes(worker.id);
            
            return (
              <Card key={worker.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {worker.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{worker.full_name}</h3>
                          <Badge className={getTierColor(worker.overall_tier)}>
                            {worker.overall_tier || 'Bronze'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {worker.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" /> {worker.trust_score}% Trust
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill.skill_name}
                            </Badge>
                          ))}
                          {skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowProfile(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        disabled={isInterested}
                        onClick={() => handleShowInterest(worker.id)}
                        className={isInterested ? 'bg-green-600' : ''}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isInterested ? 'fill-current' : ''}`} />
                        {isInterested ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Worker Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Worker Profile</DialogTitle>
            <DialogDescription>Detailed view of verified credentials</DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedWorker.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedWorker.full_name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {selectedWorker.location}
                  </div>
                </div>
                <Badge className={`ml-auto ${getTierColor(selectedWorker.overall_tier)}`}>
                  {selectedWorker.overall_tier || 'Bronze'} Tier
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trust Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedWorker.trust_score}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Verified Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {getWorkerSkills(selectedWorker.id).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {getWorkerSkills(selectedWorker.id).map((skill, idx) => (
                    <Badge key={idx} variant="outline">
                      {skill.skill_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
