import { useParams } from 'wouter';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch survey data including leader info
  const { data: surveyData, isLoading } = useQuery({
    queryKey: ['/api/survey-cycles', inviteCode],
    queryFn: async () => {
      const response = await fetch(`/api/survey-cycles/${inviteCode}`);
      if (!response.ok) throw new Error('Survey not found');
      return response.json();
    },
    enabled: !!inviteCode,
  });



  // Use actual survey questions if available, otherwise use default SyncShift questions
  const questions = surveyData?.surveyQuestions?.map((q: any) => ({
    id: q.id,
    type: q.type,
    question: q.text || q.question,
    scale: q.scale?.max || 7,
    category: q.category
  })) || [
    // SyncShift 360 Rating Questions (26 questions)
    { id: '1', type: 'rating', question: 'Communicates a clear vision and direction for the team/organization', scale: 7, category: 'Leadership' },
    { id: '2', type: 'rating', question: 'Makes sense of complex situations and provides clarity', scale: 7, category: 'Leadership' },
    { id: '3', type: 'rating', question: 'Demonstrates strategic thinking and planning', scale: 7, category: 'Leadership' },
    { id: '4', type: 'rating', question: 'Inspires confidence and trust in their leadership', scale: 7, category: 'Leadership' },
    { id: '5', type: 'rating', question: 'Effectively leads through change and uncertainty', scale: 7, category: 'Leadership' },
    
    { id: '6', type: 'rating', question: 'Builds and maintains effective systems and processes', scale: 7, category: 'Infrastructure' },
    { id: '7', type: 'rating', question: 'Ensures consistent delivery of results', scale: 7, category: 'Infrastructure' },
    { id: '8', type: 'rating', question: 'Creates structure that enables team effectiveness', scale: 7, category: 'Infrastructure' },
    { id: '9', type: 'rating', question: 'Manages resources and priorities effectively', scale: 7, category: 'Infrastructure' },
    
    { id: '10', type: 'rating', question: 'Demonstrates authentic leadership style', scale: 7, category: 'Motives' },
    { id: '11', type: 'rating', question: 'Shows genuine care for team members and stakeholders', scale: 7, category: 'Motives' },
    { id: '12', type: 'rating', question: 'Acts with integrity and ethical principles', scale: 7, category: 'Motives' },
    { id: '13', type: 'rating', question: 'Drives purpose and meaning in work', scale: 7, category: 'Motives' },
    
    { id: '14', type: 'rating', question: 'Demonstrates relevant technical/functional expertise', scale: 7, category: 'Capabilities' },
    { id: '15', type: 'rating', question: 'Adapts quickly to new situations and challenges', scale: 7, category: 'Capabilities' },
    { id: '16', type: 'rating', question: 'Continuously learns and develops new skills', scale: 7, category: 'Capabilities' },
    { id: '17', type: 'rating', question: 'Applies sound judgment in decision-making', scale: 7, category: 'Capabilities' },
    
    { id: '18', type: 'rating', question: 'Builds strong, collaborative relationships', scale: 7, category: 'Culture' },
    { id: '19', type: 'rating', question: 'Creates an inclusive and psychologically safe environment', scale: 7, category: 'Culture' },
    { id: '20', type: 'rating', question: 'Develops and mentors team members effectively', scale: 7, category: 'Culture' },
    { id: '21', type: 'rating', question: 'Promotes positive team dynamics and culture', scale: 7, category: 'Culture' },
    
    { id: '22', type: 'rating', question: 'Has a strong professional reputation', scale: 7, category: 'Personal Brand' },
    { id: '23', type: 'rating', question: 'Communicates effectively across all levels', scale: 7, category: 'Personal Brand' },
    { id: '24', type: 'rating', question: 'Creates positive impact and influence', scale: 7, category: 'Personal Brand' },
    
    { id: '25', type: 'rating', question: 'Aligns actions with organizational goals and values', scale: 7, category: 'Alignment' },
    { id: '26', type: 'rating', question: 'Delivers outcomes that meet stakeholder expectations', scale: 7, category: 'Alignment' },
    
    // Open Text Questions (3 questions)
    { id: '27', type: 'text', question: 'What are this leader\'s greatest strengths?' },
    { id: '28', type: 'text', question: 'What are some small shifts this leader could make to create better alignment with team/organizational goals?' },
    { id: '29', type: 'text', question: 'Any additional feedback or comments?' }
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
          inviteCode: inviteCode,
          responses: Object.entries(responses).map(([questionId, answer]) => ({
            questionId,
            ...answer
          }))
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">SyncShift 360 Feedback Survey</CardTitle>
            {surveyData?.leaderFirstName && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-medium text-blue-900">
                  Providing feedback for: {surveyData.leaderFirstName} {surveyData.leaderLastName}
                </p>
                {surveyData.leaderPosition && (
                  <p className="text-sm text-blue-700">{surveyData.leaderPosition}</p>
                )}
              </div>
            )}
            <p className="text-gray-600 mt-4">
              Your feedback is completely anonymous and will help improve leadership effectiveness.
            </p>
            <p className="text-sm text-gray-500">
              {questions.length} questions total
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  {question.category && (
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      {question.category}
                    </div>
                  )}
                  <Label className="text-base font-medium">
                    {index + 1}. {question.question}
                  </Label>
                  
                  {question.type === 'rating' ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Strongly Disagree</span>
                      <div className="flex space-x-2">
                        {Array.from({length: question.scale || 7}, (_, i) => i + 1).map((rating) => (
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
                      <span className="text-sm text-gray-500">Strongly Agree</span>
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
