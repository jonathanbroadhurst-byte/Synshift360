import { useState } from 'react';
import { RequireAuth, useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, Coins, UserPlus, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function LeaderDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [deployMethod, setDeployMethod] = useState<'manual' | 'csv'>('manual');
  const [manualParticipants, setManualParticipants] = useState([{ firstName: '', lastName: '', email: '' }]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Fetch survey cycles for progress loops
  const { data: surveyCycles, isLoading: cyclesLoading } = useQuery<any[]>({
    queryKey: ['/api/survey-cycles'],
  });

  // Fetch the organization's macro profile data (to pull live token balances and company names)
  const { data: orgData } = useQuery<any>({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId,
  });

  const activeCycle = surveyCycles?.find(
    (cycle) => (cycle.status === 'active' || cycle.isActive === true) && cycle.leaderId === user?.id
  );

  const inviteCode = activeCycle?.inviteCode || activeCycle?.id;

  const { data: summaryMetrics, isLoading: summaryLoading } = useQuery<{
    selfAssessmentComplete: boolean;
    stakeholderCount: number;
  }>({
    queryKey: [`/api/survey-cycles/${activeCycle?.id}/leader-summary`],
    enabled: !!activeCycle,
  });

  // Mutation to handle launching new cohorts
  const deploySurveyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", `/api/organizations/${user?.organizationId}/deploy-surveys`, payload);
      if (!res.ok) throw new Error("Failed to deploy survey pipeline.");
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message || "Survey cycles deployed successfully!");
      setIsDeployOpen(false);
      setManualParticipants([{ firstName: '', lastName: '', email: '' }]);
      setCsvFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/survey-cycles'] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}`] });
    },
    onError: (err: any) => alert(err.message || "Error deploying cohort."),
  });

  const stakeholderCount = summaryMetrics?.stakeholderCount || 0;
  const selfAssessmentComplete = summaryMetrics?.selfAssessmentComplete || false;
  const currentProgressPercent = Math.min(Math.round((stakeholderCount / 8) * 100), 100);
  const isReportUnlocked = selfAssessmentComplete && stakeholderCount >= 3;

  const handleAddManualRow = () => {
    setManualParticipants([...manualParticipants, { firstName: '', lastName: '', email: '' }]);
  };

  const handleManualInputChange = (index: number, field: string, value: string) => {
    const updated = [...manualParticipants];
    updated[index] = { ...updated[index], [field]: value };
    setManualParticipants(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deployMethod === 'manual') {
      const validParticipants = manualParticipants.filter(p => p.firstName && p.email);
      if (validParticipants.length === 0) return alert("Please enter at least one participant name and email.");
      deploySurveyMutation.mutate({ method: 'manual', participants: validParticipants });
    } else {
      if (!csvFile) return alert("Please upload a spreadsheet file first.");
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        deploySurveyMutation.mutate({ method: 'csv', fileData: text });
      };
      reader.readAsText(csvFile);
    }
  };

  if (cyclesLoading || (activeCycle && summaryLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Determine if user has corporate administrative authority
  const isOrgAdmin = user?.role === 'org_admin' || user?.role === 'company_admin' || user?.role === 'owner' || user?.role === 'super_admin';

  // Dynamic names fallback logic to keep UI crisp
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || 'Admin');
  const greetingName = user?.firstName || user?.username || 'Admin';
  const organizationName = orgData?.name || 'Workspace';

  return (
    <RequireAuth roles={['leader', 'admin', 'org_admin', 'company_admin', 'owner', 'super_admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SyncShift</span>
              {/* PERSONALIZATION: Displays the specific client name in the top bar */}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">
                {organizationName} Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                {/* PERSONALIZATION: Displays user's actual profile account name */}
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'Member'}</p>
              </div>
              <Button onClick={() => logout()} variant="outline" className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 h-9">
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
          
          {/* Conditional Admin Utility Card */}
          {isOrgAdmin && (
            <Card className="border border-indigo-100 shadow-md bg-gradient-to-br from-white to-indigo-50/20 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-indigo-600" /> Organization Control Panel
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-sm">
                      Manage workspace credit distribution metrics and launch survey cycles.
                    </CardDescription>
                  </div>

                  <Dialog open={isDeployOpen} onOpenChange={setIsDeployOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                        <UserPlus className="w-4 h-4 mr-2" /> Deploy New Surveys
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border text-gray-900 sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Deploy New Assessment Cohort</DialogTitle>
                        <DialogDescription>
                          Select your generation vector to provision new 360 feedback loops.
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="manual" onValueChange={(v) => setDeployMethod(v as any)} className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                          <TabsTrigger value="manual" className="data-[state=active]:bg-white">Manual Processing</TabsTrigger>
                          <TabsTrigger value="csv" className="data-[state=active]:bg-white">Spreadsheet Upload</TabsTrigger>
                        </TabsList>
                        
                        <form onSubmit={handleDeploySubmit} className="space-y-4 pt-4">
                          <TabsContent value="manual" className="space-y-4 m-0">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Participant Parameters</Label>
                              {manualParticipants.map((participant, index) => (
                                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                                  <Input placeholder="First Name" value={participant.firstName} onChange={(e) => handleManualInputChange(index, 'firstName', e.target.value)} className="bg-white text-sm" />
                                  <Input placeholder="Last Name" value={participant.lastName} onChange={(e) => handleManualInputChange(index, 'lastName', e.target.value)} className="bg-white text-sm" />
                                  <Input type="email" placeholder="Email Address" value={participant.email} onChange={(e) => handleManualInputChange(index, 'email', e.target.value)} className="bg-white text-sm" />
                                </div>
                              ))}
                              <Button type="button" variant="outline" size="sm" onClick={handleAddManualRow} className="mt-1">
                                + Add Participant Row
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="csv" className="space-y-4 m-0">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center space-y-3 bg-gray-50/50">
                              <Upload className="w-8 h-8 mx-auto text-gray-400" />
                              <div className="text-sm">
                                <label className="relative cursor-pointer bg-white rounded-md font-semibold text-indigo-600 hover:text-indigo-500">
                                  <span>Upload a file</span>
                                  <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleFileChange} />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">CSV or Excel template with FirstName, LastName, Email headers.</p>
                              </div>
                              {csvFile && (
                                <div className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected: {csvFile.name}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <DialogFooter className="pt-4 border-t">
                            <Button type="submit" disabled={deploySurveyMutation.isPending} className="w-full bg-indigo-600 text-white">
                              {deploySurveyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Execute Cohort Initialization"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-indigo-100/40 bg-white/50 p-6 flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Coins className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Available Balance</div>
                    <div className="text-xl font-bold font-mono text-indigo-950">
                      {orgData?.quantumCredits ?? orgData?.quantum_credits ?? 0} Quantum Tokens
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-1">
            {/* PERSONALIZATION: Greets the user directly by name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {greetingName}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Track your diagnostic collection loop, execute your self-assessment, and access performance reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>📝</span> Step 1: Your Self-Assessment
                  </h3>
                  <p className="text-blue-100 text-xs mt-1 max-w-xl">
                    Establish your inner baseline alignment perspective. Your system scores are categorized securely separate from organizational stakeholder reviews.
                  </p>
                </div>
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status Deployment Tracker</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selfAssessmentComplete ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {selfAssessmentComplete ? '✓ Complete' : '● Action Required'}
                      </span>
                    </div>
                  </div>
                  {activeCycle ? (
                    <Button
                      onClick={() => setLocation(`/survey/${inviteCode}`)}
                      className={`w-full sm:w-auto font-semibold ${selfAssessmentComplete ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {selfAssessmentComplete ? 'Review / Retake Assessment' : 'Start Self-Assessment →'}
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No survey deployment currently active.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>📊</span> Step 2: Stakeholder Participation Loop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600">
                    To maintain strict psychometric integrity and evaluation safety, all stakeholder inputs are completely anonymized and aggregate processed.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Collected Submissions</span>
                      <span className="text-blue-700 font-bold">{stakeholderCount} responses</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mt-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${currentProgressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700 mb-1">💡 Process Optimization Tip:</p>
                    <p>• Share your public token invitation link with 8–12 professional colleagues.</p>
                    <p>• Aim for a healthy multi-tiered mix across Peers, Managers, and Direct Reports.</p>
                    <p>• Reports unlock automatically once sufficient data limits are compiled.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-md border-none bg-white h-full">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>📜</span> Diagnostic Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Your executive breakdown vectors, non-linear disruption charts, and operational alignment pathways populate below once active loops conclude.
                  </p>
                  
                  {isReportUnlocked ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                      <span className="text-3xl block" role="img" aria-label="unlocked">🔓</span>
                      <p className="text-sm font-bold text-amber-900">Your SyncShift Profile is Ready!</p>
                      <p className="text-xs text-amber-700">All baseline confidentiality parameters cleared. You can now access your interactive dual-line system alignment report.</p>
                      <Button
                        onClick={() => alert("Downloading report features...")}
                        className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      >
                        📥 Download Profile Report
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 bg-gray-50/30">
                      <span className="text-2xl block" role="img" aria-label="locked">🔒</span>
                      <p className="text-sm font-medium text-gray-800">Report Pending Compilation</p>
                      <p className="text-xs text-gray-400 leading-normal">
                        {!selfAssessmentComplete 
                          ? "Please complete your Step 1 Self-Assessment to activate core model mappings." 
                          : `Awaiting minimum anonymity thresholds. Need 3+ external raters (Current progress: ${stakeholderCount}/3).`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
