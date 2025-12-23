import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CycleProgress {
  cycle: {
    id: number;
    title: string;
    status: string;
    startDate: string;
    inviteCode: string;
  };
  leaderName: string;
  surveyTitle: string;
  totalInvites: number;
  completedInvites: number;
  completionPercentage: number;
}

export default function SurveyProgress() {
  const { data: cyclesProgress, isLoading } = useQuery<CycleProgress[]>({
    queryKey: ['/api/survey-cycles/progress'],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-material" data-testid="card-survey-progress-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Survey Completion Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cyclesProgress || cyclesProgress.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-material" data-testid="card-survey-progress-empty">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Survey Completion Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active surveys at the moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-material" data-testid="card-survey-progress">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary flex items-center gap-2">
          <Users className="h-5 w-5" />
          Survey Completion Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cyclesProgress.map((item) => (
          <div
            key={item.cycle.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            data-testid={`progress-cycle-${item.cycle.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-secondary" data-testid={`text-leader-${item.cycle.id}`}>
                  {item.leaderName}
                </h4>
                <p className="text-sm text-gray-500">{item.surveyTitle}</p>
              </div>
              {item.completionPercentage === 100 ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1" data-testid={`badge-complete-${item.cycle.id}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Badge>
              ) : item.totalInvites === 0 ? (
                <Badge variant="outline" className="text-gray-500 flex items-center gap-1" data-testid={`badge-no-invites-${item.cycle.id}`}>
                  <AlertCircle className="h-3 w-3" />
                  No Participants
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-in-progress-${item.cycle.id}`}>
                  <Clock className="h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {item.completedInvites} of {item.totalInvites} completed
                </span>
                <span className="font-medium text-secondary" data-testid={`text-percentage-${item.cycle.id}`}>
                  {item.completionPercentage}%
                </span>
              </div>
              <Progress 
                value={item.completionPercentage} 
                className="h-2"
                data-testid={`progress-bar-${item.cycle.id}`}
              />
            </div>

            {item.totalInvites > 0 && item.completedInvites < item.totalInvites && (
              <p className="text-xs text-gray-500 mt-2">
                {item.totalInvites - item.completedInvites} participant{item.totalInvites - item.completedInvites !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
