import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, FileText, Users, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RequireAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function Surveys() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ['/api/surveys/organization', user?.organizationId || 1],
  });

  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['/api/survey-cycles'],
  });

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const createSurveyCycleMutation = useMutation({
    mutationFn: async (data: {
      surveyId: number;
      leaderId?: number;
      organizationId?: number;
      title: string;
      endDate: Date;
    }) => {
      const response = await apiRequest('POST', '/api/survey-cycles', data);
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-cycles'] });
      setIsCreateDialogOpen(false);
      setNewCycleTitle('');
      setSelectedSurveyId('');
      setSelectedOrganizationId('');
      setEndDate('');

      if (inviteEmails.trim()) {
        const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
        if (emails.length > 0) {
          await createInvitations(data.cycle.id, emails);
        }
      }
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
    if (!newCycleTitle.trim() || !selectedSurveyId || !selectedOrganizationId || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including organization.",
        variant: "destructive",
      });
      return;
    }
    
    createSurveyCycleMutation.mutate({
      surveyId: parseInt(selectedSurveyId),
      leaderId: selectedLeaderId ? parseInt(selectedLeaderId) : user?.id,
      organizationId: parseInt(selectedOrganizationId),
      title: newCycleTitle.trim(),
      endDate: new Date(endDate),
    });
  };

  if (surveysLoading || cyclesLoading) {
    return (
      <RequireAuth roles={['admin', 'leader']}>
        <div className="min-h-screen flex bg-gray-50">
          <Sidebar />
          <main className="flex-1 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading surveys...</p>
              </div>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth roles={['admin', 'leader']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header />
          
          <div className="flex-1 p-8">
            {/* Header with Instructions */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
                <p className="text-gray-600 mt-2">Create and manage 360 feedback survey cycles</p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">How to assign surveys to individuals:</h3>
                  <ol className="text-sm text-green-800 space-y-1">
                    <li>1. Click "Start New Survey" to begin a new cycle</li>
                    <li>2. Choose the SyncShift 360 template (29 questions)</li>
                    <li>3. Set an end date for when the survey closes</li>
                    <li>4. Add participant emails separated by commas</li>
                    <li>5. Each person gets a unique anonymous link</li>
                    <li>6. Monitor progress and generate reports when complete</li>
                  </ol>
                </div>
              </div>
              
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Survey
              </Button>
            </div>

            {/* Survey Templates Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Survey Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys?.map((survey: any) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
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
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Active Survey Cycles */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Survey Cycles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cycles?.map((cycle: any) => (
                  <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cycle.title}</CardTitle>
                        <Badge variant={cycle.status === 'active' ? "default" : "secondary"}>
                          {cycle.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Survey Code: {cycle.inviteCode}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {cycle.organizationName || "Demo Organization"}
                          </Badge>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{cycle.surveyTitle || "SyncShift 360"}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Responses</span>
                          </div>
                          <span className="text-sm font-medium">{cycle.responseCount || 0}/{cycle.invitedCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">End Date</span>
                          </div>
                          <span className="text-sm font-medium">
                            {new Date(cycle.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!cycles || cycles.length === 0) && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No survey cycles found</h3>
                  <p className="text-gray-600 mb-4">Start your first survey cycle to begin collecting feedback.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Survey
                  </Button>
                </div>
              )}
            </div>

            {/* Survey Creation Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start New Survey Cycle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSurveyCycle} className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Survey Assignment:</strong> Choose the organization for this survey.
                      <br />
                      Participants will receive anonymous links to provide feedback.
                    </p>
                  </div>
                  
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
                    <Label htmlFor="organization">Organization</Label>
                    <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations?.map((org: any) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createSurveyCycleMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createSurveyCycleMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createSurveyCycleMutation.isPending ? "Creating..." : "Create Survey"}
                    </Button>
                  </div>


                </form>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}