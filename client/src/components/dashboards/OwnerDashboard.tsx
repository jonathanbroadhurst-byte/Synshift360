import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Platform Owner Command Center</h1>
          <p className="text-gray-600">Global organizational management, credit distribution, and system provisioning.</p>
        </div>
      </main>
    </div>
  );
}
