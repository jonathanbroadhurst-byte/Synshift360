import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Users, Clock, Share2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RequireAuth, useAuth } from '@/lib/auth';

export default function Surveys() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ['/api/surveys/organization', user?.organizationId],
    enabled: !!user?.organizationId,
  });

  const { data: surveyCycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['/api/survey-cycles'],
  });

  const createSurveyCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/survey-cycles', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-cycles'] });
      
      // Create invitations if emails provided
      if (inviteEmails.trim()) {
        const emails = inviteEmails.split(',').map(email => email.trim()).filter(Boolean);
        createInvitations(data.cycle.id, emails);
      }
      
      setIsCreateDialogOpen(false);
      setNewCycleTitle('');
      setSelectedSurveyId('');
      setSelectedLeaderId('');
      setEndDate('');
      setInviteEmails('');
      
      toast({
        title: "Survey cycle created",
        description: `Survey cycle created with invite code: ${data.cycle.inviteCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create survey cycle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createInvitations = async (cycleId: number, emails: string[]) => {
    try {
      await apiRequest('POST', '/api/survey-invitations', {
        cycleId,
        participantEmails: emails,
      });
    } catch (error) {
      console.error('Failed to create invitations:', error);
    }
  };

  const handleCreateSurveyCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleTitle.trim() || !selectedSurveyId || !endDate) return;
    
    createSurveyCycleMutation.mutate({
      surveyId: parseInt(selectedSurveyId),
      leaderId: selectedLeaderId ? parseInt(selectedLeaderId) : user?.id,
      organizationId: user?.organizationId,
      title: newCycleTitle.trim(),
      endDate: new Date(endDate),
    });
  };

  if (surveysLoading || cyclesLoading) {
    return (
      <RequireAuth roles={['admin', 'leader']}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading surveys...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth roles={['admin', 'leader']}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
            <p className="text-gray-600 mt-2">Create and manage 360 feedback survey cycles</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Start New Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Survey Cycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSurveyCycle} className="space-y-4">
                <div>
                  <Label htmlFor="cycleTitle">Survey Title</Label>
                  <Input
                    id="cycleTitle"
                    value={newCycleTitle}
                    onChange={(e) => setNewCycleTitle(e.target.value)}
                    placeholder="e.g., Q1 2024 Leadership Review"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="surveyType">Survey Template</Label>
                  <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select survey template" />
                    </SelectTrigger>
                    <SelectContent>
                      {surveys?.map((survey: any) => (
                        <SelectItem key={survey.id} value={survey.id.toString()}>
                          {survey.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="inviteEmails">Participant Emails (optional)</Label>
                  <Input
                    id="inviteEmails"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="email1@company.com, email2@company.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSurveyCycleMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {createSurveyCycleMutation.isPending ? "Creating..." : "Start Survey"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Survey Templates Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Survey Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys?.map((survey: any) => (
              <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                        <p className="text-sm text-gray-500">{Array.isArray(survey.questions) ? survey.questions.length : JSON.parse(survey.questions).length} questions</p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{survey.description}</p>
                  <div className="text-xs text-gray-500">
                    Created {new Date(survey.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Survey Cycles */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Survey Cycles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveyCycles?.map((cycle: any) => (
              <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cycle.title}</CardTitle>
                      <p className="text-sm text-gray-500">Code: {cycle.inviteCode}</p>
                    </div>
                    <Badge variant={cycle.status === 'active' ? "default" : "secondary"}>
                      {cycle.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Responses</span>
                      </div>
                      <span className="text-sm font-medium">{cycle.totalResponses || 0} / {cycle.totalInvites || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Ends</span>
                      </div>
                      <span className="text-sm font-medium">
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Button size="sm" variant="outline" className="w-full">
                        <Share2 className="w-3 h-3 mr-2" />
                        Share Survey Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {surveyCycles?.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active survey cycles</h3>
              <p className="text-gray-600 mb-4">Start your first 360 feedback survey cycle.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Start New Survey
              </Button>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}