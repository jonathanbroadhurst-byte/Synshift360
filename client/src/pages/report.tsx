import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { RequireAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Users, Target, BarChart3, Download, Quote, Info, BookOpen, Brain } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

// Competency explanations for SyncShift 360 framework
const competencyExplanations: Record<string, {
  emoji: string;
  title: string;
  importance: string;
  description: string;
  keyBehaviors: string[];
}> = {
  Leadership: {
    emoji: "🌀",
    title: "Leadership (Direction & Sense-Making)",
    importance: "Essential for creating clarity and inspiring others toward shared goals. Leaders who excel here help teams understand the 'why' behind their work and navigate change effectively.",
    description: "The ability to communicate vision, influence through trust, and help others make sense of complex situations. This competency is fundamental to all leadership roles as it establishes direction and creates meaning.",
    keyBehaviors: ["Clear vision communication", "Influencing through credibility", "Change explanation", "Active listening"]
  },
  Infrastructure: {
    emoji: "🏗️",
    title: "Infrastructure (Systems & Delivery)",
    importance: "Critical for operational excellence and team productivity. Leaders strong in this area create the frameworks and processes that enable consistent high performance.",
    description: "The capacity to build effective systems, delegate appropriately, and optimize workflows. This competency ensures that good intentions translate into sustainable results.",
    keyBehaviors: ["Accountability systems", "Process optimization", "Effective delegation", "Workflow management"]
  },
  Motives: {
    emoji: "🔍",
    title: "Motives (Purpose & Authenticity)",
    importance: "Foundational for trust and psychological safety. Leaders who demonstrate authenticity and strong values create environments where people can do their best work.",
    description: "The demonstration of integrity, self-awareness, and genuine care for others. This competency builds the trust foundation that makes all other leadership behaviors more effective.",
    keyBehaviors: ["Values-based actions", "Self-awareness", "Psychological safety", "Emotional regulation"]
  },
  Capabilities: {
    emoji: "⚡",
    title: "Capabilities (Skills & Agility)",
    importance: "Vital for continuous improvement and adaptability in changing environments. Leaders with strong capabilities model growth mindset and develop others.",
    description: "The commitment to learning, problem-solving excellence, and developing others' skills. This competency ensures leaders and their teams stay relevant and effective.",
    keyBehaviors: ["Curious problem-solving", "Learning orientation", "Coaching skills", "Adaptability"]
  },
  Culture: {
    emoji: "🤝",
    title: "Culture (Team & Norms)",
    importance: "Essential for team effectiveness and engagement. Leaders who build positive culture create environments where collaboration thrives and people feel valued.",
    description: "The ability to build trust, encourage collaboration, and establish healthy team dynamics. This competency directly impacts team performance and retention.",
    keyBehaviors: ["Trust building", "Inclusive collaboration", "Regular feedback", "Cultural alignment"]
  },
  "Personal Brand": {
    emoji: "🌟",
    title: "Personal Brand (Impact & Reputation)",
    importance: "Critical for organizational influence and career advancement. Leaders with strong personal brands can advocate effectively for their teams and drive change.",
    description: "The development of executive presence, relationship-building skills, and consistent follow-through. This competency amplifies a leader's impact across the organization.",
    keyBehaviors: ["Executive presence", "Relationship building", "Reliable delivery", "Professional reputation"]
  },
  Alignment: {
    emoji: "🗝️",
    title: "Alignment (Outcome)",
    importance: "The ultimate leadership outcome - ensuring all elements work together smoothly. Leaders who create alignment maximize team effectiveness and minimize friction.",
    description: "The continuous effort to align people, systems, and purpose for optimal performance. This competency represents the synthesis of all other leadership capabilities.",
    keyBehaviors: ["System synchronization", "Friction identification", "Proactive realignment", "Flow optimization"]
  }
};

// HBDI-aligned learning activities for different development areas
const hbdiLearningActivities: Record<string, {
  A: string[];
  B: string[];
  C: string[];
  D: string[];
}> = {
  "Strategic Leadership": {
    A: ["Analytical frameworks workshops", "Data-driven decision making courses", "Strategic planning methodologies", "ROI analysis training"],
    B: ["Project management certification", "Process mapping workshops", "Implementation planning training", "Systematic approach to strategy execution"],
    C: ["Leadership communication programs", "Stakeholder engagement workshops", "Team inspiration techniques", "Vision crafting sessions"],
    D: ["Innovation thinking workshops", "Future scenario planning", "Creative strategy sessions", "Disruptive thinking training"]
  },
  "Delegation": {
    A: ["Authority matrix development", "Decision rights frameworks", "Performance metrics design", "Accountability systems training"],
    B: ["Process documentation workshops", "Standard operating procedures", "Task breakdown methodologies", "Quality control systems"],
    C: ["Trust building exercises", "One-on-one conversation skills", "Coaching and mentoring training", "Empowerment communication workshops"],
    D: ["Experimentation frameworks", "Innovation delegation models", "Creative problem-solving empowerment", "Entrepreneurial thinking development"]
  },
  "Communication": {
    A: ["Data presentation skills", "Evidence-based communication", "Analytical storytelling", "Metrics communication workshops"],
    B: ["Structured communication frameworks", "Meeting facilitation training", "Documentation best practices", "Process communication systems"],
    C: ["Emotional intelligence training", "Interpersonal communication skills", "Active listening workshops", "Empathy building exercises"],
    D: ["Creative presentation techniques", "Storytelling workshops", "Visual communication training", "Innovation communication methods"]
  },
  "Executive Presence": {
    A: ["Executive decision-making frameworks", "Board presentation skills", "Financial acumen development", "Strategic thinking workshops"],
    B: ["Professional development programs", "Executive etiquette training", "Systematic leadership approaches", "Organizational protocol training"],
    C: ["Executive coaching", "Relationship building workshops", "Influence and persuasion training", "Networking skills development"],
    D: ["Thought leadership development", "Creative leadership approaches", "Innovation leadership training", "Visionary communication workshops"]
  }
};

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

  const statistics = typeof (report as any).statistics === 'string' ? JSON.parse((report as any).statistics) : (report as any).statistics;
  const strengths = typeof (report as any).strengths === 'string' ? JSON.parse((report as any).strengths) : (report as any).strengths;
  const developmentAreas = typeof (report as any).developmentAreas === 'string' ? JSON.parse((report as any).developmentAreas) : (report as any).developmentAreas;

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
                  {(report as any).title?.includes('Jon Smith') ? 'Jon Smith' : 'Sarah Johnson'} • Leadership Assessment • Generated {new Date((report as any).generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {(report as any).status}
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
                {(report as any).executiveSummary}
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
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{competencyExplanations[competency]?.emoji}</span>
                            <span className="font-medium text-gray-800 text-sm">{competency}</span>
                          </div>
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

          {/* Competency Framework Explanations */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Understanding the SyncShift 360 Framework
              </CardTitle>
              <p className="text-gray-600">What each competency means and why it matters for high-performing leaders</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {statistics?.competencyAverages && Object.keys(statistics.competencyAverages).map((competency) => {
                  const explanation = competencyExplanations[competency];
                  const rating = statistics.competencyAverages[competency];
                  if (!explanation) return null;
                  
                  return (
                    <div key={competency} className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{explanation.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{explanation.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm font-medium text-blue-600">Your Score: {rating}/7</span>
                              <Badge variant="secondary" className={`text-xs ${rating >= 5.5 ? 'bg-green-100 text-green-800' : rating >= 4.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {rating >= 5.5 ? 'Strong' : rating >= 4.5 ? 'Development' : 'Focus Area'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                          <p className="text-sm font-medium text-blue-900 mb-1">Why This Matters:</p>
                          <p className="text-sm text-blue-800">{explanation.importance}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-700">{explanation.description}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Key Behaviors:</p>
                          <div className="flex flex-wrap gap-1">
                            {explanation.keyBehaviors.map((behavior: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {behavior}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  {strengths && strengths.map((strength: any, index: number) => (
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
                <CardTitle className="text-xl text-orange-700 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Development Opportunities
                </CardTitle>
                <p className="text-gray-600">Areas for continued growth with HBDI-aligned learning activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {developmentAreas && developmentAreas.map((area: any, index: number) => {
                    // Extract key development theme for HBDI mapping
                    const developmentTheme = area.title.includes('Strategic') || area.title.includes('Vision') ? 'Strategic Leadership' :
                                           area.title.includes('Delegation') || area.title.includes('Empowerment') ? 'Delegation' :
                                           area.title.includes('Communication') || area.title.includes('Executive Presence') ? 'Communication' :
                                           area.title.includes('Executive Presence') ? 'Executive Presence' :
                                           'Communication'; // Default fallback
                    
                    const hbdiActivities = hbdiLearningActivities[developmentTheme];
                    
                    return (
                      <div key={index} className="border-l-4 border-orange-500 pl-4 bg-gradient-to-r from-orange-50 to-white p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{area.title}</h4>
                          <Badge variant="outline" className={area.priority === 'High' ? 'border-red-500 text-red-700' : 'border-orange-500 text-orange-700'}>
                            {area.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{area.description}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800 mb-2">General Recommendations:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {area.suggestions && area.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {hbdiActivities && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center mb-3">
                                <Brain className="w-4 h-4 mr-2 text-blue-600" />
                                <p className="text-sm font-semibold text-blue-900">HBDI Learning Activities</p>
                              </div>
                              <p className="text-xs text-blue-700 mb-3">Choose activities that match your thinking preferences:</p>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                                  <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <p className="text-xs font-semibold text-gray-800">Analytical (A)</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {hbdiActivities.A.slice(0, 2).map((activity: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="bg-white rounded p-3 border-l-4 border-green-500">
                                  <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <p className="text-xs font-semibold text-gray-800">Practical (B)</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {hbdiActivities.B.slice(0, 2).map((activity: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="bg-white rounded p-3 border-l-4 border-orange-500">
                                  <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                    <p className="text-xs font-semibold text-gray-800">Relational (C)</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {hbdiActivities.C.slice(0, 2).map((activity: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="bg-white rounded p-3 border-l-4 border-purple-500">
                                  <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                    <p className="text-xs font-semibold text-gray-800">Experimental (D)</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {hbdiActivities.D.slice(0, 2).map((activity: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {area.impact && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-800">
                              <strong>Expected Impact:</strong> {area.impact}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    {statistics.keyThemes.map((theme: any, index: number) => (
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
                    {statistics.anonymousFeedbackHighlights.slice(0, 6).map((feedback: string, index: number) => (
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
