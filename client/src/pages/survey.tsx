import { useParams } from 'wouter';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Survey() {
  const { inviteCode } = useParams();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const mockQuestions = [
    {
      id: '1',
      type: 'rating',
      question: 'How effectively does this leader communicate with the team?',
      scale: 5
    },
    {
      id: '2',
      type: 'rating',
      question: 'How well does this leader demonstrate technical expertise?',
      scale: 5
    },
    {
      id: '3',
      type: 'text',
      question: 'What are this leader\'s greatest strengths?',
    },
    {
      id: '4',
      type: 'text',
      question: 'What areas could this leader focus on for development?',
    },
    {
      id: '5',
      type: 'rating',
      question: 'How effectively does this leader support team member growth?',
      scale: 5
    }
  ];

  const handleRatingChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { type: 'rating', value }
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { type: 'text', value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/survey-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteToken: inviteCode,
          responses: Object.entries(responses).map(([questionId, answer]) => ({
            questionId,
            ...answer
          })),
          email: 'anonymous@feedback.com' // This would come from the invitation
        }),
      });

      if (response.ok) {
        toast({
          title: "Survey submitted",
          description: "Thank you for your feedback. Your responses have been recorded anonymously.",
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-clipboard-list text-white text-xl"></i>
            </div>
            <CardTitle className="text-2xl font-semibold">360 Feedback Survey</CardTitle>
            <p className="text-gray-600">
              Your feedback is completely anonymous and will help improve leadership effectiveness.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {mockQuestions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-base font-medium">{question.question}</Label>
                  
                  {question.type === 'rating' ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Poor</span>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingChange(question.id, rating)}
                            className={`w-10 h-10 rounded-full border-2 transition-colors ${
                              responses[question.id]?.value === rating
                                ? 'bg-primary border-primary text-white'
                                : 'border-gray-300 hover:border-primary'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">Excellent</span>
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Please provide your feedback..."
                      value={responses[question.id]?.value || ''}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      rows={4}
                    />
                  )}
                </div>
              ))}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-shield-alt text-yellow-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium text-yellow-800">Privacy Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your responses are completely anonymous. We use encryption and follow GDPR guidelines 
                      to protect your privacy. Individual responses cannot be traced back to you.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || Object.keys(responses).length === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
