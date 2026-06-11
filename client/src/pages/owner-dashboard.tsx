import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Coins, Plus, Minus, Building2, Layers, Loader2 } from "lucide-react";

interface OrganizationUsage {
  id: number;
  name: string;
  domain: string;
  isActive: boolean;
  quantumCredits: number;
  totalCyclesCreated?: number;
  activeCyclesCount?: number;
}

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Tracks allocation amounts per organization ID locally
  const [creditInputs, setCreditInputs] = useState<Record<number, string>>({});

  // 1. Fetch all tenant organizations along with their system usage metrics
  const { data: organizations, isLoading } = useQuery<OrganizationUsage[]>({
    queryKey: ["/api/owner/organizations/usage"],
  });

  // 2. Mutation handler to securely allocate or deduct token values
  const allocateCreditsMutation = useMutation({
    mutationFn: async ({ orgId, amount }: { orgId: number; amount: number }) => {
      const res = await apiRequest("PATCH", `/api/owner/organizations/${orgId}/credits`, {
        creditsToAllocate: amount,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Complete",
        description: data.message || "Organization credit ledger successfully modified.",
      });
      // Invalidate the query loop to instantly force a visual UI refresh of data rows
      queryClient.invalidateQueries({ queryKey: ["/api/owner/organizations/usage"] });
    },
    onError: (err: any) => {
      toast({
        title: "Transaction Rejected",
        description: err.message || "Failed to update corporate credit balance.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (orgId: number, value: string) => {
    setCreditInputs((prev) => ({ ...prev, [orgId]: value }));
  };

  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const rawValue = creditInputs[orgId];
    const parsedAmount = parseInt(rawValue, 10);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please input a positive whole number token value.",
        variant: "destructive",
      });
      return;
    }

    // Multiply by -1 if the administrator clicked the deduct/minus configuration button
    const finalAllocationDelta = isAddition ? parsedAmount : parsedAmount * -1;

    allocateCreditsMutation.mutate({
      orgId,
      amount: finalAllocationDelta,
    });

    // Reset input fields cleanly upon firing request parameters
    setCreditInputs((prev) => ({ ...prev, [orgId]: "" }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Layout Control Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-orange-500 font-mono text-sm uppercase tracking-widest mb-1">
              <Shield className="w-4 h-4" /> Platform Owner Control Panel
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Corporate Credit & Token Control
            </h1>
          </div>
          
          <div className="flex items-center gap-6 bg-gray-900/40 border border-gray-800 rounded-xl p-4 px-6">
            <div className="flex items-center gap-3">
              <Building2 className="text-gray-400 w-5 h-5" />
              <div>
                <div className="text-xs text-gray-500">Total Clients</div>
                <div className="text-lg font-bold font-mono">{organizations?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Data Metric Grid System */}
        <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-xl">
              <Coins className="w-5 h-5 text-orange-400" /> Client Organization Ledger
            </CardTitle>
            <CardDescription className="text-gray-400">
              Allocate premium assessment tokens, view dynamic cross-tenant subscription limits, and monitor live assessment loop volumes.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-xl border border-gray-800 bg-gray-950/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-900/60 border-gray-800">
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableHead className="text-gray-400 font-semibold">Client Name</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Domain Target</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-center">Active Cycles</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-center">Premium Balance</TableHead>
                    <TableHead className="text-gray-400 font-semibold text-right pr-8">Modify Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {organizations && organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No corporate client records compiled within system databases.
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations?.map((org) => (
                      <TableRow key={org.id} className="border-gray-800/60 hover:bg-gray-900/20 transition-colors">
                        <TableCell className="font-medium text-white flex items-center gap-2 py-4">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          {org.name}
                        </TableCell>
                        <TableCell className="text-gray-400 font-mono text-sm">{org.domain}</TableCell>
                        <TableCell className="text-center font-mono text-gray-300">
                          {org.activeCyclesCount ?? org.totalCyclesCreated ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {org.quantumCredits} Credits
                          </span>
                        </TableCell>
                        
                        {/* Interactive Management Control Column */}
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-2 max-w-xs ml-auto">
                            <Input
                              type="number"
                              pattern="[0-9]*"
                              min="1"
                              placeholder="0"
                              value={creditInputs[org.id] || ""}
                              onChange={(e) => handleInputChange(org.id, e.target.value)}
                              className="w-20 bg-gray-900 border-gray-700 text-white font-mono text-center focus-visible:ring-orange-500 h-9 placeholder:text-gray-600"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeAllocation(org.id, false)}
                              disabled={allocateCreditsMutation.isPending}
                              className="border-gray-700 text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => executeAllocation(org.id, true)}
                              disabled={allocateCreditsMutation.isPending}
                              className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white h-9 px-3 font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
