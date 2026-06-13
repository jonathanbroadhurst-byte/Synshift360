import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, UserPlus, Server, Zap, Coins } from "lucide-react";

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
      setNewClient({ orgName: "", domain: "", adminEmail: "", adminPassword: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/organizations/usage"] });
    },
  });

  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const val = parseInt(creditInputs[orgId] || "0", 10);
    if (val <= 0) return;
    allocateCreditsMutation.mutate({ orgId, amount: isAddition ? val : -val });
    setCreditInputs((p) => ({ ...p, [orgId]: "" }));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white">Command Center</h1>
            <p className="text-gray-400 mt-2">Platform Owner Administration</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 px-6">
                <UserPlus className="mr-2 h-5 w-5" /> Provision Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-950 border border-gray-700 text-white">
              <DialogHeader><DialogTitle className="text-white">New Organization</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createClientMutation.mutate(newClient); }} className="space-y-4">
                <Label className="text-gray-300">Org Name</Label>
                <Input className="bg-gray-900 border-gray-600 text-white" onChange={(e) => setNewClient({...newClient, orgName: e.target.value})} />
                <Label className="text-gray-300">Domain</Label>
                <Input className="bg-gray-900 border-gray-600 text-white" onChange={(e) => setNewClient({...newClient, domain: e.target.value})} />
                <Label className="text-gray-300">Admin Email</Label>
                <Input className="bg-gray-900 border-gray-600 text-white" onChange={(e) => setNewClient({...newClient, adminEmail: e.target.value})} />
                <Label className="text-gray-300">Password</Label>
                <Input type="password" className="bg-gray-900 border-gray-600 text-white" onChange={(e) => setNewClient({...newClient, adminPassword: e.target.value})} />
                <DialogFooter><Button type="submit" className="bg-orange-600 w-full">Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader><CardTitle className="text-white">Client Ledger</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">Balance</TableHead>
                  <TableHead className="text-right text-gray-300">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations?.map((item) => (
                  <TableRow key={item.organization.id} className="border-gray-800">
                    <TableCell className="text-white font-bold text-lg">{item.organization.name}</TableCell>
                    <TableCell className="text-gray-100 font-medium text-lg">{item.organization.quantumCredits ?? 0} Tokens</TableCell>
                    <TableCell className="text-right flex justify-end gap-3">
                      <Input 
                        type="number" 
                        className="w-24 bg-gray-800 border-gray-600 text-white" 
                        placeholder="0"
                        onChange={(e) => setCreditInputs({...creditInputs, [item.organization.id]: e.target.value})} 
                      />
                      <Button 
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
                        onClick={() => executeAllocation(item.organization.id, true)}
                      >
                        Add
                      </Button>
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
