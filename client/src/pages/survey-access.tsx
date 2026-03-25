import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SurveyAccess() {
  const [surveyCode, setSurveyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyCode.trim()) {
      toast({
        title: "Survey code required",
        description: "Please enter a valid survey code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate survey code exists
      const response = await fetch(`/api/survey-cycles/${surveyCode.trim()}`);
      if (response.ok) {
        // Navigate to survey
        setLocation(`/survey/${surveyCode.trim()}`);
      } else {
        toast({
          title: "Invalid survey code",
          description: "The survey code you entered is not valid or the survey is no longer active.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to access survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-gray-900">SyncShift</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">← Back to Home</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">SyncShift Personal Access</CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your survey code to provide anonymous feedback
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Survey Code Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="surveyCode">Survey Code</Label>
                <Input
                  id="surveyCode"
                  type="text"
                  placeholder="Enter your survey code"
                  value={surveyCode}
                  onChange={(e) => setSurveyCode(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <p className="text-sm text-gray-500">
                  This code was provided by your organization or team leader
                </p>
              </div>
              
              <Button 
                type="submit" 
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold" 
                disabled={isLoading || !surveyCode.trim()}
              >
                {isLoading ? "Accessing Survey..." : "Access Survey"}
              </Button>
            </form>

            {/* Information Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">About 360 Feedback</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  360-degree feedback is a comprehensive evaluation method where you provide 
                  anonymous feedback about a leader's performance across multiple competencies.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your responses are completely anonymous</li>
                  <li>Takes approximately 10-15 minutes to complete</li>
                  <li>Covers leadership, communication, and development areas</li>
                  <li>Helps leaders grow and improve their effectiveness</li>
                </ul>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Privacy & Security</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>• All responses are encrypted and stored securely</p>
                <p>• Individual responses cannot be traced back to you</p>
                <p>• Data is handled in compliance with GDPR regulations</p>
                <p>• Only aggregated results are shared with leaders</p>
              </div>
            </div>

            {/* Help Section */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Need help? Contact your organization's HR department or team leader
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}