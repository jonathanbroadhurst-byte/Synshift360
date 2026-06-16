import { RequireAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import StatsGrid from '@/components/stats/stats-grid';
import RecentActivity from '@/components/activity/recent-activity';
import ReportsTable from '@/components/tables/reports-table';
import ReportPreviewModal from '@/components/modals/report-preview-modal';
import SurveyProgress from '@/components/progress/survey-progress';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; 
import { useLocation } from 'wouter'; 
import { Zap } from 'lucide-react'; 

export default function Dashboard() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Automatically fetch active survey deployment details from the server database
  const { data: surveyCycles } = useQuery<any[]>({
    queryKey: ['/api/survey-cycles'],
  });

  // Dynamically find whichever survey process is currently collecting live responses
  const activeCycle = surveyCycles?.find(
    (cycle) => cycle.status === 'active' || cycle.isActive === true
  );
  
  const inviteCode = activeCycle?.inviteCode || activeCycle?.id;

  const handlePreviewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setSelectedReportId(null);
    setIsPreviewModalOpen(false);
  };

  return (
    <RequireAuth roles={['admin', 'owner', 'org_admin']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header />
          
          <div className="flex-1 p-8 space-y-8">
            
            {/* 📊 PERMANENT ADMINISTRATIVE MANAGEMENT ACTION BANNER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-blue-500/20 transition-all">
              <div className="space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>📊</span> SyncShift™ Operational Management Hub
                </h2>
                <p className="text-blue-100 text-sm max-w-2xl">
                  Deploy corporate metrics grids, track live assessment collection loops, or review structural alignment parameters across organization clusters.
                </p>
              </div>
              
              {/* 🛠️ NAVIGATION MATRIX BUTTONS */}
              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
                <button 
                  onClick={() => setLocation("/admin/macro-reports")}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 shadow-sm px-5 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Zap className="h-4 w-4 text-amber-300" />
                  View Infographic Gaps
                </button>

                {activeCycle ? (
                  <button 
                    onClick={() => setLocation(`/survey/${inviteCode}`)}
                    className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm px-5 py-3 rounded-lg text-sm border-none transition-colors duration-150 w-full sm:w-auto justify-center"
                  >
                    Start My Assessment →
                  </button>
                ) : (
                  <button 
                    onClick={() => setLocation("/create-survey")}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-sm px-5 py-3 rounded-lg text-sm border-none transition-colors duration-150 w-full sm:w-auto justify-center"
                  >
                    Deploy New Cohort
                  </button>
                )}
              </div>
            </div>

            <StatsGrid />
            
            <SurveyProgress />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
              
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-material p-6">
                  <h3 className="text-lg font-semibold text-secondary mb-4">GDPR Compliance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data Retention</span>
                      <span className="text-sm font-medium text-success">
                        <i className="fas fa-check-circle mr-1"></i>
                        Compliant
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">User Consent</span>
                      <span className="text-sm font-medium text-success">
                        <i className="fas fa-check-circle mr-1"></i>
                        100%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data Requests</span>
                      <span className="text-sm font-medium text-warning">
                        <i className="fas fa-clock mr-1"></i>
                        2 Pending
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-material p-6">
                  <h3 className="text-lg font-semibold text-secondary mb-4">System Health</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm font-medium text-success">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Service</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm font-medium text-success">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response Time</span>
                      <span className="text-sm font-medium text-secondary">234ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ReportsTable onPreviewReport={handlePreviewReport} />
          </div>
        </main>

        <ReportPreviewModal
          reportId={selectedReportId}
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
        />
      </div>
    </RequireAuth>
  );
}
