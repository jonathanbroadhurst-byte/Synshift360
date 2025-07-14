import { useQuery } from '@tanstack/react-query';

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/dashboard/activity'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-material">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-secondary">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'create_survey':
      case 'create_survey_cycle':
        return 'fas fa-plus';
      case 'generate_report':
      case 'approve_report':
        return 'fas fa-check';
      case 'release_report':
        return 'fas fa-share';
      case 'send_invitation':
        return 'fas fa-envelope';
      case 'login':
        return 'fas fa-sign-in-alt';
      case 'register':
      case 'create_organization':
        return 'fas fa-user-plus';
      default:
        return 'fas fa-info';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'create_survey':
      case 'create_survey_cycle':
        return 'primary';
      case 'generate_report':
      case 'approve_report':
        return 'success';
      case 'release_report':
        return 'accent';
      case 'send_invitation':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-material">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Recent Activity</h3>
          <button className="text-primary hover:text-primary-dark text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {activities?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            activities?.map((activity: any) => {
              const iconClass = getActivityIcon(activity.action);
              const colorClass = getActivityColor(activity.action);
              
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 bg-${colorClass}/10 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${iconClass} text-${colorClass} text-xs`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary">
                      System activity: <span className="font-medium">{activity.action.replace('_', ' ')}</span>
                      {activity.details && (
                        <span className="text-gray-600">
                          {' '}for {activity.resourceType} #{activity.resourceId}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
