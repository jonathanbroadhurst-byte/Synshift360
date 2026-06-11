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

  const { data: surveys } = useQuery({
    queryKey: ['/api/surveys/organization', user?.organizationId || 1],
  });

  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['/api/survey-cycles'],
  });

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: leaders } = useQuery({
    queryKey: ['/api/users/leaders'],
  });

  const orgsArray = Array.isArray(organizations) ? organizations : (organizations as any)?.organizations || [];
  const surveysArray = Array.isArray(surveys) ? surveys : (surveys as any)?.surveys || [];
  const cyclesArray = Array.isArray(cycles) ? cycles : (cycles as any)?.cycles || [];
  const leadersArray = Array.isArray(leaders) ? leaders : [];

  const { data: respondents, isLoading: respondentsLoading } = useQuery<any[]>({
    queryKey: [`/api/survey-cycles/${respondentsCycleId}/respondents`],
    enabled: !!respondentsCycleId,
  });

  const createSurveyCycleMutation = useMutation({
    mutationFn: async (data: {
      surveyId: number;
      leaderId: number;
      organizationId: number;
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
      setSelectedLeaderId('');
      setSelectedOrganizationId('');
      setEndDate('');
      setParticipantData([]);

      if (participantData.length > 0) {
        await createInvitationsWithDetails(data.cycle.id, participantData);
      } else if (inviteEmails.trim()) {
        const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
        await createInvitations(data.cycle.id, emails);
      }
      setInviteEmails('');
      
      toast({
        title: "Survey cycle created",
        description: "Your 360 loop is active and initialized successfully.",
      });
    }
  });

  const createInvitations = async (cycleId: number, emails: string[]) => {
    try {
      await apiRequest('POST', '/api/survey-invitations', { cycleId, participantEmails: emails });
    } catch (e) { console.error(e); }
  };

  const createInvitationsWithDetails = async (cycleId: number, participants: any[]) => {
    try {
      await apiRequest('POST', '/api/survey-invitations/bulk', { cycleId, participants });
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const participants = results.data
            .map((row: any) => {
              const matchValue = (keys: string[]) => {
                const targetKey = Object.keys(row).find(k => keys.includes(k.trim()));
                return targetKey ? row[targetKey]?.toString().trim() : '';
              };

              return {
                name: matchValue(['name', 'Name', 'NAME']),
                jobTitle: matchValue(['jobTitle', 'Job Title', 'job_title', 'position', 'Position', 'POSITION']),
                department: matchValue(['department', 'Department', 'DEPARTMENT', 'dept', 'Dept']),
                email: matchValue(['email', 'Email', 'EMAIL']),
                relationship: matchValue(['relationship', 'Relationship', 'RELATIONSHIP', 'type', 'Type']) || 'Peer'
              };
            })
            .filter((p: any) => p.email && p.email.length > 0);

          if (participants.length === 0) {
            toast({
              title: "Import Warning",
              description: "No matching records found. Please ensure your spreadsheet contains an 'email' column header.",
              variant: "destructive",
            });
            return;
          }

          setParticipantData(participants);
          setInviteEmails('');
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = `name,jobTitle,department,email,relationship\nJohn Doe,Director,Operations,john@company.com,Peer`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participant_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async (cycleId: number, title: string) => {
  try {
    // Pull the verified active session token
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      alert("Authentication session missing. Please log in again.");
      return;
    }

    const response = await fetch(`/api/reports/${cycleId}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 500) {
        throw new Error("Minimum response threshold not met or server data error.");
      }
      throw new Error("Failed to fetch the compiled executive asset.");
    }

    // Convert the authenticated stream into a browser file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SyncShift_Executive_Report_${title.replace(/\s+/g, "_")}.html`;
    
    document.body.appendChild(link);
    link.click();
    
    // Memory cleanup
    window.URL.revokeObjectURL(url);
    link.remove();
  } catch (error: any) {
    console.error("Report Download Error:", error);
    alert(error.message || "Could not download the report at this time.");
  }
};

  const handleCreateSurveyCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleTitle.trim() || !selectedSurveyId || !selectedLeaderId || !selectedOrganizationId || !endDate) {
      toast({
        title: "Configuration Missing",
        description: "Please complete all selections including Target Leader.",
        variant: "destructive",
      });
      return;
    }
    
    createSurveyCycleMutation.mutate({
      surveyId: parseInt(selectedSurveyId),
      leaderId: parseInt(selectedLeaderId),
      organizationId: parseInt(selectedOrganizationId),
      title: newCycleTitle.trim(),
      endDate: new Date(endDate),
    });
  };

  if (cyclesLoading) {
    return (
      <RequireAuth roles={['admin']}>
        <div className="min-h-screen flex bg-gray-50 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth roles={['admin']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-8">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
                <p className="text-gray-600 mt-2">Create and manage 360 feedback survey cycles</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3">
                <Plus className="w-5 h-5 mr-2" /> Start New Survey
              </Button>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Survey Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveysArray?.map((survey: any) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{survey.title}</CardTitle>
                          <p className="text-sm text-gray-500">{Array.isArray(survey.questions) ? survey.questions.length : JSON.parse(survey.questions || '[]').length} questions</p>
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Survey Cycles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cyclesArray?.map((cycle: any) => (
                  <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">{cycle.title}</CardTitle>
                        <Badge variant={cycle.status === 'active' ? "default" : "secondary"}>{cycle.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          <div className="text-gray-600 font-medium">Direct Loop Link:</div>
                          <div className="font-mono bg-white p-1 rounded border break-all text-blue-600 mt-1">{window.location.origin}/survey/{cycle.inviteCode}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Submissions:</span><span className="font-medium">{cycle.responseCount || 0}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600">End Date:</span><span className="font-medium">{new Date(cycle.endDate).toLocaleDateString()}</span></div>
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
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              {/* ACCESSIBILITY SUPPRESSION LAYER LINKED INLINE */}
              <DialogContent className="max-w-md bg-white max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Start New Survey Cycle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSurveyCycle} className="space-y-4">
                  
                  <div>
                    <Label htmlFor="cycleTitle">Survey Title</Label>
                    <Input id="cycleTitle" value={newCycleTitle} onChange={(e) => setNewCycleTitle(e.target.value)} placeholder="e.g., Jane Leader Professional Review" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId} required>
                      <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Select organization" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {orgsArray.map((org: any) => <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="leader">Target Evaluated Leader</Label>
                    <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId} required>
                      <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Select corporate manager" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {leadersArray.map((l: any) => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.firstName} {l.lastName} ({l.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surveyType">Survey Template</Label>
                    <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId} required>
                      <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Select survey template" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {surveysArray.map((survey: any) => <SelectItem key={survey.id} value={survey.id.toString()}>{survey.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Stakeholder Tracking Matrix</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500 mb-2">Optional: Add direct stakeholder invite emails</p>
                      <div className="flex justify-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Choose CSV File</Button>
                        <Button type="button" variant="link" size="sm" onClick={downloadTemplate} className="text-xs text-gray-400 p-0 h-auto">(Format Layout)</Button>
                      </div>
                      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </div>

                  {participantData.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        {participantData.length} participants loaded from spreadsheet
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {participantData.map((p, index) => (
                          <div key={index} className="text-xs text-green-700 pb-1 border-b border-green-100 last:border-0">
                            <div className="font-medium">{p.name || 'Anonymous User'}</div>
                            <div className="text-green-600">{p.jobTitle} • {p.relationship}</div>
                            <div className="text-green-500">{p.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="inviteEmails" className="text-xs text-gray-500">Or enter emails manually (optional)</Label>
                    <Input
                      id="inviteEmails"
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="email1@company.com, email2@company.com"
                      disabled={participantData.length > 0}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createSurveyCycleMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                      {createSurveyCycleMutation.isPending ? "Deploying..." : "Deploy Survey Loop"}
                    </Button>
                  </div>

                </form>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>

      <Dialog open={!!respondentsCycleId} onOpenChange={(open) => { if (!open) setRespondentsCycleId(null); }}>
        {/* ACCESSIBILITY SUPPRESSION LAYER LINKED INLINE */}
        <DialogContent className="max-w-2xl bg-white" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Survey Respondents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tracked participation baseline. Answers remain fully aggregated to safeguard confidentiality.
            </p>
            {respondentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">Loading respondents data...</p>
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
                <p>No feedback responses submitted yet for this specific loop.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}
