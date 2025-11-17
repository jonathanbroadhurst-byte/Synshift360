// Quantum Leadership Calibration 360 Scoring Engine

export interface CompetencyScore {
  competency: string;
  averageScore: number;
  selfScore?: number;
  othersScore?: number;
  maturityLevel: string;
  questionScores: number[];
}

export interface QuantumReport {
  leaderId: number;
  leaderName: string;
  overallAverage: number;
  overallMaturityLevel: string;
  competencyScores: CompetencyScore[];
  selfVsOthersGap: number;
  deploymentLevel: string;
  ninBoxPosition: { x: number; y: number; quadrant: string };
  strengths: string[];
  developmentAreas: string[];
}

const MATURITY_LEVELS = {
  Reactive: { min: 1, max: 3, description: "Reactive leadership - responds to immediate challenges" },
  Transitional: { min: 4, max: 6, description: "Transitional leadership - building new capabilities" },
  Adaptive: { min: 7, max: 8, description: "Adaptive leadership - proactive and flexible" },
  Quantum: { min: 9, max: 10, description: "Quantum leadership - transformative and visionary" }
};

const COMPETENCIES = [
  "Cognitive Agility",
  "Trust Intelligence",
  "Systems Awareness",
  "Adaptive Communication",
  "Emotional Regulation & Resilience",
  "Ethical Anchoring",
  "Coherence Leadership",
  "Change Navigation",
  "Creative Problem Solving & Innovation",
  "Human Energy Stewardship"
];

export function calculateMaturityLevel(score: number): string {
  if (score >= 9) return "Quantum";
  if (score >= 7) return "Adaptive";
  if (score >= 4) return "Transitional";
  return "Reactive";
}

export function calculateDeploymentLevel(overallScore: number, responseCount: number): string {
  // Deployment level based on organizational engagement
  // High engagement + high score = full deployment
  // This is a simplified model - can be enhanced based on business logic
  
  if (responseCount >= 10 && overallScore >= 7) return "Full Deployment";
  if (responseCount >= 5 && overallScore >= 5) return "Partial Deployment";
  if (responseCount >= 3 && overallScore >= 4) return "Early Stage";
  return "Limited Deployment";
}

export function calculate9BoxPosition(maturityLevel: string, deploymentLevel: string): { x: number; y: number; quadrant: string } {
  // 9-box grid: X-axis = Deployment, Y-axis = Maturity
  const maturityY: Record<string, number> = {
    "Quantum": 3,
    "Adaptive": 2,
    "Transitional": 1,
    "Reactive": 0
  };

  const deploymentX: Record<string, number> = {
    "Full Deployment": 3,
    "Partial Deployment": 2,
    "Early Stage": 1,
    "Limited Deployment": 0
  };

  const x = deploymentX[deploymentLevel] || 0;
  const y = maturityY[maturityLevel] || 0;

  // Determine quadrant
  let quadrant = "Developing";
  if (x >= 2 && y >= 2) quadrant = "High Performing";
  else if (x >= 2 && y < 2) quadrant = "Scaling";
  else if (x < 2 && y >= 2) quadrant = "Emerging Leader";
  
  return { x, y, quadrant };
}

export function processQuantumResponses(responses: any[], surveyQuestions: any): QuantumReport {
  // Group responses by competency
  const competencyData: Record<string, { scores: number[]; selfScores: number[]; otherScores: number[] }> = {};
  
  COMPETENCIES.forEach(competency => {
    competencyData[competency] = { scores: [], selfScores: [], otherScores: [] };
  });

  // Process each response
  responses.forEach(response => {
    const responseData = response.responses;
    const isSelf = responseData.raterType === 'self';

    Object.entries(responseData.answers || {}).forEach(([questionId, score]) => {
      // Find which competency this question belongs to
      const competency = findCompetencyForQuestion(questionId, surveyQuestions);
      if (competency && competencyData[competency]) {
        competencyData[competency].scores.push(Number(score));
        if (isSelf) {
          competencyData[competency].selfScores.push(Number(score));
        } else {
          competencyData[competency].otherScores.push(Number(score));
        }
      }
    });
  });

  // Calculate competency scores
  const competencyScores: CompetencyScore[] = COMPETENCIES.map(competency => {
    const data = competencyData[competency];
    const averageScore = data.scores.length > 0
      ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      : 0;
    
    const selfScore = data.selfScores.length > 0
      ? data.selfScores.reduce((a, b) => a + b, 0) / data.selfScores.length
      : undefined;
    
    const othersScore = data.otherScores.length > 0
      ? data.otherScores.reduce((a, b) => a + b, 0) / data.otherScores.length
      : undefined;

    return {
      competency,
      averageScore: Number(averageScore.toFixed(2)),
      selfScore: selfScore ? Number(selfScore.toFixed(2)) : undefined,
      othersScore: othersScore ? Number(othersScore.toFixed(2)) : undefined,
      maturityLevel: calculateMaturityLevel(averageScore),
      questionScores: data.scores
    };
  });

  // Calculate overall metrics
  const overallAverage = competencyScores.reduce((sum, c) => sum + c.averageScore, 0) / COMPETENCIES.length;
  const overallMaturityLevel = calculateMaturityLevel(overallAverage);
  const deploymentLevel = calculateDeploymentLevel(overallAverage, responses.length);
  const ninBoxPosition = calculate9BoxPosition(overallMaturityLevel, deploymentLevel);

  // Calculate self vs others gap
  const selfScores = competencyScores.filter(c => c.selfScore !== undefined).map(c => c.selfScore!);
  const otherScores = competencyScores.filter(c => c.othersScore !== undefined).map(c => c.othersScore!);
  const avgSelf = selfScores.length > 0 ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length : 0;
  const avgOthers = otherScores.length > 0 ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length : 0;
  const selfVsOthersGap = Number((avgSelf - avgOthers).toFixed(2));

  // Identify strengths and development areas
  const sortedByScore = [...competencyScores].sort((a, b) => b.averageScore - a.averageScore);
  const strengths = sortedByScore.slice(0, 3).map(c => c.competency);
  const developmentAreas = sortedByScore.slice(-3).reverse().map(c => c.competency);

  return {
    leaderId: 0, // Will be set by caller
    leaderName: "", // Will be set by caller
    overallAverage: Number(overallAverage.toFixed(2)),
    overallMaturityLevel,
    competencyScores,
    selfVsOthersGap,
    deploymentLevel,
    ninBoxPosition,
    strengths,
    developmentAreas
  };
}

function findCompetencyForQuestion(questionId: string, surveyQuestions: any): string | null {
  // Parse question ID to find competency
  // Format: "competency_name_1", "competency_name_2", etc.
  for (const item of surveyQuestions) {
    const competency = item.competency;
    const competencyId = competency.toLowerCase().replace(/\s+/g, '_');
    if (questionId.startsWith(competencyId)) {
      return competency;
    }
  }
  return null;
}
