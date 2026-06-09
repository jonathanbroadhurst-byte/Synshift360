import { RequireAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import StatsGrid from '@/components/stats/stats-grid';
import RecentActivity from '@/components/activity/recent-activity';
import ReportsTable from '@/components/tables/reports-table';
import ReportPreviewModal from '@/components/modals/report-preview-modal';
import SurveyProgress from '@/components/progress/survey-progress';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; // Hook to locate active surveys automatically
import { useLocation } from 'wouter'; // Routing tool to jump between pages

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
    <RequireAuth roles={['admin']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header />
          
          <div className="flex-1 p-8 space-y-8">
            
            {/* LEADER SELF-ASSESSMENT ACTION BANNER */}
            {activeCycle && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-blue-500/20 transition-all">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>📋</span> Complete Your Leader Self-Assessment
                  </h2>
                  <p className="text-blue-100 text-sm max-w-2xl">
                    Establish your personal baseline layout for the live <strong className="text-white">{activeCycle.title || 'SyncShift Framework'}</strong> framework. Your inputs are safely categorized separately from external team stakeholder metrics.
                  </p>
                </div>
                <button 
                  onClick={() => setLocation(`/survey/${inviteCode}`)}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm px-6 py-3 rounded-lg text-sm shrink-0 border-none transition-colors duration-150"
                >
                  Start Self-Assessment →
                </button>
              </div>
            )}

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
