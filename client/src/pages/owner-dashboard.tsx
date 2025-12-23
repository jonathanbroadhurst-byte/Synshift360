import { RequireAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, FileCheck, Clock, TrendingUp, 
  DollarSign, UserCog, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface OrganizationUsage {
  organization: {
    id: number;
    name: string;
    domain: string | null;
    isActive: boolean;
  };
  activeSurveys: number;
  totalParticipants: number;
  completedResponses: number;
  pendingResponses: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: number | null;
  position: string | null;
  department: string | null;
  isActive: boolean;
}

export default function OwnerDashboard() {
  const { toast } = useToast();
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);

  const { data: orgsUsage, isLoading: orgsLoading } = useQuery<OrganizationUsage[]>({
    queryKey: ['/api/owner/organizations/usage'],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ['/api/owner/users'],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest('PATCH', `/api/owner/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const totalOrgs = orgsUsage?.length || 0;
  const totalActiveSurveys = orgsUsage?.reduce((sum, org) => sum + org.activeSurveys, 0) || 0;
  const totalParticipants = orgsUsage?.reduce((sum, org) => sum + org.totalParticipants, 0) || 0;
  const totalCompleted = orgsUsage?.reduce((sum, org) => sum + org.completedResponses, 0) || 0;

  const getOrgUsers = (orgId: number) => {
    return allUsers?.filter(u => u.organizationId === orgId) || [];
  };

  return (
    <RequireAuth roles={['owner']}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header />
          
          <div className="flex-1 p-8 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-secondary" data-testid="text-page-title">Platform Owner Dashboard</h1>
              <p className="text-gray-600">Manage organizations, view usage metrics, and assign administrators</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="card-total-orgs">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Organizations</p>
                      <p className="text-3xl font-bold text-secondary" data-testid="text-total-orgs">{totalOrgs}</p>
                    </div>
                    <Building2 className="h-10 w-10 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-active-surveys">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Surveys</p>
                      <p className="text-3xl font-bold text-secondary" data-testid="text-active-surveys">{totalActiveSurveys}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-participants">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Participants</p>
                      <p className="text-3xl font-bold text-secondary" data-testid="text-total-participants">{totalParticipants}</p>
                    </div>
                    <Users className="h-10 w-10 text-purple-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-responses">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completed Responses</p>
                      <p className="text-3xl font-bold text-secondary" data-testid="text-completed-responses">{totalCompleted}</p>
                    </div>
                    <FileCheck className="h-10 w-10 text-emerald-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-org-usage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Organization Usage & Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                ) : orgsUsage && orgsUsage.length > 0 ? (
                  <div className="space-y-4">
                    {orgsUsage.map((orgData) => {
                      const completionRate = orgData.totalParticipants > 0 
                        ? Math.round((orgData.completedResponses / orgData.totalParticipants) * 100) 
                        : 0;
                      const isExpanded = expandedOrg === orgData.organization.id;
                      const orgUsers = getOrgUsers(orgData.organization.id);

                      return (
                        <div 
                          key={orgData.organization.id} 
                          className="border rounded-lg overflow-hidden"
                          data-testid={`org-row-${orgData.organization.id}`}
                        >
                          <div 
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setExpandedOrg(isExpanded ? null : orgData.organization.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Building2 className="h-8 w-8 text-blue-500" />
                                <div>
                                  <h4 className="font-semibold text-secondary" data-testid={`text-org-name-${orgData.organization.id}`}>
                                    {orgData.organization.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">{orgData.organization.domain || 'No domain set'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-secondary" data-testid={`text-org-surveys-${orgData.organization.id}`}>
                                    {orgData.activeSurveys}
                                  </p>
                                  <p className="text-xs text-gray-500">Active Surveys</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-secondary" data-testid={`text-org-participants-${orgData.organization.id}`}>
                                    {orgData.totalParticipants}
                                  </p>
                                  <p className="text-xs text-gray-500">Participants</p>
                                </div>
                                <div className="text-center min-w-[100px]">
                                  <div className="flex items-center gap-2">
                                    <Progress value={completionRate} className="h-2 flex-1" />
                                    <span className="text-sm font-medium" data-testid={`text-org-completion-${orgData.organization.id}`}>
                                      {completionRate}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">Completion Rate</p>
                                </div>
                                {orgData.activeSurveys > 0 ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                                {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t bg-gray-50 p-4">
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <UserCog className="h-4 w-4" />
                                Organization Users ({orgUsers.length})
                              </h5>
                              {orgUsers.length > 0 ? (
                                <div className="space-y-2">
                                  {orgUsers.map((user) => (
                                    <div 
                                      key={user.id} 
                                      className="flex items-center justify-between bg-white p-3 rounded-lg border"
                                      data-testid={`user-row-${user.id}`}
                                    >
                                      <div>
                                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Select
                                          value={user.role}
                                          onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                                          disabled={updateRoleMutation.isPending}
                                        >
                                          <SelectTrigger className="w-[140px]" data-testid={`select-role-${user.id}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="org_admin">Org Admin</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="leader">Leader</SelectItem>
                                            <SelectItem value="participant">Participant</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No users assigned to this organization</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No organizations found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-billing-summary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Organization</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Active Surveys</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Participants</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Completed</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Pending</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgsUsage?.map((orgData) => (
                        <tr key={orgData.organization.id} className="border-b hover:bg-gray-50" data-testid={`billing-row-${orgData.organization.id}`}>
                          <td className="py-3 px-4 font-medium">{orgData.organization.name}</td>
                          <td className="py-3 px-4 text-center">{orgData.activeSurveys}</td>
                          <td className="py-3 px-4 text-center">{orgData.totalParticipants}</td>
                          <td className="py-3 px-4 text-center text-green-600">{orgData.completedResponses}</td>
                          <td className="py-3 px-4 text-center text-orange-600">{orgData.pendingResponses}</td>
                          <td className="py-3 px-4 text-center">
                            {orgData.activeSurveys > 0 ? (
                              <Badge className="bg-green-100 text-green-800">Billable</Badge>
                            ) : (
                              <Badge variant="outline">No Activity</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-center">{totalActiveSurveys}</td>
                        <td className="py-3 px-4 text-center">{totalParticipants}</td>
                        <td className="py-3 px-4 text-center text-green-600">{totalCompleted}</td>
                        <td className="py-3 px-4 text-center text-orange-600">{orgsUsage?.reduce((sum, org) => sum + org.pendingResponses, 0) || 0}</td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
