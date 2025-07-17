import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    teamSize: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.organization) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store contact information (in real implementation, this would save to database)
      console.log('Contact form submission:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Thank you for your interest!",
        description: "You can now create your own survey cycle for feedback collection.",
      });
      
      // Store contact data in localStorage for the survey creation flow
      localStorage.setItem('syncshift_contact', JSON.stringify(formData));
      
      // Redirect to survey creation page
      setLocation('/create-survey');
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-gray-900">SyncShift360</a>
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
              <CardTitle className="text-2xl font-bold">Try SyncShift Personal</CardTitle>
              <Badge variant="secondary">Free Trial</Badge>
            </div>
            <p className="text-gray-600 mt-2">
              Provide your contact details to access our 360-degree feedback platform
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    type="text"
                    placeholder="Your company or organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    type="text"
                    placeholder="e.g., Team Leader, Manager, Director"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="text"
                  placeholder="How many people would participate in feedback?"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Tell us about your feedback needs (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="What are you hoping to achieve with 360-degree feedback?"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Get Access to SyncShift Personal"}
                </Button>
              </div>
            </form>

            {/* Information Section */}
            <div className="grid md:grid-cols-2 gap-4 pt-6 border-t">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">What's Included</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Complete SyncShift 360 assessment</p>
                  <p>• Anonymous feedback collection</p>
                  <p>• Comprehensive leadership report</p>
                  <p>• 29 competency-based questions</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Next Steps</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• We'll contact you within 24 hours</p>
                  <p>• Quick setup consultation call</p>
                  <p>• Access to your survey dashboard</p>
                  <p>• Full support throughout the process</p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-medium text-gray-900 mb-2">Privacy & Data Protection</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Your contact information is securely stored and GDPR compliant</p>
                <p>• We'll only contact you about SyncShift Personal services</p>
                <p>• All feedback data is anonymized and encrypted</p>
                <p>• You can request data deletion at any time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}