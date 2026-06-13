import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Coins, Plus, Minus, Building2, Loader2, Activity, Server, Users, Zap, UserPlus } from "lucide-react";

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const [creditInputs, setCreditInputs] = useState<Record<number, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ orgName: "", domain: "", adminEmail: "", adminPassword: "" });

  const { data: organizations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/owner/organizations/usage"],
  });

  const allocateCreditsMutation = useMutation({
    mutationFn: async ({ orgId, amount }: { orgId: number; amount: number }) => {
      const res = await apiRequest("PATCH", `/api/owner/organizations/${orgId}/credits`, { creditsToAllocate: amount });
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ["/api/owner/organizations/usage"] });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: typeof newClient) => {
      const res = await apiRequest("POST", "/api/owner/organizations", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/owner/organizations/usage"] });
    },
  });

  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const val = parseInt(creditInputs[orgId] || "0", 10);
    if (val <= 0) return;
    allocateCreditsMutation.mutate({ orgId, amount: isAddition ? val : -val });
    setCreditInputs((p) => ({ ...p, [orgId]: "" }));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold">Command Center</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600"><UserPlus className="mr-2 h-4 w-4" /> Provision Client</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader><DialogTitle>New Organization</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createClientMutation.mutate(newClient); }} className="space-y-4">
                <Input placeholder="Org Name" onChange={(e) => setNewClient({...newClient, orgName: e.target.value})} />
                <Input placeholder="Domain" onChange={(e) => setNewClient({...newClient, domain: e.target.value})} />
                <Input placeholder="Admin Email" onChange={(e) => setNewClient({...newClient, adminEmail: e.target.value})} />
                <Input type="password" placeholder="Password" onChange={(e) => setNewClient({...newClient, adminPassword: e.target.value})} />
                <DialogFooter><Button type="submit">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle>Client Ledger</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations?.map((item) => (
                  <TableRow key={item.organization.id}>
                    <TableCell>{item.organization.name}</TableCell>
                    <TableCell>{item.organization.quantumCredits ?? 0} Tokens</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Input type="number" className="w-20" onChange={(e) => setCreditInputs({...creditInputs, [item.organization.id]: e.target.value})} />
                      <Button onClick={() => executeAllocation(item.organization.id, true)}>+</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
