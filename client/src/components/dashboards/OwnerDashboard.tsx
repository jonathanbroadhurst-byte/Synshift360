import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Shield, Building2, Coins, Users, PlusCircle, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function OwnerDashboard() {
  // 1. Query all provisioned organizations and credit usage across the platform
  const { data: usageData, isLoading: isLoadingOrgs } = useQuery<any[]>({
    queryKey: ['/api/owner/organizations/usage'],
  });

  // 2. Query system-wide registered users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/owner/users'],
  });

  const totalOrganizations = usageData?.length || 0;
  const totalUsers = usersData?.length || 0;
  
  // Calculate total Quantum Credits across all provisioned client organizations
  const totalActiveCredits = usageData?.reduce(
    (acc: number, org: any) => acc + (org.quantumCredits || 0), 0
  ) || 0;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-amber-400" /> SyncShift™ Platform Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Global client provisioning, multi-tenant credit distribution, and system-wide operational metrics.
              </p>
            </div>
          </div>

          {/* Platform Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Provisioned Organizations</span>
                <p className="text-2xl font-bold text-gray-900">{isLoadingOrgs ? '...' : totalOrganizations}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Allocated Quantum Credits</span>
                <p className="text-2xl font-bold text-gray-900">{isLoadingOrgs ? '...' : totalActiveCredits}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total System Users</span>
                <p className="text-2xl font-bold text-gray-900">{isLoadingUsers ? '...' : totalUsers}</p>
              </div>
            </div>
          </div>

          {/* Organization Directory Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Provisioned Client Organizations</h2>
            </div>

            {isLoadingOrgs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !usageData || usageData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No client organizations provisioned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="py-3 px-4">Organization Name</th>
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4 text-center">Quantum Credits</th>
                      <th className="py-3 px-4 text-center">Active Cycles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usageData.map((org: any) => (
                      <tr key={org.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">{org.name}</td>
                        <td className="py-3 px-4 text-gray-500">{org.domain || 'N/A'}</td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-600">
                          {org.quantumCredits ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center">{org.activeCycleCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
