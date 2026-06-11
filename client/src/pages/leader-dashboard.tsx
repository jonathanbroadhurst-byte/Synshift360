import { RequireAuth, useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: surveyCycles, isLoading: cyclesLoading } = useQuery<any[]>({
    queryKey: ['/api/survey-cycles'],
  });

  const activeCycle = surveyCycles?.find(
    (cycle) => (cycle.status === 'active' || cycle.isActive === true) && cycle.leaderId === user?.id
  );

  const inviteCode = activeCycle?.inviteCode || activeCycle?.id;

  // FIXED: Migrated to use the application's clean query pipeline string pattern
  const { data: summaryMetrics, isLoading: summaryLoading } = useQuery<{
    selfAssessmentComplete: boolean;
    stakeholderCount: number;
  }>({
    queryKey: [`/api/survey-cycles/${activeCycle?.id}/leader-summary`],
    enabled: !!activeCycle,
  });

  const stakeholderCount = summaryMetrics?.stakeholderCount || 0;
  const selfAssessmentComplete = summaryMetrics?.selfAssessmentComplete || false;

  const targetResponses = 8;
  const currentProgressPercent = Math.min(Math.round((stakeholderCount / targetResponses) * 100), 100);

  // Dynamic state gate: Verifies multi-rater safety anonymity rule before unlocking profile assets
  const isReportUnlocked = selfAssessmentComplete && stakeholderCount >= 3;

  const handleDownloadReport = async () => {
    if (!activeCycle?.id) return;
    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        alert("Authentication session missing. Please log in again.");
        return;
      }

      const response = await fetch(`/api/reports/${activeCycle.id}/download`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the compiled executive asset.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SyncShift_Profile_${activeCycle.title.replace(/\s+/g, "_")}.html`;
      
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error: any) {
      console.error("Report Download Error:", error);
      alert(error.message || "Could not download your profile at this time.");
    }
  };

  if (cyclesLoading || (activeCycle && summaryLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RequireAuth roles={['leader', 'admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SyncShift</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Leader Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.firstName || 'Leader'} {user?.lastName || ''}</p>
                <p className="text-xs text-gray-500 capitalize">{activeCycle?.title || 'SyncShift Alignment'}</p>
              </div>
              <button 
                onClick={() => logout()}
                className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-100 rounded-lg px-3 py-1.5 transition-colors bg-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'Leader'}
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
                    <button
                      onClick={() => setLocation(`/survey/${inviteCode}`)}
                      className={`w-full sm:w-auto font-semibold px-5 py-2.5 rounded-lg text-sm shadow-sm transition-all border-none ${selfAssessmentComplete ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {selfAssessmentComplete ? 'Review / Retake Assessment' : 'Start Self-Assessment →'}
                    </button>
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
                      <button
                        onClick={handleDownloadReport}
                        className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 border-none"
                      >
                        <span>📥</span> Download Profile Report
                      </button>
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
