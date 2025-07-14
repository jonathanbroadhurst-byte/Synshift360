import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Dashboard Overview</h2>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            <span>Admin</span>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-secondary">Dashboard</span>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          
          <Button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium">
            <i className="fas fa-plus mr-2"></i>
            New Survey
          </Button>
        </div>
      </div>
    </header>
  );
}
