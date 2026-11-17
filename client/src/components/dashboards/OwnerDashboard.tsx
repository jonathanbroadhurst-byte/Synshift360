import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Shield, Building2, Coins, Users, PlusCircle, Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  // Per-organization pending credit amounts keyed by org id
  const [creditInputs, setCreditInputs] = useState<Record<number, string>>({});

  // 1. Query all provisioned organizations and credit usage across the platform
  const { data: usageData, isLoading: isLoadingOrgs } = useQuery<any[]>({
    queryKey: ['/api/owner/organizations/usage'],
  });

  // 2. Query system-wide registered users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/owner/users'],
  });

  // 3. Allocate / adjust quantum credits for a specific client organization
  const allocateCreditsMutation = useMutation({
    mutationFn: async ({ orgId, amount }: { orgId: number; amount: number }) => {
      const res = await apiRequest('PATCH', `/api/owner/organizations/${orgId}/credits`, { creditsToAllocate: amount });
      return res.json();
    },
    onSuccess: (data: any) => {
      alert(data.message ?? `Credit balance updated successfully. New balance: ${data.newBalance}`);
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
    },
    onError: (err: any) => {
      alert(err?.message ?? 'Failed to update credits. Try again.');
    },
  });

  const totalOrganizations = usageData?.length || 0;
  const totalUsers = usersData?.length || 0;
  
  // Calculate total Quantum Credits across all provisioned client organizations
  const totalActiveCredits = usageData?.reduce(
    (acc: number, item: any) => acc + ((item.organization?.quantumCredits as number) || 0), 0
  ) || 0;

  // Execute an addition (positive) or deduction (negative) of credits for a client
  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const val = parseInt(creditInputs[orgId] || '0', 10);
    if (!val || isNaN(val) || val <= 0) {
      alert('Enter a positive number of credits first.');
      return;
    }
    const amount = isAddition ? val : -val;
    allocateCreditsMutation.mutate({ orgId, amount });
    setCreditInputs((p) => ({ ...p, [orgId]: '' }));
  };

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
                      <th className="py-3 px-4 text-right">Adjust Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usageData.map((item: any) => {
                      const org = item.organization ?? item;
                      return (
                      <tr key={org.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">{org.name}</td>
                        <td className="py-3 px-4 text-gray-500">{org.domain || 'N/A'}</td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-600">
                          {org.quantumCredits ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center">{item.activeSurveys ?? item.activeCycleCount ?? 0}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="1"
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                              placeholder="0"
                              value={creditInputs[org.id] ?? ''}
                              onChange={(e) => setCreditInputs((p) => ({ ...p, [org.id]: e.target.value }))}
                            />
                            <button
                              type="button"
                              disabled={allocateCreditsMutation.isPending && allocateCreditsMutation.variables?.orgId === org.id}
                              onClick={() => executeAllocation(org.id, true)}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {allocateCreditsMutation.isPending && allocateCreditsMutation.variables?.orgId === org.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PlusCircle className="h-3.5 w-3.5" />
                              )}
                              Add
                            </button>
                            <button
                              type="button"
                              disabled={allocateCreditsMutation.isPending && allocateCreditsMutation.variables?.orgId === org.id}
                              onClick={() => executeAllocation(org.id, false)}
                              className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                              Deduct
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
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
