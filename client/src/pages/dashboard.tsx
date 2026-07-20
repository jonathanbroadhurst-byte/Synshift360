import { useAuth } from '@/hooks/use-auth';
import OrgAdminDashboard from '@/components/dashboards/OrgAdminDashboard';
import LeaderDashboard from '@/components/dashboards/LeaderDashboard';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 1. Owner Account View (jonathan.broadhurst@me.com)
  if (user.role === 'owner' || user.role === 'super_admin') {
    return <OwnerDashboard />;
  }

  // 2. Org Admin View (jonathan@ignite-me.com)
  if (user.role === 'org_admin' || user.role === 'company_admin') {
    return <OrgAdminDashboard />;
  }

  // 3. Individual Leader View
  return <LeaderDashboard />;
}
