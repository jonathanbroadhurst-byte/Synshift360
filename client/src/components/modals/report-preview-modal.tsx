import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface ReportPreviewModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportPreviewModal({ reportId, isOpen, onClose }: ReportPreviewModalProps) {
  const { toast } = useToast();

  const { data: report, isLoading } = useQuery({
    queryKey: ['/api/reports', reportId],
    enabled: !!reportId && isOpen,
  });

  const releaseReportMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error('No report ID');
      return await apiRequest('POST', `/api/reports/${reportId}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Report released",
        description: "The report has been successfully released to the leader.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Release failed",
        description: "Failed to release the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const mockStrengths = [
    {
      title: "Technical Excellence",
      description: "Demonstrates deep technical expertise and consistently delivers high-quality solutions",
      icon: "lightbulb",
      rating: 4.2
    },
    {
      title: "Team Mentorship",
      description: "Effectively guides and develops team members, fostering growth and learning",
      icon: "users",
      rating: 4.0
    },
    {
      title: "Strategic Vision",
      description: "Shows excellent long-term planning and alignment with business objectives",
      icon: "chart-line",
      rating: 4.3
    }
  ];

  const mockDevelopmentAreas = [
    {
      title: "Delegation Skills",
      description: "Focus on empowering team members by delegating more responsibilities",
      suggestions: ["Regular 1:1s with direct reports", "Clear ownership assignments", "Trust-building exercises"],
      priority: "high"
    },
    {
      title: "Cross-functional Collaboration",
      description: "Increase visibility and engagement with other departments",
      suggestions: ["Join cross-functional initiatives", "Schedule regular check-ins with peer leaders"],
      priority: "medium"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-secondary">
            360 Feedback Report Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-xl">
                      {report.leader?.firstName?.[0] || 'L'}{report.leader?.lastName?.[0] || 'L'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-secondary">
                      {report.title || 'Report Title'}
                    </h4>
                    <p className="text-gray-600">
                      Generated on {formatDate(report.generatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h5 className="text-lg font-semibold text-secondary mb-4">Executive Summary</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    {report.executiveSummary || 
                      "This leader demonstrates strong performance across key competencies with particular strengths in technical leadership and strategic thinking. Development opportunities focus on delegation and cross-functional collaboration to enhance overall impact."
                    }
                  </p>
                </div>
              </div>

              {/* Key Strengths */}
              <div>
                <h5 className="text-lg font-semibold text-secondary mb-4">Key Strengths</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(report.strengths || mockStrengths).map((strength: any, index: number) => (
                    <div key={index} className="bg-success/5 border border-success/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className={`fas fa-${strength.icon} text-success`}></i>
                        <h6 className="font-medium text-secondary">{strength.title}</h6>
                      </div>
                      <p className="text-sm text-gray-600">{strength.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Development Areas */}
              <div>
                <h5 className="text-lg font-semibold text-secondary mb-4">Development Opportunities</h5>
                <div className="space-y-4">
                  {(report.developmentAreas || mockDevelopmentAreas).map((area: any, index: number) => (
                    <div key={index} className="bg-warning/5 border border-warning/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="fas fa-share-alt text-warning"></i>
                        <h6 className="font-medium text-secondary">{area.title}</h6>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                      {area.suggestions && (
                        <div className="text-xs text-gray-500">
                          <strong>Suggested Actions:</strong> {area.suggestions.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h5 className="text-lg font-semibold text-secondary mb-4">Feedback Overview</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary">
                      {report.statistics?.totalResponses || 12}
                    </div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {report.statistics?.averageRating?.toFixed(1) || '4.2'}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      {report.statistics?.responseRate || 85}%
                    </div>
                    <div className="text-sm text-gray-600">Response Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {report.statistics?.topThemes?.length || 3}
                    </div>
                    <div className="text-sm text-gray-600">Key Themes</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Report not found
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 flex items-center justify-between bg-gray-50 p-4 -m-6 mt-4">
          <div className="text-sm text-gray-600">
            <i className="fas fa-shield-alt mr-1"></i>
            This report contains confidential feedback and should be handled according to GDPR guidelines.
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => releaseReportMutation.mutate()}
              disabled={releaseReportMutation.isPending}
              className="bg-success text-white hover:bg-green-600"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              {releaseReportMutation.isPending ? 'Releasing...' : 'Release Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
