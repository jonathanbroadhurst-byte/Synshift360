import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Coins, Plus, Minus, Building2, Loader2, Activity, Server, Users, Zap } from "lucide-react";

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const [creditInputs, setCreditInputs] = useState<Record<number, string>>({});

  // 1. Fetch tenant organizations along with their usage metrics
  const { data: organizations, isLoading } = useQuery<any[]>({
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
      alert(data.message || "Organization credit ledger successfully modified.");
      queryClient.invalidateQueries({ queryKey: ["/api/owner/organizations/usage"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update corporate credit balance.");
    },
  });

  const handleInputChange = (orgId: number, value: string) => {
    setCreditInputs((prev) => ({ ...prev, [orgId]: value }));
  };

  const executeAllocation = (orgId: number, isAddition: boolean) => {
    const rawValue = creditInputs[orgId];
    const parsedAmount = parseInt(rawValue, 10);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please input a positive whole number token value.");
      return;
    }

    const finalAllocationDelta = isAddition ? parsedAmount : parsedAmount * -1;

    allocateCreditsMutation.mutate({
      orgId,
      amount: finalAllocationDelta,
    });

    setCreditInputs((prev) => ({ ...prev, [orgId]: "" }));
  };

  // Calculate platform-wide totals for the new top cards
  const totalClients = organizations?.length || 0;
  const totalActiveCycles = organizations?.reduce((acc, curr) => {
    const count = curr.activeCyclesCount ?? curr.totalCyclesCreated ?? 0;
    return acc + count;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 md:p-12 font-sans selection:bg-orange-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-orange-500 font-mono text-sm uppercase tracking-widest mb-1">
              <Shield className="w-4 h-4" /> Platform Owner Control Panel
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Command Center
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full font-mono text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Healthy
          </div>
        </div>

        {/* Top Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900/40 border-gray-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Total Tenant Organizations</div>
                <div className="text-2xl font-bold font-mono">{totalClients}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-gray-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Active Assessment Loops</div>
                <div className="text-2xl font-bold font-mono">{totalActiveCycles}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-gray-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Global Responders</div>
                <div className="text-2xl font-bold font-mono text-gray-500">Syncing...</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: The Ledger (Takes up 2/3 of the screen) */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-md overflow-hidden h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Coins className="w-5 h-5 text-orange-400" /> Client Organization Ledger
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Allocate premium assessment tokens and monitor cross-tenant limits.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="rounded-xl border border-gray-800 bg-gray-950/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-900/60 border-gray-800">
                      <TableRow className="hover:bg-transparent border-gray-800">
                        <TableHead className="text-gray-400 font-semibold">Client Name</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-center">Active Cycles</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-center">Balance</TableHead>
                        <TableHead className="text-gray-400 font-semibold text-right pr-8">Modify Allocation</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {organizations && organizations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No corporate client records compiled within system databases.
                          </TableCell>
                        </TableRow>
                      ) : (
                        organizations?.map((item) => {
                          const org = item.organizations ? item.organizations : item;
                          const orgId = org.id ?? item.id;
                          const name = org.name ?? item.name ?? "Demo Organization";
                          const credits = org.quantumCredits ?? org.quantum_credits ?? item.quantumCredits ?? item.quantum_credits ?? 0;
                          const activeCycles = item.activeCyclesCount ?? item.totalCyclesCreated ?? 0;

                          return (
                            <TableRow key={orgId} className="border-gray-800/60 hover:bg-gray-900/20 transition-colors">
                              <TableCell className="font-medium text-white py-4">
                                {name}
                              </TableCell>
                              <TableCell className="text-center font-mono text-gray-300">{activeCycles}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                  {credits} Tokens
                                </span>
                              </TableCell>
                              
                              <TableCell className="text-right py-3">
                                <div className="flex items-center justify-end gap-2 max-w-xs ml-auto">
                                  <Input
                                    type="number"
                                    pattern="[0-9]*"
                                    min="1"
                                    placeholder="0"
                                    value={creditInputs[orgId] || ""}
                                    onChange={(e) => handleInputChange(orgId, e.target.value)}
                                    className="w-16 bg-gray-900 border-gray-700 text-white font-mono text-center focus-visible:ring-orange-500 h-9 placeholder:text-gray-600"
                                  />
                                  <Button size="sm" variant="outline" onClick={() => executeAllocation(orgId, false)} disabled={allocateCreditsMutation.isPending} className="border-gray-700 text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0">
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" onClick={() => executeAllocation(orgId, true)} disabled={allocateCreditsMutation.isPending} className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white h-9 px-3 font-semibold flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Server Actions (Takes up 1/3 of the screen) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Server className="w-5 h-5 text-blue-400" /> Platform Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-950/50 border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Database Connection</span>
                    <span className="text-xs text-green-400 font-mono">STABLE</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-950/50 border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">SMTP Relay (Emails)</span>
                    <span className="text-xs text-green-400 font-mono">ACTIVE</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" /> Force Global Cache Clear
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
