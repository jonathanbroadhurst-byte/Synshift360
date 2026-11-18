import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Shield, Building2, Coins, Users, PlusCircle, Settings, Loader2, UserCog, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  // Per-organization pending credit amounts keyed by org id
  const [creditInputs, setCreditInputs] = useState<Record<number, string>>({});
  // Which survey type the owner is topping up / adjusting (independent wallets per questionnaire)
  const [creditSurveyType, setCreditSurveyType] = useState('syncshift');
  // Admin-assignment row selectors keyed by user id: { role, orgId }
  const [assignState, setAssignState] = useState<Record<number, { role: string; orgId: string }>>({});
  // Create-admin per org modal state
  const [createOrgId, setCreateOrgId] = useState<number | null>(null);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', firstName: '', lastName: '' });

  // 1. Query all provisioned organizations and credit usage across the platform
  const { data: usageData, isLoading: isLoadingOrgs } = useQuery<any[]>({
    queryKey: ['/api/owner/organizations/usage'],
  });

  // 2. Query system-wide registered users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/owner/users'],
  });

  // Flat organization list (for admin-assignment + create-admin org selectors)
  const { data: organizations } = useQuery<any[]>({
    queryKey: ['/api/organizations'],
  });

  // 3. Allocate / adjust credits for a specific survey type on a client organization
  const allocateCreditsMutation = useMutation({
    mutationFn: async ({ orgId, amount, surveyType }: { orgId: number; amount: number; surveyType: string }) => {
      const res = await apiRequest('PATCH', `/api/owner/organizations/${orgId}/credits`, { creditsToAllocate: amount, surveyType });
      return res.json();
    },
    onSuccess: (data: any) => {
      alert(data.message ?? `Credit balance updated successfully. ${data.surveyType} balance: ${data.newBalance}`);
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
    },
    onError: (err: any) => {
      alert(err?.message ?? 'Failed to update credits. Try again.');
    },
  });

  // Assign an existing user a role + bound organization
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, role, organizationId }: { userId: number; role: string; organizationId: number }) => {
      const res = await apiRequest('POST', `/api/owner/users/${userId}/assign`, { role, organizationId });
      return res.json();
    },
    onSuccess: (data: any) => {
      alert(data.message ?? 'User assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['/api/owner/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
    },
    onError: (err: any) => alert(err?.message ?? 'Failed to assign user.'),
  });

  // Create a fresh org_admin for an existing organization (e.g. Emenex)
  const createAdminMutation = useMutation({
    mutationFn: async ({ orgId, data }: { orgId: number; data: { email: string; password: string; firstName: string; lastName: string } }) => {
      const res = await apiRequest('POST', `/api/owner/organizations/${orgId}/admins`, data);
      return res.json();
    },
    onSuccess: (data: any) => {
      alert(data.message ?? 'Admin created.');
      setCreateOrgId(null);
      setNewAdmin({ email: '', password: '', firstName: '', lastName: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/owner/users'] });
    },
    onError: (err: any) => alert(err?.message ?? 'Failed to create admin.'),
  });

  const submitAssign = (userId: number) => {
    const s = assignState[userId];
    if (!s?.role || !s?.orgId) {
      alert('Select both a role and an organization first.');
      return;
    }
    assignUserMutation.mutate({ userId, role: s.role, organizationId: parseInt(s.orgId, 10) });
    setAssignState((p) => ({ ...p, [userId]: { role: '', orgId: '' } }));
  };

  const totalOrganizations = usageData?.length || 0;
  const totalUsers = usersData?.length || 0;
  
  // Resolve the balance for an org for the selected survey type
  const creditBalanceFor = (item: any, surveyType: string): number => {
    const list: Array<{ surveyType: string; credits: number }> = item.creditBalances || [];
    const row = list.find((b) => b.surveyType === surveyType);
    return row ? row.credits : 0;
  };

  // Total credits across all orgs for the currently-selected survey type
  const totalActiveCredits = usageData?.reduce((acc: number, item: any) => {
    return acc + creditBalanceFor(item, creditSurveyType);
  }, 0) || 0;

  // Execute an addition (positive) or deduction (negative) of credits for a client
  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const val = parseInt(creditInputs[orgId] || '0', 10);
    if (!val || isNaN(val) || val <= 0) {
      alert('Enter a positive number of credits first.');
      return;
    }
    const amount = isAddition ? val : -val;
    allocateCreditsMutation.mutate({ orgId, amount, surveyType: creditSurveyType });
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
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Allocated Credits · {creditSurveyType}</span>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Adjust credits for:</span>
                <select
                  value={creditSurveyType}
                  onChange={(e) => setCreditSurveyType(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white"
                >
                  <option value="syncshift">SyncShift 360</option>
                  <option value="eq360">EQ 360</option>
                  <option value="quantum">Quantum</option>
                </select>
              </div>
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
                      <th className="py-3 px-4 text-center">Credits ({creditSurveyType})</th>
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
                          {creditBalanceFor(item, creditSurveyType)}
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

          {/* 👥 ADMIN & USER ROLE MANAGEMENT */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-indigo-600" /> Admin & User Role Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Assign users a role and bind them to an organization, or create a new admin account for an existing client.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={createOrgId ?? ''}
                  onChange={(e) => setCreateOrgId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  <option value="">Select org…</option>
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!createOrgId}
                  onClick={() => setNewAdmin({ email: '', password: '', firstName: '', lastName: '' })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  <KeyRound className="h-4 w-4" /> Create Admin
                </button>
              </div>
            </div>

            {/* Create-admin form (inline, shown once an org is picked to create an admin for) */}
            {createOrgId && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAdmin.email || !newAdmin.password) { alert('Email and password are required.'); return; }
                  createAdminMutation.mutate({ orgId: createOrgId, data: newAdmin });
                }}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg"
              >
                <input
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="First name (optional)"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, firstName: e.target.value }))}
                />
                <input
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Last name (optional)"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, lastName: e.target.value }))}
                />
                <input
                  type="email"
                  required
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="admin@email.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                />
                <input
                  type="password"
                  required
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                />
                <button type="submit" disabled={createAdminMutation.isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {createAdminMutation.isPending ? 'Creating…' : 'Create Admin'}
                </button>
              </form>
            )}

            {isLoadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Assign / Change</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersData?.map((user: any) => {
                      const pending = assignState[user.id];
                      const org = organizations?.find((o) => o.id === user.organizationId);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                          <td className="py-3 px-4 text-gray-500">{user.email}</td>
                          <td className="py-3 px-4 capitalize">{user.role?.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-gray-500">{org?.name || '— (unassigned)'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={pending?.role ?? ''}
                                onChange={(e) => setAssignState((p) => ({ ...p, [user.id]: { ...(p[user.id] ?? {}), role: e.target.value } }))}
                                className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white text-gray-700"
                              >
                                <option value="">Role…</option>
                                <option value="org_admin">org_admin</option>
                                <option value="company_admin">company_admin</option>
                                <option value="leader">leader</option>
                                <option value="admin">admin</option>
                              </select>
                              <select
                                value={pending?.orgId ?? ''}
                                onChange={(e) => setAssignState((p) => ({ ...p, [user.id]: { ...(p[user.id] ?? {}), orgId: e.target.value } }))}
                                className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white text-gray-700"
                              >
                                <option value="">Org…</option>
                                {organizations?.map((o) => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              disabled={assignUserMutation.isPending && assignUserMutation.variables?.userId === user.id}
                              onClick={() => submitAssign(user.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                            >
                              {assignUserMutation.isPending && assignUserMutation.variables?.userId === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Settings className="h-3.5 w-3.5" />
                              )}
                              Assign
                            </button>
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
