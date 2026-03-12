import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, FileText, Users, Calendar, Clock, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
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
  const [respondentsCycleId, setRespondentsCycleId] = useState<number | null>(null);
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [participantData, setParticipantData] = useState<Array<{name: string, jobTitle: string, department: string, email: string, relationship: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const { data: respondents, isLoading: respondentsLoading } = useQuery({
    queryKey: ['/api/survey-cycles', respondentsCycleId, 'respondents'],
    queryFn: async () => {
      const response = await fetch(`/api/survey-cycles/${respondentsCycleId}/respondents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch respondents');
      return response.json();
    },
    enabled: !!respondentsCycleId,
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
      setParticipantData([]);

      // Send invitations from either manual emails or spreadsheet data
      if (participantData.length > 0) {
        // Use full participant data from spreadsheet
        await createInvitationsWithDetails(data.cycle.id, participantData);
      } else if (inviteEmails.trim()) {
        // Use manual email entry (emails only)
        const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
        await createInvitations(data.cycle.id, emails);
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
      console.log('Creating invitations for:', { cycleId, emails });
      const response = await apiRequest('POST', '/api/survey-invitations', {
        cycleId,
        participantEmails: emails,
      });
      const result = await response.json();
      console.log('Invitation result:', result);
      
      toast({
        title: "Invitations created",
        description: `${emails.length} invitation links generated. Participants can use the survey code or direct link shown in the survey cycle card.`,
      });
    } catch (error) {
      console.error('Failed to create invitations:', error);
      toast({
        title: "Invitation error",
        description: "Failed to create invitation links. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createInvitationsWithDetails = async (cycleId: number, participants: Array<{name: string, jobTitle: string, department: string, email: string, relationship: string}>) => {
    try {
      console.log('Creating invitations with details:', { cycleId, participantCount: participants.length });
      const response = await apiRequest('POST', '/api/survey-invitations/bulk', {
        cycleId,
        participants,
      });
      const result = await response.json();
      console.log('Bulk invitation result:', result);
      
      toast({
        title: "Invitations created",
        description: `${participants.length} invitation links generated with full participant details.`,
      });
    } catch (error) {
      console.error('Failed to create bulk invitations:', error);
      toast({
        title: "Invitation error",
        description: "Failed to create invitation links. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const participants = results.data
            .filter((row: any) => row.email && row.email.trim())
            .map((row: any) => ({
              name: row.name || row.Name || row.NAME || '',
              jobTitle: row.jobTitle || row['Job Title'] || row.job_title || row.position || row.Position || row.POSITION || '',
              department: row.department || row.Department || row.DEPARTMENT || row.dept || row.Dept || '',
              email: row.email || row.Email || row.EMAIL || '',
              relationship: row.relationship || row.Relationship || row.RELATIONSHIP || row.type || row.Type || 'Peer'
            }));
          
          setParticipantData(participants);
          setInviteEmails(''); // Clear manual emails when spreadsheet is uploaded
          
          toast({
            title: "Spreadsheet imported",
            description: `${participants.length} participants loaded from spreadsheet`,
          });
        } catch (error) {
          toast({
            title: "Import error",
            description: "Failed to parse spreadsheet. Please check the format.",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "File error",
          description: "Failed to read file. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = `name,jobTitle,department,email,relationship
John Doe,Software Engineer,Engineering,john@company.com,Peer
Jane Smith,Product Manager,Product,jane@company.com,Manager
Alex Johnson,Team Lead,Engineering,alex@company.com,Direct Report
Sarah Wilson,VP Operations,Operations,sarah@company.com,Manager`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participant_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
                    <li>2. Select your organization and the SyncShift 360 template</li>
                    <li>3. Upload participant spreadsheet or enter emails manually</li>
                    <li>4. Set an end date for when the survey closes</li>
                    <li>5. Share the survey code or direct link with participants</li>
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
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {cycle.organizationName || "Demo Organization"}
                            </Badge>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{cycle.surveyTitle || "SyncShift 360"}</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium text-gray-700 mb-1">Share with participants:</div>
                            <div className="text-gray-600">Survey Code: <span className="font-mono bg-white px-1 rounded">{cycle.inviteCode}</span></div>
                            <div className="text-gray-600 mt-1">Direct Link: <span className="font-mono bg-white px-1 rounded break-all">{window.location.origin}/survey/{cycle.inviteCode}</span></div>
                            <div className="text-xs text-gray-500 mt-1 italic">
                              Survey code is for participants who don't have the direct link
                            </div>
                          </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setRespondentsCycleId(cycle.id)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View Respondents ({cycle.responseCount || 0})
                        </Button>
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
                    <Label htmlFor="participants">Participants</Label>
                    <div className="space-y-3">
                      {/* Upload spreadsheet option */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Upload participant spreadsheet</p>
                          <div className="flex justify-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Choose File
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={downloadTemplate}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Template
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            CSV columns: name, jobTitle, department, email, relationship
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Show uploaded participants */}
                      {participantData.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800 mb-2">
                            {participantData.length} participants loaded from spreadsheet
                          </p>
                          <div className="max-h-40 overflow-y-auto">
                            {participantData.slice(0, 5).map((participant, index) => (
                              <div key={index} className="text-xs text-green-700 py-1 border-b border-green-100 last:border-0">
                                <div className="font-medium">{participant.name}</div>
                                <div className="text-green-600">
                                  {participant.jobTitle}{participant.department && ` • ${participant.department}`} • {participant.relationship || 'Peer'}
                                </div>
                                <div className="text-green-500">{participant.email}</div>
                              </div>
                            ))}
                            {participantData.length > 5 && (
                              <div className="text-xs text-green-600 mt-2 font-medium">
                                + {participantData.length - 5} more participants
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Manual email entry */}
                      <div>
                        <Label htmlFor="inviteEmails" className="text-sm">
                          Or enter emails manually (optional)
                        </Label>
                        <Input
                          id="inviteEmails"
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                          placeholder="email1@company.com, email2@company.com"
                          disabled={participantData.length > 0}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate multiple emails with commas
                        </p>
                      </div>
                    </div>
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

      {/* Respondents Dialog */}
      <Dialog open={!!respondentsCycleId} onOpenChange={(open) => { if (!open) setRespondentsCycleId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Survey Respondents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              These participants have submitted their feedback. Their individual answers remain anonymous — only their participation is tracked.
            </p>
            {respondentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">Loading respondents...</p>
              </div>
            ) : respondents && respondents.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Relationship</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {respondents.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">{r.respondentName || <span className="text-gray-400 italic">Unknown</span>}</td>
                        <td className="py-3 px-4 text-gray-600">{r.respondentEmail || <span className="text-gray-400 italic">—</span>}</td>
                        <td className="py-3 px-4">
                          {r.respondentRelationship ? (
                            <Badge variant="outline" className="text-xs">{r.respondentRelationship}</Badge>
                          ) : <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No responses yet for this survey cycle.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}