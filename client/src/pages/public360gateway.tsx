import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Public360Gateway() {
  const [, setLocation] = useLocation();
  const [leadDetails, setLeadDetails] = useState({ firstName: '', lastName: '', email: '' });

  // Leveraging your exact, locked-in backend endpoint architecture
  const gatewayMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Maps to your public organization container pipeline
      const res = await apiRequest("POST", "/api/organizations/1/deploy-surveys", payload);
      if (!res.ok) throw new Error("Initialization failed. Please check your network connection.");
      return res.json();
    },
    onSuccess: (data) => {
      // Upon successful background account generation, forward user directly to the survey runner route
      if (data.success) {
        setLocation('/survey/quantum'); 
      }
    },
    onError: (err: any) => alert(err.message || "Could not register lead details."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadDetails.firstName || !leadDetails.email) {
      return alert("First name and corporate email address are required to initialize your profile loop.");
    }

    // Executes the exact manual processing payload expected by your backend seeder layer
    gatewayMutation.mutate({
      method: 'manual',
      participants: [{
        firstName: leadDetails.firstName.trim(),
        lastName: leadDetails.lastName.trim() || 'Leader',
        email: leadDetails.email.trim().toLowerCase()
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 rounded-2xl">
        <CardHeader className="space-y-1.5 pb-6">
          <div className="text-sm font-black tracking-widest text-indigo-500 uppercase mb-1">⚡ SyncShift Framework</div>
          <CardTitle className="text-2xl font-bold text-white tracking-tight">
            Initialize 360 Diagnostic
          </CardTitle>
          <CardDescription className="text-sm text-gray-400 font-light leading-relaxed">
            Provide your leadership parameter details below to activate your system alignment assessment loop.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-gray-400">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                value={leadDetails.firstName} 
                onChange={(e) => setLeadDetails({...leadDetails, firstName: e.target.value})}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-indigo-500 h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-gray-400">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Broadhurst" 
                value={leadDetails.lastName} 
                onChange={(e) => setLeadDetails({...leadDetails, lastName: e.target.value})}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-indigo-500 h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-400">Corporate Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john.broadhurst@organisation.com" 
                value={leadDetails.email} 
                onChange={(e) => setLeadDetails({...leadDetails, email: e.target.value})}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 focus:ring-indigo-500 h-11 rounded-lg"
              />
            </div>

            <Button 
              type="submit" 
              disabled={gatewayMutation.isPending} 
              className="w-full mt-4 bg-indigo-600 text-white font-semibold h-11 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              {gatewayMutation.isPending ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Mapping Structural Pipeline...
                </span>
              ) : "Initialize Assessment Matrix →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
