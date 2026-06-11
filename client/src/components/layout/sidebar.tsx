import { useLink, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardList, 
  BarChart3, 
  Users2, 
  ShieldCheck 
} from 'lucide-react';

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Define our navigation directory matrix
  // Define our navigation directory matrix
const menuItems = [
  // ✅ FIXED: Updated path to '/admin' and added 'owner' to permissions
  { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'owner'] },
  { name: 'Organizations', path: '/organizations', icon: Building2, roles: ['admin', 'owner'] },
  { name: 'Survey Management', path: '/surveys', icon: ClipboardList, roles: ['admin', 'owner'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'leader', 'owner'] },
  { name: 'User Management', path: '/users', icon: Users2, roles: ['admin', 'owner'] },
  { name: 'GDPR Compliance', path: '/gdpr', icon: ShieldCheck, roles: ['admin', 'owner'] },
];

  // Filter out panels that don't match the current user's authorization tier
  const allowedItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Platform Branding Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">360 Feedback</h2>
        <p className="text-xs text-gray-500 mt-0.5">Enterprise Platform</p>
      </div>

      {/* Dynamic Role-Gated Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 border-none text-left ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Profile Identity Footnote */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm capitalize">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.firstName || 'User'} {user?.lastName || ''}
            </p>
            <p className="text-xs text-gray-500 capitalize font-medium">
              {user?.role === 'admin' ? 'Administrator' : user?.role || 'Participant'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
