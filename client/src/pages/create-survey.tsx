import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CreateSurvey() {
  const [contactData, setContactData] = useState<any>(null);
  const [surveyData, setSurveyData] = useState({
    title: '',
    leaderName: '',
    leaderPosition: '',
    participantEmails: '',
    instructions: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [surveyCode, setSurveyCode] = useState<string>('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came from contact form
    const storedContact = localStorage.getItem('syncshift_contact');
    if (storedContact) {
      const contact = JSON.parse(storedContact);
      setContactData(contact);
      // Pre-fill leader name if available
      setSurveyData(prev => ({
        ...prev,
        leaderName: `${contact.firstName} ${contact.lastName}`,
        leaderPosition: contact.role || ''
      }));
    } else {
      // Redirect to contact form if no contact data
      setLocation('/contact-form');
    }
  }, [setLocation]);

  const handleInputChange = (field: string, value: string) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!surveyData.title || !surveyData.leaderName) {
      toast({
        title: "Required fields missing",
        description: "Please fill in the survey title and leader name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Call the API to create the personal survey
      const response = await fetch('/api/surveys/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactData,
          surveyData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create survey');
      }

      const result = await response.json();
      setSurveyCode(result.surveyCode);
      
      toast({
        title: "Survey created successfully!",
        description: `Your survey code is ${result.surveyCode}. Share this with participants.`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!contactData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (surveyCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold text-gray-900">SyncShift</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Success Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-900">Survey Created Successfully!</CardTitle>
              <p className="text-gray-600 mt-2">
                Your SyncShift Personal survey is ready for feedback collection
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Survey Code Display */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
                <h3 className="font-medium text-blue-900 mb-2">Your Survey Code</h3>
                <div className="text-3xl font-bold text-blue-800 font-mono mb-2">{surveyCode}</div>
                <p className="text-sm text-blue-700">Share this code with your team members to collect feedback</p>
              </div>

              {/* Survey Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-2">Survey Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Title:</strong> {surveyData.title}</p>
                    <p><strong>Leader:</strong> {surveyData.leaderName}</p>
                    {surveyData.leaderPosition && (
                      <p><strong>Position:</strong> {surveyData.leaderPosition}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-2">Contact Person</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Name:</strong> {contactData.firstName} {contactData.lastName}</p>
                    <p><strong>Email:</strong> {contactData.email}</p>
                    <p><strong>Organization:</strong> {contactData.organization}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">How to Collect Feedback</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>1. Share the survey code <strong>{surveyCode}</strong> with your team members</p>
                  <p>2. Direct them to: <strong>{window.location.host}/survey-access</strong></p>
                  <p>3. They'll enter the code and complete the anonymous feedback</p>
                  <p>4. We'll compile the results and send you a comprehensive report</p>
                </div>
              </div>

              {/* Survey Link and Email Options */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Share Your Survey</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-green-800 mb-2">
                      Direct survey link for participants:
                    </p>
                    <div className="bg-white rounded border p-2 font-mono text-sm break-all">
                      {window.location.origin}/survey/{surveyCode}
                    </div>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Email notification:</strong> We'll send you a confirmation email with your survey details and instructions for sharing with your team.
                    </p>
                    <p className="text-xs text-gray-600">
                      Email will be sent to: {contactData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => {
                    localStorage.removeItem('syncshift_contact');
                    setLocation('/');
                  }}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold"
                >
                  Return to Home
                </Button>
                <Button 
                  onClick={() => setLocation('/survey-access')}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold"
                >
                  Test Your Survey
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl font-bold">Create Your SyncShift Personal Survey</CardTitle>
              <Badge variant="secondary">Step 2 of 2</Badge>
            </div>
            <p className="text-gray-600 mt-2">
              Welcome {contactData.firstName}! Set up your 360-degree feedback survey
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Survey Creation Form */}
            <form onSubmit={handleCreateSurvey} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Leadership Feedback for Q1 2025"
                  value={surveyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaderName">Leader Name *</Label>
                  <Input
                    id="leaderName"
                    type="text"
                    placeholder="Who will receive feedback?"
                    value={surveyData.leaderName}
                    onChange={(e) => handleInputChange('leaderName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaderPosition">Leader Position</Label>
                  <Input
                    id="leaderPosition"
                    type="text"
                    placeholder="e.g., Team Lead, Manager"
                    value={surveyData.leaderPosition}
                    onChange={(e) => handleInputChange('leaderPosition', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participantEmails">Participant Emails (optional)</Label>
                <Textarea
                  id="participantEmails"
                  placeholder="Enter email addresses separated by commas or new lines..."
                  value={surveyData.participantEmails}
                  onChange={(e) => handleInputChange('participantEmails', e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Leave blank if you'll share the survey code manually
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Custom Instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any special instructions for your team..."
                  value={surveyData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold" 
                disabled={isCreating}
              >
                {isCreating ? "Creating Your Survey..." : "Create SyncShift Personal Survey"}
              </Button>
            </form>

            {/* Information Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">What Happens Next?</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• You'll receive a unique survey code to share with your team</p>
                <p>• Team members complete the 29-question SyncShift assessment anonymously</p>
                <p>• We'll compile responses into a comprehensive leadership report</p>
                <p>• You'll receive your personalized feedback and development insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}