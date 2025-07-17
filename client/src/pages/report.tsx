import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { RequireAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Users, Target, BarChart3, Download, Quote } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function Report() {
  const { reportId } = useParams();

  const { data: report, isLoading } = useQuery({
    queryKey: ['/api/reports', reportId],
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-gray-600">
              The requested report could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statistics = typeof report.statistics === 'string' ? JSON.parse(report.statistics) : report.statistics;
  const strengths = typeof report.strengths === 'string' ? JSON.parse(report.strengths) : report.strengths;
  const developmentAreas = typeof report.developmentAreas === 'string' ? JSON.parse(report.developmentAreas) : report.developmentAreas;

  return (
    <div>
      <div className="min-h-screen syncshift-gradient">
        {/* Navigation */}
        <nav className="bg-white/10 backdrop-blur-md shadow-sm border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold text-white">🌀 SyncShift360</a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-white/80 hover:text-white transition-colors">← Home</a>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🌀 SyncShift Personal Report
                </h1>
                <p className="text-blue-100">
                  {report.title?.includes('Jon Smith') ? 'Jon Smith' : 'Sarah Johnson'} • Leadership Assessment • Generated {new Date(report.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {report.status}
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="syncshift-card">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Overall Rating</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics?.overallAverage || 'N/A'}/7</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Responses</p>
                    <p className="text-2xl font-bold text-green-600">{statistics?.totalResponses || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics?.responseRate || 0}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Key Strengths</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics?.strengthsCount || 0}</p>
                  </div>
                  <Target className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-lg">
                {report.executiveSummary}
              </p>
            </CardContent>
          </Card>

          {/* Competency Assessment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Competency Assessment</CardTitle>
              <p className="text-gray-600">Performance across SyncShift 360 leadership framework</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-5 gap-6 min-h-[320px]">
                {/* Radar Chart - Takes 3 columns */}
                <div className="col-span-3 min-h-[320px] flex items-center justify-center">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={statistics?.competencyAverages ? Object.entries(statistics.competencyAverages).map(([name, value]) => ({ name, value, fullMark: 7 })) : []}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 7]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Competency Scores - Takes 2 columns */}
                <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-4">Detailed Scores</h4>
                  <div className="space-y-3">
                    {statistics?.competencyAverages && Object.entries(statistics.competencyAverages).map(([competency, rating]) => (
                      <div key={competency} className="bg-white rounded p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800 text-sm">{competency}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-blue-600">{rating}/7</span>
                            <Badge variant="secondary" className={`text-xs ${rating >= 5.5 ? 'bg-green-100 text-green-800' : rating >= 4.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {rating >= 5.5 ? 'Strong' : rating >= 4.5 ? 'Dev' : 'Focus'}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={(rating / 7) * 100} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-700">Key Strengths</CardTitle>
                <p className="text-gray-600">Areas where Jon excels as a leader</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {strengths && strengths.map((strength, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{strength.title}</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {strength.rating}/7
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{strength.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Category:</strong> {strength.category}
                      </p>
                      {strength.evidence && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Evidence:</strong> {strength.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Development Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-orange-700">Development Opportunities</CardTitle>
                <p className="text-gray-600">Areas for continued growth and improvement</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {developmentAreas && developmentAreas.map((area, index) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{area.title}</h4>
                        <Badge variant="outline" className={area.priority === 'High' ? 'border-red-500 text-red-700' : 'border-orange-500 text-orange-700'}>
                          {area.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{area.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">Recommendations:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {area.suggestions && area.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {area.impact && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <strong>Expected Impact:</strong> {area.impact}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Themes and Anonymous Feedback */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {statistics?.keyThemes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Key Feedback Themes</CardTitle>
                  <p className="text-gray-600">Most frequently mentioned topics across all responses</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.keyThemes.map((theme, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        theme.sentiment === 'positive' ? 'bg-green-50 border-green-200' : 
                        theme.sentiment === 'development' ? 'bg-orange-50 border-orange-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{theme.theme}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {theme.frequency}x
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {theme.sentiment}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {statistics?.anonymousFeedbackHighlights && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Anonymous Feedback Highlights</CardTitle>
                  <p className="text-gray-600">Key insights from team member responses</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.anonymousFeedbackHighlights.slice(0, 6).map((feedback, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start space-x-2">
                          <Quote className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-700 italic">{feedback}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>This report was generated using the SyncShift 360 competency framework</p>
            <p>All responses are anonymous and GDPR compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
