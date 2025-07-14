import { useQuery } from '@tanstack/react-query';

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-material animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-material">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Organizations</p>
            <p className="text-3xl font-bold text-secondary mt-2">
              {stats?.activeOrganizations || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-building text-primary text-xl"></i>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <span className="text-sm text-success">
            <i className="fas fa-arrow-up mr-1"></i>
            12% from last month
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-material">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Surveys</p>
            <p className="text-3xl font-bold text-secondary mt-2">
              {stats?.activeSurveys || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-clipboard-list text-accent text-xl"></i>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <span className="text-sm text-success">
            <i className="fas fa-arrow-up mr-1"></i>
            8% from last month
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-material">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Reports</p>
            <p className="text-3xl font-bold text-secondary mt-2">
              {stats?.pendingReports || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-hourglass-half text-warning text-xl"></i>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <span className="text-sm text-warning">
            <i className="fas fa-clock mr-1"></i>
            Requires attention
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-material">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Participants</p>
            <p className="text-3xl font-bold text-secondary mt-2">
              {stats?.totalParticipants || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-users text-success text-xl"></i>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <span className="text-sm text-success">
            <i className="fas fa-arrow-up mr-1"></i>
            18% from last month
          </span>
        </div>
      </div>
    </div>
  );
}
