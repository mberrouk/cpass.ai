import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, CheckCircle2, Users, Award } from 'lucide-react';

// Static mock data - wbl_students table doesn't exist
const mockStudents = [
  { id: '1', student_id: 'STU-2024-001', full_name: 'John Kamau', program_name: 'Horticulture L4', program_code: 'AGR-L4-HORT', institution_code: 'BUKURA', year_of_study: 2, competencies_completed: 12, competencies_required: 16, tasks_completed: 24, status: 'on_track' },
  { id: '2', student_id: 'STU-2024-002', full_name: 'Sarah Njeri', program_name: 'Dairy Management L3', program_code: 'AGR-L3-DAIRY', institution_code: 'BUKURA', year_of_study: 1, competencies_completed: 8, competencies_required: 12, tasks_completed: 18, status: 'on_track' },
  { id: '3', student_id: 'STU-2024-003', full_name: 'Peter Oduor', program_name: 'Crop Production L3', program_code: 'AGR-L3-CROP', institution_code: 'BUKURA', year_of_study: 1, competencies_completed: 5, competencies_required: 12, tasks_completed: 9, status: 'behind_schedule' },
  { id: '4', student_id: 'STU-2024-004', full_name: 'Mary Wanjiru', program_name: 'Horticulture L4', program_code: 'AGR-L4-HORT', institution_code: 'BUKURA', year_of_study: 2, competencies_completed: 15, competencies_required: 16, tasks_completed: 31, status: 'ready_for_assessment' },
  { id: '5', student_id: 'STU-2024-005', full_name: 'David Kimani', program_name: 'Agripreneurship L5', program_code: 'AGR-L5-AGRI', institution_code: 'KSA', year_of_study: 3, competencies_completed: 18, competencies_required: 20, tasks_completed: 42, status: 'on_track' },
  { id: '6', student_id: 'STU-2024-006', full_name: 'Jane Achieng', program_name: 'Crop Production L3', program_code: 'AGR-L3-CROP', institution_code: 'KSA', year_of_study: 1, competencies_completed: 9, competencies_required: 12, tasks_completed: 21, status: 'on_track' },
];

export default function StudentsTab() {
  const [programFilter, setProgramFilter] = useState<string>('all');

  const students = mockStudents;
  const filteredStudents = students.filter(s => 
    programFilter === 'all' || s.program_code === programFilter
  );

  const programs = [...new Set(students.map(s => s.program_code))];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; text: string; color: string }> = {
      'on_track': { icon: CheckCircle2, text: 'On Track', color: 'bg-green-100 text-green-700' },
      'behind_schedule': { icon: Clock, text: 'Behind Schedule', color: 'bg-yellow-100 text-yellow-700' },
      'ready_for_assessment': { icon: BookOpen, text: 'Ready', color: 'bg-blue-100 text-blue-700' }
    };
    const config = variants[status] || variants['on_track'];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const totalStudents = students.length;
  const onTrackCount = students.filter(s => s.status === 'on_track').length;
  const behindCount = students.filter(s => s.status === 'behind_schedule').length;
  const readyCount = students.filter(s => s.status === 'ready_for_assessment').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">WBL Students</h2>
          <p className="text-muted-foreground">Track work-based learning progress and task approvals</p>
        </div>
        <div className="flex gap-3">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(prog => (
                <SelectItem key={prog} value={prog}>{prog}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold text-green-600">{onTrackCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Behind Schedule</p>
                <p className="text-2xl font-bold text-yellow-600">{behindCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ready for Assessment</p>
                <p className="text-2xl font-bold text-blue-600">{readyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Current WBL students and their competency completion</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Competencies</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map(student => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{student.student_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{student.program_name}</div>
                      <div className="text-xs text-muted-foreground">{student.institution_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>Year {student.year_of_study}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(student.competencies_completed / student.competencies_required) * 100} 
                          className="w-24" 
                        />
                        <span className="text-sm">
                          {student.competencies_completed}/{student.competencies_required}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((student.competencies_completed / student.competencies_required) * 100)}% complete
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{student.tasks_completed}</span> tasks
                  </TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">View Profile</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
