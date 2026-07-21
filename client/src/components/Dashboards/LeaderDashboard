import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Zap, CheckCircle2, Clock, Share2, Download, ArrowRight } from 'lucide-react';

export default function LeaderDashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // 1. Fetch all cycles
  const { data: surveyCycles, isLoading } = useQuery<any[]>({
    queryKey: ['/api/survey-cycles'],
  });

  // 2. Lock STRICTLY to the logged-in user's direct leader ID
  const activeCycle = surveyCycles?.find(
    (cycle) => (cycle.status === 'active' || cycle.isActive === true) && cycle.leaderId === user?.id
  );

  // 3. Fetch summary stats for this specific leader's active cycle
  const { data: summary } = useQuery<{ selfAssessmentComplete: boolean; stakeholderCount: number }>({
    queryKey: [`/api/survey-cycles/${activeCycle?.id}/leader-summary`],
    enabled: !!activeCycle?.id,
  });

  const inviteCode = activeCycle?.inviteCode || '';
  const surveyUrl = `${window.location.origin}/survey/${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />

        <div className="flex-1 p-8 space-y-8 max-w-6xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName || 'Leader'}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your diagnostic collection loop, execute your self-assessment, and access performance reports.
              </p>
            </div>
            {activeCycle && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Active Cycle #{activeCycle.id}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !activeCycle ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200 space-y-3">
              <Clock className="h-10 w-10 text-gray-400 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">No Active Self-Assessment Deployed</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                You do not currently have an active 360 evaluation cycle assigned to your account. Please contact your Organization Administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Self Assessment */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${summary?.selfAssessmentComplete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {summary?.selfAssessmentComplete ? <CheckCircle2 className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Step 1: Your Self-Assessment</h2>
                      <p className="text-xs text-gray-500">
                        Establish your inner baseline alignment perspective.
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${summary?.selfAssessmentComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {summary?.selfAssessmentComplete ? '✓ Complete' : '● Action Required'}
                  </span>
                </div>

                {!summary?.selfAssessmentComplete && (
                  <div className="pt-2">
                    <a
                      href={`/survey/${inviteCode}`}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm gap-2"
                    >
                      Start Self-Assessment <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Step 2: Stakeholder Participation Loop */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Step 2: Stakeholder Feedback Loop</h2>
                      <p className="text-xs text-gray-500">
                        Share your anonymous invitation link with peers, managers, and direct reports.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">{summary?.stakeholderCount || 0}</span>
                    <span className="text-xs text-gray-500 block">Responses Collected</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-4">
                  <span className="text-xs font-mono text-gray-600 truncate">{surveyUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md shrink-0 shadow-sm transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy Invitation Link'}
                  </button>
                </div>
              </div>

              {/* Step 3: Diagnostic Reports */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Download className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Diagnostic Reports</h2>
                    <p className="text-xs text-gray-500">
                      Individual breakdown vectors populate once feedback thresholds are met.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500">
                  Report Pending Compilation (Minimum required responses needed)
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
