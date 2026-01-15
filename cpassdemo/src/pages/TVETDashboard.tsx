import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Mock data since worker_profiles and worker_skills tables don't exist
const mockProfiles = [
  { id: '1', full_name: 'Grace Njeri', tier: 'Gold', total_points: 450 },
  { id: '2', full_name: 'Peter Omondi', tier: 'Silver', total_points: 280 },
  { id: '3', full_name: 'Mary Wanjiku', tier: 'Bronze', total_points: 120 },
];

const mockSkills = [
  { id: '1', worker_id: '1', skill_name: 'Land Preparation', proficiency_level: 'Expert', years_experience: 5, verification_source: 'TVET Institution' },
  { id: '2', worker_id: '1', skill_name: 'Planting', proficiency_level: 'Advanced', years_experience: 4, verification_source: null },
  { id: '3', worker_id: '2', skill_name: 'Animal Feeding', proficiency_level: 'Intermediate', years_experience: 3, verification_source: null },
  { id: '4', worker_id: '3', skill_name: 'Weeding', proficiency_level: 'Beginner', years_experience: 1, verification_source: null },
];

function isSkillVerified(skill: typeof mockSkills[0]) {
  return skill.verification_source !== null;
}

export default function TVETDashboard() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState(mockSkills);
  const [selectedSkill, setSelectedSkill] = useState<typeof mockSkills[0] | null>(null);
  const [certifyDialogOpen, setCertifyDialogOpen] = useState(false);

  const getWorkerName = (workerId: string) => {
    return mockProfiles.find(p => p.id === workerId)?.full_name || 'Unknown';
  };

  const handleCertify = (skill: typeof mockSkills[0], approve: boolean) => {
    setSkills(prev => prev.map(s => 
      s.id === skill.id 
        ? { ...s, verification_source: approve ? 'TVET Institution' : null }
        : s
    ));

    toast({
      title: approve ? "Skill Verified" : "Skill Rejected",
      description: `${skill.skill_name} for ${getWorkerName(skill.worker_id)} has been ${approve ? 'verified' : 'rejected'}.`,
    });

    setCertifyDialogOpen(false);
    setSelectedSkill(null);
  };

  const pendingSkills = skills.filter(s => !isSkillVerified(s));
  const verifiedSkills = skills.filter(isSkillVerified);
  
  const tierStats = {
    bronze: mockProfiles.filter(p => p.tier?.toLowerCase() === 'bronze').length,
    silver: mockProfiles.filter(p => p.tier?.toLowerCase() === 'silver').length,
    gold: mockProfiles.filter(p => p.tier?.toLowerCase() === 'gold').length,
    platinum: mockProfiles.filter(p => p.tier?.toLowerCase() === 'platinum').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">TVET Institution Dashboard</h1>
              <p className="text-sm text-muted-foreground">Review and certify worker credentials</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockProfiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingSkills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Verified Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{verifiedSkills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Total Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{skills.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Worker Tier Distribution
            </CardTitle>
            <CardDescription>Overview of worker progression across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-orange-100 border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{tierStats.bronze}</div>
                <div className="text-sm text-muted-foreground">Bronze</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-100 border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{tierStats.silver}</div>
                <div className="text-sm text-muted-foreground">Silver</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-yellow-100 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{tierStats.gold}</div>
                <div className="text-sm text-muted-foreground">Gold</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-100 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{tierStats.platinum}</div>
                <div className="text-sm text-muted-foreground">Platinum</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Table */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Review Queue</CardTitle>
            <CardDescription>Review and certify worker skills</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Proficiency</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{getWorkerName(skill.worker_id)}</TableCell>
                    <TableCell>{skill.skill_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{skill.proficiency_level || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{skill.years_experience ? `${skill.years_experience} years` : 'N/A'}</TableCell>
                    <TableCell>
                      {isSkillVerified(skill) ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSkill(skill);
                          setCertifyDialogOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Certification Dialog */}
      <Dialog open={certifyDialogOpen} onOpenChange={setCertifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Skill Certification</DialogTitle>
            <DialogDescription>
              Verify or reject this skill credential
            </DialogDescription>
          </DialogHeader>

          {selectedSkill && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Worker</p>
                  <p className="font-medium">{getWorkerName(selectedSkill.worker_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Skill</p>
                  <p className="font-medium">{selectedSkill.skill_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proficiency Level</p>
                  <p className="font-medium">{selectedSkill.proficiency_level || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years of Experience</p>
                  <p className="font-medium">{selectedSkill.years_experience || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <Badge className={isSkillVerified(selectedSkill)
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }>
                  {isSkillVerified(selectedSkill) ? 'Verified' : 'Pending'}
                </Badge>
                {selectedSkill.verification_source && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {selectedSkill.verification_source}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => selectedSkill && handleCertify(selectedSkill, false)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedSkill && handleCertify(selectedSkill, true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
