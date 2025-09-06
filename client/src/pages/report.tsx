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

// Learning activities for different development areas organized by learning approach
const learningActivities: Record<string, {
  analytical: string[];
  systematic: string[];
  interpersonal: string[];
  creative: string[];
}> = {
  "Strategic Leadership": {
    analytical: [
      "Complete Harvard Business School's Strategy Execution course with quarterly business case analysis",
      "Attend McKinsey Problem Solving workshop focusing on hypothesis-driven strategic planning",
      "Enroll in Financial Times Strategic Management program with ROI modeling exercises",
      "Join Stanford Executive Program on Data-Driven Strategy with competitor analysis projects"
    ],
    systematic: [
      "Obtain PMP certification with focus on strategic project portfolio management",
      "Complete Lean Six Sigma Black Belt training applied to strategic initiative deployment",
      "Attend Franklin Covey's 4 Disciplines of Execution workshop with 90-day implementation plan",
      "Enroll in MIT's Systems Thinking course with organizational change management application"
    ],
    interpersonal: [
      "Join Dale Carnegie's Leadership Training with peer coaching circles for vision communication",
      "Attend Center for Creative Leadership's stakeholder engagement intensive with 360 feedback",
      "Complete John Maxwell Team leadership certification with monthly mentoring sessions",
      "Enroll in Wharton's Executive Presence program focusing on inspiring others during change"
    ],
    creative: [
      "Attend IDEO Design Thinking for Leaders workshop with innovation challenge project",
      "Complete Stanford d.school's Strategic Innovation course with prototype development",
      "Join Singularity University's Future Studies program with scenario planning exercises",
      "Enroll in MIT's Innovation Leadership course with disruptive business model creation"
    ]
  },
  "Delegation": {
    analytical: [
      "Develop RACI matrix for all team responsibilities with quarterly effectiveness reviews",
      "Create decision authority frameworks using McKinsey's RAPID model with success metrics",
      "Implement OKR (Objectives and Key Results) system with delegation scorecards",
      "Design performance dashboard tracking delegation outcomes with monthly analysis"
    ],
    systematic: [
      "Attend Getting Things Done (GTD) methodology workshop with team delegation workflows",
      "Complete Project Management Institute's delegation certification with standard procedures",
      "Enroll in Lean Leadership training focusing on value stream delegation methods",
      "Implement Scrum Master certification with agile delegation practices and retrospectives"
    ],
    interpersonal: [
      "Join Center for Creative Leadership's Trust Building program with team coaching sessions",
      "Complete coaching certification (ICF-accredited) with weekly one-on-one practice sessions",
      "Attend Crucial Conversations training focusing on empowerment discussions",
      "Enroll in emotional intelligence certification with delegation confidence building exercises"
    ],
    creative: [
      "Create innovation delegation lab with experimental project assignments and learning reviews",
      "Design entrepreneurship challenges for team members with mentorship and failure celebrations",
      "Implement 'Innovation Time Off' program (like Google's 20% time) with creative project guidance",
      "Establish cross-functional collaboration experiments with rotating leadership opportunities"
    ]
  },
  "Communication": {
    analytical: [
      "Complete Presentation Zen methodology with data storytelling workshops and audience analysis",
      "Attend Evidence-Based Communication course with persuasion psychology and metrics tracking",
      "Enroll in Business Writing certification focusing on executive briefings and impact measurement",
      "Join Toastmasters Advanced program with speech contest participation and feedback analysis"
    ],
    systematic: [
      "Implement structured meeting facilitation training with agenda templates and outcome tracking",
      "Complete documentation best practices certification with knowledge management systems",
      "Attend Franklin Covey's communication planning workshop with systematic feedback loops",
      "Enroll in project communication methodology course with stakeholder mapping and cadence design"
    ],
    interpersonal: [
      "Complete Daniel Goleman's Emotional Intelligence certification with active listening practice labs",
      "Join Dale Carnegie's Interpersonal Skills course with peer practice groups and role-playing",
      "Attend Nonviolent Communication (NVC) training with conflict resolution practice sessions",
      "Enroll in Cultural Intelligence (CQ) certification with diverse team communication exercises"
    ],
    creative: [
      "Attend TED Masterclass on public speaking with storytelling techniques and video practice",
      "Complete Second City's improvisation workshop for spontaneous communication and adaptability",
      "Join visual communication design course with infographic creation and presentation design",
      "Enroll in digital storytelling workshop with multimedia content creation and engagement metrics"
    ]
  },
  "Executive Presence": {
    analytical: [
      "Complete Wharton Executive Presence program with 360 assessment and quantified improvement plan",
      "Attend board presentation skills workshop with financial modeling and investor pitch practice",
      "Enroll in strategic thinking certification with case study analysis and decision frameworks",
      "Join McKinsey Executive Communication course with data-driven influence and metrics tracking"
    ],
    systematic: [
      "Complete professional development certification with systematic skill building and milestone tracking",
      "Attend executive etiquette and protocol training with international business culture modules",
      "Enroll in systematic leadership development program with competency assessments and coaching",
      "Join organizational behavior course with leadership framework implementation and measurement"
    ],
    interpersonal: [
      "Hire executive coach (minimum 6 months) with monthly 360 feedback and relationship mapping",
      "Join peer executive mastermind group with monthly networking and influence practice",
      "Complete negotiation and persuasion training with role-play scenarios and stakeholder practice",
      "Attend networking mastery workshop with relationship building strategies and follow-up systems"
    ],
    creative: [
      "Develop thought leadership platform with content creation, speaking engagements, and media training",
      "Join creative leadership intensive with innovative problem-solving and visionary communication",
      "Complete personal branding workshop with digital presence optimization and storytelling",
      "Attend design thinking for executives with innovation leadership and creative collaboration methods"
    ]
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
            <CardContent className="p-8">
              {/* Large Centered Radar Chart */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Leadership Competency Profile</h3>
                    <p className="text-sm text-gray-600">Interactive radar chart showing performance across all competency areas</p>
                  </div>
                  
                  <div className="w-full h-96 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        data={statistics?.competencyAverages ? Object.entries(statistics.competencyAverages).map(([name, value]) => ({ 
                          name: name === "Personal Brand" ? "Personal\nBrand" : name,
                          value: Number(value),
                          fullMark: 7 
                        })) : []}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                      >
                        <defs>
                          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="70%" stopColor="#1d4ed8" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#1e40af" stopOpacity={0.1} />
                          </radialGradient>
                          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                          <filter id="dropShadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1"/>
                          </filter>
                        </defs>
                        
                        <PolarGrid 
                          stroke="#e5e7eb" 
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          radialLines={true}
                        />
                        
                        <PolarAngleAxis 
                          dataKey="name" 
                          tick={false}
                        />
                        
                        <PolarRadiusAxis 
                          domain={[0, 7]} 
                          tick={{ 
                            fontSize: 11, 
                            fill: '#6b7280',
                            fontWeight: 500
                          }}
                          tickCount={8}
                          angle={90}
                          stroke="#d1d5db"
                          strokeWidth={1}
                        />
                        
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke="url(#radarStroke)"
                          fill="url(#radarFill)"
                          strokeWidth={3}
                          dot={{
                            fill: '#2563eb',
                            strokeWidth: 3,
                            stroke: '#ffffff',
                            r: 5,
                            filter: 'url(#dropShadow)'
                          }}
                          activeDot={{
                            fill: '#dc2626',
                            strokeWidth: 3,
                            stroke: '#ffffff',
                            r: 7
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <div className="bg-gray-50 rounded-lg px-4 py-2 border">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700"></div>
                          <span className="text-sm font-medium text-gray-700">Your Performance</span>
                        </div>
                        <div className="text-sm text-gray-500">•</div>
                        <div className="text-sm text-gray-600">Scale: 1 (Needs Focus) → 7 (Exceptional)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competency Scores Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics?.competencyAverages && Object.entries(statistics.competencyAverages).map(([competency, rating]) => (
                  <div key={competency} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{competencyExplanations[competency]?.emoji}</span>
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">{competency}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {competencyExplanations[competency]?.title.split('(')[1]?.replace(')', '')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{rating}/7</div>
                        <Badge variant="secondary" className={`text-xs ${rating >= 5.5 ? 'bg-green-100 text-green-800' : rating >= 4.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {rating >= 5.5 ? 'Strong' : rating >= 4.5 ? 'Developing' : 'Focus Area'}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={(rating / 7) * 100} className="h-2" />
                  </div>
                ))}
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
                <p className="text-gray-600">Areas for continued growth with targeted learning approaches</p>
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
                    
                    const activities = learningActivities[developmentTheme];
                    
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

                          {activities && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center mb-3">
                                <Brain className="w-4 h-4 mr-2 text-blue-600" />
                                <p className="text-sm font-semibold text-blue-900">Targeted Learning Activities</p>
                              </div>
                              <p className="text-xs text-blue-700 mb-3">Choose specific development approaches that match your learning style:</p>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                                  <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <p className="text-xs font-semibold text-gray-800">Data-Driven Approach</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {activities.analytical.slice(0, 2).map((activity: string, idx: number) => (
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
                                    <p className="text-xs font-semibold text-gray-800">Process-Focused Approach</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {activities.systematic.slice(0, 2).map((activity: string, idx: number) => (
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
                                    <p className="text-xs font-semibold text-gray-800">People-Centered Approach</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {activities.interpersonal.slice(0, 2).map((activity: string, idx: number) => (
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
                                    <p className="text-xs font-semibold text-gray-800">Innovation-Focused Approach</p>
                                  </div>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {activities.creative.slice(0, 2).map((activity: string, idx: number) => (
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
