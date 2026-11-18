import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building, Users, Activity, KeyRound, Save, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RequireAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function Organizations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  // Editable admin drafts keyed by org id
  const [adminDrafts, setAdminDrafts] = useState<Record<number, { id: number; firstName: string; lastName: string; email: string }[]>>({});
  // Editable org name/domain drafts keyed by org id
  const [orgDrafts, setOrgDrafts] = useState<Record<number, { name: string; domain: string }>>({});
  // Reset-password open state keyed by admin user id
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['/api/owner/organizations/usage'],
  });
  // usage endpoint returns [{ organization, activeSurveys, totalParticipants, completedResponses, pendingResponses, admins }]
  const orgsArray = Array.isArray(organizations)
    ? organizations.map((item: any) => ({ ...(item.organization ?? item) }))
    : [];

  // Admin draft management — reads drafts if present, else falls back to live admin data
  const currentAdmin = (orgId: number, item: any, adminId: number, field: 'firstName' | 'lastName' | 'email') => {
    const drafts = adminDrafts[orgId];
    const source = drafts ? drafts.find((a) => a.id === adminId) : (item.admins || []).find((a: any) => a.id === adminId);
    const fallback = (item.admins || []).find((a: any) => a.id === adminId);
    const val = source ? source[field] : fallback?.[field];
    return val ?? '';
  };
  const setDraftField = (orgId: number, adminId: number, field: 'firstName' | 'lastName' | 'email', value: string) => {
    const base = adminDrafts[orgId] || (orgsArray.find((o: any) => o.id === orgId)?.admins || []).map((a: any) => ({ id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email }));
    setAdminDrafts((p) => ({
      ...p,
      [orgId]: (base || []).map((a: any) => (a.id === adminId ? { ...a, [field]: value } : a)),
    }));
  };

  const updateAdminMutation = useMutation({
    mutationFn: async ({ orgId, adminId, data }: { orgId: number; adminId: number; data: { firstName?: string; lastName?: string; email?: string } }) => {
      const res = await apiRequest('PATCH', `/api/owner/organizations/${orgId}/admins/${adminId}`, data);
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
      toast({ title: 'Admin updated', description: 'Admin details saved.' });
      setAdminDrafts((p) => ({ ...p, [vars.orgId]: undefined }));
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.message || 'Failed to update admin.', variant: 'destructive' }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ orgId, adminId, password }: { orgId: number; adminId: number; password: string }) => {
      const res = await apiRequest('POST', `/api/owner/organizations/${orgId}/admins/${adminId}/reset-password`, { password });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: 'Password reset', description: data.message || 'Password updated.' });
      setResetUserId(null);
      setResetPassword('');
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.message || 'Failed to reset password.', variant: 'destructive' }),
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ orgId, name, domain }: { orgId: number; name: string; domain: string }) => {
      const res = await apiRequest('PATCH', `/api/owner/organizations/${orgId}`, { name, domain });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
      if (data.user) queryClient.invalidateQueries({ queryKey: ['/api/owner/users'] });
      toast({ title: 'Organization updated', description: data.message || 'Saved.' });
      setOrgDrafts((p) => ({ ...p, [data.organization?.id]: undefined }));
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.message || 'Failed to update organization.', variant: 'destructive' }),
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: { name: string; domain: string }) => {
      const response = await apiRequest('POST', '/api/organizations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/organizations/usage'] });
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgDomain('');
      toast({
        title: "Organization created",
        description: "New organization has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgDomain.trim()) return;
    
    createOrganizationMutation.mutate({
      name: newOrgName.trim(),
      domain: newOrgDomain.trim(),
    });
  };

  if (isLoading) {
    return (
      <RequireAuth roles={['admin']}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading organizations...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth roles={['admin']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header />
          
          <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              <p className="text-gray-600 mt-2">Manage organizations and their settings</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">How to get started:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Click "Add Organization" to create a new company</li>
                  <li>2. Go to "Survey Management" to start a survey cycle for any organization</li>
                  <li>3. Invite participants by email to get anonymous feedback</li>
                  <li>4. View reports when surveys are complete</li>
                </ol>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations?.map((item: any) => {
            const org = item.organization ?? item;
            return (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          className="text-md font-bold text-slate-900 !py-1 !h-8 max-w-[180px]"
                          value={orgDrafts[org.id]?.name ?? org.name}
                          aria-label={`Edit name for ${org.name}`}
                          onChange={(e) => setOrgDrafts((p) => ({ ...p, [org.id]: { name: e.target.value, domain: orgDrafts[org.id]?.domain ?? org.domain } }))}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs px-2"
                          disabled={updateOrgMutation.isPending}
                          onClick={() => {
                            const d = orgDrafts[org.id];
                            const name = d?.name !== undefined ? d.name : org.name;
                            const domain = d?.domain !== undefined ? d.domain : org.domain;
                            if (!name.trim() || !domain.trim()) { toast({ title: 'Required', description: 'Name and domain are required.', variant: 'destructive' }); return; }
                            updateOrgMutation.mutate({ orgId: org.id, name, domain });
                          }}
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Input
                        className="text-sm !py-1 !h-7 text-gray-500 mt-1 max-w-[220px]"
                        value={orgDrafts[org.id]?.domain ?? org.domain}
                        aria-label={`Edit domain for ${org.name}`}
                        onChange={(e) => setOrgDrafts((p) => ({ ...p, [org.id]: { name: orgDrafts[org.id]?.name ?? org.name, domain: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <Badge variant={org.isActive ? "default" : "secondary"}>
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Members</span>
                    </div>
                    <span className="text-sm font-medium">{item.totalParticipants ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Active Surveys</span>
                    </div>
                    <span className="text-sm font-medium">{item.activeSurveys ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Completed Responses</span>
                    </div>
                    <span className="text-sm font-medium text-green-700">{item.completedResponses ?? 0}</span>
                  </div>

                  {/* 👤 ORGANISATION ADMIN — editable name/email + reset password */}
                  <div className="pt-1 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <UserCog className="w-4 h-4 text-indigo-500" /> Admins
                      </span>
                    </div>
                    {(item.admins && item.admins.length > 0) ? (
                      <div className="space-y-3">
                        {item.admins.map((admin: any) => {
                          const isResetting = resetUserId === admin.id;
                          const fName = currentAdmin(org.id, item, admin.id, 'firstName');
                          const lName = currentAdmin(org.id, item, admin.id, 'lastName');
                          const email = currentAdmin(org.id, item, admin.id, 'email');
                          return (
                            <div key={admin.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[11px] uppercase tracking-wide text-gray-500">First Name</Label>
                                  <Input
                                    className="mt-0.5 text-sm"
                                    value={fName}
                                    onChange={(e) => setDraftField(org.id, admin.id, 'firstName', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[11px] uppercase tracking-wide text-gray-500">Last Name</Label>
                                  <Input
                                    className="mt-0.5 text-sm"
                                    value={lName}
                                    onChange={(e) => setDraftField(org.id, admin.id, 'lastName', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[11px] uppercase tracking-wide text-gray-500">Email</Label>
                                <Input
                                  type="email"
                                  className="mt-0.5 text-sm"
                                  value={email}
                                  onChange={(e) => setDraftField(org.id, admin.id, 'email', e.target.value)}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  disabled={updateAdminMutation.isPending}
                                  onClick={() => {
                                    if (!email.trim()) { toast({ title: 'Email required', description: 'Admin must have an email address.', variant: 'destructive' }); return; }
                                    updateAdminMutation.mutate({ orgId: org.id, adminId: admin.id, data: { firstName: fName, lastName: lName, email } });
                                  }}
                                >
                                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                                </Button>
                                {isResetting ? (
                                  <>
                                    <Input
                                      type="password"
                                      placeholder="New password"
                                      autoFocus
                                      className="text-xs flex-1"
                                      value={resetPassword}
                                      onChange={(e) => setResetPassword(e.target.value)}
                                    />
                                    <Button
                                      size="sm"
                                      className="text-xs bg-amber-600 hover:bg-amber-700"
                                      disabled={resetPassword.length < 8 || resetPasswordMutation.isPending}
                                      onClick={() => resetPasswordMutation.mutate({ orgId: org.id, adminId: admin.id, password: resetPassword })}
                                    >
                                      Set
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setResetUserId(null); setResetPassword(''); }}>Cancel</Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                                    onClick={() => { setResetUserId(admin.id); setResetPassword(''); }}
                                  >
                                    <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset PW
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-1">No admin assigned to this organisation yet.</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Created {new Date(org.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {organizations?.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first organization.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>
        )}

        {/* Create Organization Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="orgDomain">Domain</Label>
                <Input
                  id="orgDomain"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  placeholder="company.com"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createOrganizationMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}