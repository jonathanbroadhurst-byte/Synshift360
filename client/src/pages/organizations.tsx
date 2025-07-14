import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Building, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RequireAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function Organizations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const { toast } = useToast();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: { name: string; domain: string }) => {
      const response = await apiRequest('POST', '/api/organizations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
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
          {organizations?.map((org: any) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-sm text-gray-500">{org.domain}</p>
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
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Active Surveys</span>
                    </div>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Created {new Date(org.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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