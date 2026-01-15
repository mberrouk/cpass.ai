import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, MapPin, Award, CheckCircle2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data since worker_profiles, worker_skills, skills_reference, worker_domains tables don't exist
const mockProfiles = [
  { id: '1', full_name: 'Grace Njeri', location: 'Nakuru', tier: 'Gold', trust_score: 85, total_points: 450, avatar_url: '' },
  { id: '2', full_name: 'Peter Omondi', location: 'Kisumu', tier: 'Silver', trust_score: 72, total_points: 280, avatar_url: '' },
  { id: '3', full_name: 'Mary Wanjiku', location: 'Eldoret', tier: 'Bronze', trust_score: 45, total_points: 120, avatar_url: '' },
];

const mockSkills = [
  { id: '1', worker_id: '1', skill_id: 'HS_CROP_001', skill_name: 'Land Preparation', proficiency_level: 'Expert', years_experience: 5 },
  { id: '2', worker_id: '1', skill_id: 'HS_CROP_002', skill_name: 'Planting', proficiency_level: 'Advanced', years_experience: 4 },
  { id: '3', worker_id: '2', skill_id: 'HS_LIVE_001', skill_name: 'Animal Feeding', proficiency_level: 'Intermediate', years_experience: 3 },
];

type WorkerWithSkills = typeof mockProfiles[0] & { skills: typeof mockSkills };

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithSkills | null>(null);

  const getWorkerSkills = (workerId: string) => {
    return mockSkills.filter(s => s.worker_id === workerId);
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-500 text-white';
      case 'gold': return 'bg-yellow-500 text-white';
      case 'silver': return 'bg-gray-400 text-white';
      case 'bronze': return 'bg-orange-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredProfiles = mockProfiles.filter(profile => {
    const matchesSearch = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === "all" || profile.tier?.toLowerCase() === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleViewWorker = (profile: typeof mockProfiles[0]) => {
    const workerSkills = getWorkerSkills(profile.id);
    setSelectedWorker({ ...profile, skills: workerSkills });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">Platform Partner Dashboard</h1>
              <p className="text-sm text-muted-foreground">Access verified worker credentials for hiring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Find Qualified Workers
            </CardTitle>
            <CardDescription>Search through verified credentials and skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const workerSkills = getWorkerSkills(profile.id);
            const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            
            return (
              <Card 
                key={profile.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => handleViewWorker(profile)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {profile.full_name}
                        </h3>
                        {profile.tier && (
                          <Badge className={`${getTierColor(profile.tier)} text-xs`}>
                            {profile.tier}
                          </Badge>
                        )}
                      </div>

                      {profile.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          {workerSkills.length} verified
                        </span>
                        {profile.total_points && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Award className="w-4 h-4" />
                            {profile.total_points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {workerSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {workerSkills.slice(0, 3).map(skill => (
                        <Badge key={skill.id} variant="outline" className="text-xs">
                          {skill.skill_name}
                        </Badge>
                      ))}
                      {workerSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workerSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary/5">
                    View Full Profile
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No workers found matching your criteria
          </div>
        )}
      </main>

      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker Profile</DialogTitle>
            <DialogDescription>Verified credentials and work history</DialogDescription>
          </DialogHeader>

          {selectedWorker && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                  <AvatarImage src={selectedWorker.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {selectedWorker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedWorker.full_name}</h2>
                    {selectedWorker.tier && (
                      <Badge className={getTierColor(selectedWorker.tier)}>
                        {selectedWorker.tier} Tier
                      </Badge>
                    )}
                  </div>
                  {selectedWorker.location && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedWorker.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-2xl font-bold text-primary">
                    {selectedWorker.skills.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Verified Skills</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedWorker.total_points || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedWorker.skills.filter(s => s.proficiency_level === 'Expert').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Expert Skills</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Verified Skills</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedWorker.skills.map((skill) => (
                    <div key={skill.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{skill.skill_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {skill.proficiency_level} • {skill.years_experience} years
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">Contact Worker</Button>
                <Button variant="outline" className="flex-1">Download Credentials</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
