import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Quantum360Start() {
  const [, setLocation] = useLocation();
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [title, setTitle] = useState("");
  const { toast } = useToast();

  const createCycleMutation = useMutation({
    mutationFn: async (data: { leaderName: string; leaderEmail: string; title: string }) => {
      const response = await apiRequest('POST', '/api/quantum360/create-cycle', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment Created",
        description: `Your Quantum 360 assessment has been created with code: ${data.inviteCode}`,
      });
      // Redirect to survey page
      setLocation(`/survey/${data.inviteCode}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderName || !leaderEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCycleMutation.mutate({ leaderName, leaderEmail, title: title || "Quantum Leadership Assessment" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Begin Your Quantum Assessment
          </h1>
          <p className="text-lg text-gray-400">
            Create a personalized 360-degree leadership assessment
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 md:p-12 bg-gray-800/50 border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="leaderName" className="text-white text-base mb-2 block">
                Leader Name *
              </Label>
              <Input
                id="leaderName"
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="Enter leader's full name"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                data-testid="input-leader-name"
                required
              />
            </div>

            <div>
              <Label htmlFor="leaderEmail" className="text-white text-base mb-2 block">
                Leader Email *
              </Label>
              <Input
                id="leaderEmail"
                type="email"
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                placeholder="leader@example.com"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                data-testid="input-leader-email"
                required
              />
            </div>

            <div>
              <Label htmlFor="title" className="text-white text-base mb-2 block">
                Assessment Title (Optional)
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q1 2025 Leadership Review"
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                data-testid="input-assessment-title"
              />
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-pink-600/10 border border-orange-500/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What's Included:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>✓ 10 Core Leadership Competencies</li>
                <li>✓ 30 Behavioral Questions (1-10 Scale)</li>
                <li>✓ Maturity Level Classification</li>
                <li>✓ 9-Box Performance Grid</li>
                <li>✓ Comprehensive Development Report</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700"
              disabled={createCycleMutation.isPending}
              data-testid="button-create-assessment"
            >
              {createCycleMutation.isPending ? "Creating..." : (
                <>
                  Create Assessment <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/quantum360")}
            className="text-gray-400 hover:text-white"
            data-testid="button-back"
          >
            ← Back to Overview
          </Button>
        </div>
      </div>
    </div>
  );
}
