import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="w-64 bg-white shadow-material flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-users text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-secondary">360 Feedback</h1>
            <p className="text-sm text-gray-500">Enterprise Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link href="/">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-tachometer-alt w-5"></i>
            <span>Dashboard</span>
          </a>
        </Link>
        
        <Link href="/organizations">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/organizations') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-building w-5"></i>
            <span>Organizations</span>
          </a>
        </Link>
        
        <Link href="/surveys">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/surveys') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-clipboard-list w-5"></i>
            <span>Survey Management</span>
          </a>
        </Link>
        
        <Link href="/reports">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/reports') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-chart-bar w-5"></i>
            <span>Reports</span>
          </a>
        </Link>
        
        <Link href="/users">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/users') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-user-cog w-5"></i>
            <span>User Management</span>
          </a>
        </Link>
        
        <Link href="/compliance">
          <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/compliance') 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <i className="fas fa-shield-alt w-5"></i>
            <span>GDPR Compliance</span>
          </a>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrator' : user?.role}
            </p>
          </div>
          <button 
            onClick={logout}
            className="text-gray-400 hover:text-gray-600"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
