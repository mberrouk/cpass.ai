import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Star } from 'lucide-react';

interface PartnerInterestSectionProps {
  workerId: string;
}

// Mock data - partner_interest table doesn't exist yet
const mockInterests = [
  {
    id: '1',
    partner_name: 'Twiga Foods',
    industry: 'Agricultural Supply Chain',
    interest_date: new Date().toISOString(),
  },
  {
    id: '2',
    partner_name: 'Hello Tractor',
    industry: 'AgriTech Services',
    interest_date: new Date().toISOString(),
  },
];

export default function PartnerInterestSection({ workerId }: PartnerInterestSectionProps) {
  // Using mock data since partner_interest table doesn't exist
  const interests = mockInterests;

  if (!interests || interests.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-600" />
          Companies Interested in You
        </CardTitle>
        <CardDescription>
          {interests.length} {interests.length === 1 ? 'company has' : 'companies have'} shown interest in your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {interests.map((interest) => (
            <div 
              key={interest.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">{interest.partner_name}</div>
                  <div className="text-sm text-muted-foreground">{interest.industry}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-purple-600 text-white">
                  Interested
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(interest.interest_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-muted-foreground">
          <strong>What this means:</strong> These companies have access to your verified skills 
          and may reach out with opportunities. Keep your profile updated!
        </div>
      </CardContent>
    </Card>
  );
}
