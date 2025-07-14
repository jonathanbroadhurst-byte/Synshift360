import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { RequireAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Report() {
  const { reportId } = useParams();

  const { data: report, isLoading } = useQuery({
    queryKey: ['/api/reports', reportId],
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!report) {
    return (
      <RequireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
              <p className="text-gray-600">
                The requested report could not be found or you don't have permission to view it.
              </p>
            </CardContent>
          </Card>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                360 Feedback Report
              </CardTitle>
              <p className="text-gray-600">
                Generated on {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3>Executive Summary</h3>
                <p>{report.executiveSummary}</p>
                
                {/* Report content would be rendered here */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                    <div>
                      <h4 className="font-medium text-blue-800">Report Status</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Status: {report.status}
                        {report.status === 'released' && report.releasedAt && (
                          ` - Released on ${new Date(report.releasedAt).toLocaleDateString()}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
