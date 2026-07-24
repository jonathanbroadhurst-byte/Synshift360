import { db } from "../db";
import { surveyCycles, surveyResponses, users, organizations } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

// 1. UPDATE TO THE NEW 7 EXPLICIT DIMENSIONS
export const SYNCSHIFT_DIMENSIONS = [
  "direction",    // Direction & Sense-Making (Metrics 1, 7)
  "systems",      // Systems & Delivery (Metric 5)
  "purpose",      // Purpose & Authenticity (Metrics 2, 10)
  "skills",       // Skills & Agility (Metrics 3, 12)
  "team",         // Team & Norms (Metrics 4, 8)
  "impact",       // Impact & Reputation (Metrics 6, 11, 9)
  "cross_level"   // Cross-Level Alignment (Metric 13)
];

export interface AggregatedReportData {
  cycleId: number;
  title: string;
  totalResponses: number;
  anonymityThresholdCleared: boolean;
  dimensions: {
    [key: string]: {
      name: string;
      selfScore: number;
      externalScore: number;
      delta: number;
      isSuppressed: boolean;
    };
  };
  rawBreakdown: any[];
}

export interface MacroTierReportData {
  tierType: "team" | "function" | "organisation";
  tierName: string;
  leaderCount: number;
  thresholdCleared: boolean;
  totalResponsesCollected: number;
  pillars: {
    [key: string]: {
      name: string;
      leaderSelfAvg: number;
      stakeholderAvg: number;
      blindspotDelta: number;
      cohesionVariance: number;
    };
  };
  functionalFrictionIndex?: Array<{
    deptA: string;
    deptB: string;
    frictionDelta: number;
  }>;
}

/**
 * 2. EXPANDED ACCUMULATOR FOR 7 DIMENSIONS
 */
function createDimensionAccumulator() {
  return {
    direction:   { name: "Direction & Sense-Making", selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    systems:     { name: "Systems & Delivery",       selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    purpose:     { name: "Purpose & Authenticity",   selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    skills:      { name: "Skills & Agility",         selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    team:        { name: "Team & Norms",             selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    impact:      { name: "Impact & Reputation",      selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    cross_level: { name: "Cross-Level Alignment",    selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] }
  };
}

/**
 * MAPPING FUNCTION: Safely routes any metric ID directly to its designated dimension
 */
function mapMetricToDimension(qId: string | number): string | null {
  // Converts "metric_1" or "1" into an integer cleanly
  const idStr = String(qId).replace('metric_', '');
  const idNum = parseInt(idStr);

  switch (idNum) {
    case 1: case 7: return "direction";
    case 5: return "systems";
    case 2: case 10: return "purpose";
    case 3: case 12: return "skills";
    case 4: case 8: return "team";
    case 6: case 9: case 11: return "impact";
    case 13: return "cross_level";
    default: return null;
  }
}

function calculateVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumOfSquares = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return Number((sumOfSquares / values.length).toFixed(2));
}

/**
 * 1:1 INDIVIDUAL REPORT GENERATOR
 */
export async function generateSyncShiftReportData(cycleId: number): Promise<AggregatedReportData> {
  const [cycle] = await db.select().from(surveyCycles).where(eq(surveyCycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("Survey cycle deployment not found.");

  const allResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));

  const externalGroup = allResponses.filter(r => r.respondentRelationship?.toLowerCase() !== 'self');
  const clearAnonymity = externalGroup.length >= 3;

  const dimensionAccumulator = createDimensionAccumulator();

  allResponses.forEach((response) => {
    const answersList: Array<{ questionId: any; type: string; value: any }> = 
      typeof response.responses === 'string' ? JSON.parse(response.responses) : (response.responses as any) || [];

    answersList.forEach((item) => {
      const score = parseInt(item.value);
      if (isNaN(score)) return;

      // 3. EXPLICIT MAPPING RATHER THAN MODULO MATH
      const dimensionKey = mapMetricToDimension(item.questionId);
      const isSelf = response.respondentRelationship?.toLowerCase() === 'self';

      if (dimensionKey && dimensionAccumulator[dimensionKey as keyof typeof dimensionAccumulator]) {
        const target = dimensionAccumulator[dimensionKey as keyof typeof dimensionAccumulator];
        if (isSelf) {
          target.selfSum += score;
          target.selfCount += 1;
        } else {
          target.extSum += score;
          target.extCount += 1;
        }
      }
    });
  });

  const finalizedDimensions: any = {};
  
  SYNCSHIFT_DIMENSIONS.forEach((key) => {
    const data = dimensionAccumulator[key as keyof typeof dimensionAccumulator];
    
    const finalSelf = data.selfCount > 0 ? Number((data.selfSum / data.selfCount).toFixed(2)) : 0;
    let finalExt = data.extCount > 0 ? Number((data.extSum / data.extCount).toFixed(2)) : 0;
    
    const shouldSuppress = !clearAnonymity;
    if (shouldSuppress) finalExt = 0; 

    finalizedDimensions[key] = {
      name: data.name,
      selfScore: finalSelf,
      externalScore: finalExt,
      delta: shouldSuppress ? 0 : Number((finalExt - finalSelf).toFixed(2)),
      isSuppressed: shouldSuppress
    };
  });

  return {
    cycleId: cycle.id,
    title: cycle.title,
    totalResponses: allResponses.length,
    anonymityThresholdCleared: clearAnonymity,
    dimensions: finalizedDimensions,
    rawBreakdown: allResponses.map(r => ({
      id: r.id,
      relationship: r.respondentRelationship,
      submittedAt: r.submittedAt
    }))
  };
}

/**
 * MACRO ENGINE: Compiles Team, Function, and Org alignment reports
 */
export async function generateMacroTierReport(
  orgId: number, 
  tierType: "team" | "function" | "organisation", 
  identifierValue?: string
): Promise<MacroTierReportData> {
  
  let targetUsers = await db.select().from(users).where(eq(users.organizationId, orgId));
  
  if (tierType === "team" && identifierValue) {
    targetUsers = targetUsers.filter(u => u.teamName?.toLowerCase() === identifierValue.toLowerCase());
  } else if (tierType === "function" && identifierValue) {
    targetUsers = targetUsers.filter(u => u.department?.toLowerCase() === identifierValue.toLowerCase());
  }

  const leaderIds = targetUsers.map(u => u.id);

  // Read custom threshold from environment variables, fallback securely to 5
  const minCohortSize = process.env.MIN_COHORT_SIZE ? parseInt(process.env.MIN_COHORT_SIZE, 10) : 5;
  const thresholdCleared = leaderIds.length >= minCohortSize;

  if (!thresholdCleared) {
    throw new Error(
      `Insufficient active data sources (${leaderIds.length}/${minCohortSize} required) under the target parameters: ${identifierValue || 'All'}`
    );
  }

  const activeCycles = await db.select().from(surveyCycles).where(inArray(surveyCycles.leaderId, leaderIds));
  const cycleIds = activeCycles.map(c => c.id);

  let allResponses: any[] = [];
  if (cycleIds.length > 0) {
    allResponses = await db.select().from(surveyResponses).where(inArray(surveyResponses.cycleId, cycleIds));
  }

  const accumulator = createDimensionAccumulator();

  allResponses.forEach((response) => {
    const answersList: Array<{ questionId: any; type: string; value: any }> = 
      typeof response.responses === 'string' ? JSON.parse(response.responses) : (response.responses as any) || [];

    answersList.forEach((item) => {
      const score = parseInt(item.value);
      if (isNaN(score)) return;

      // 4. EXPLICIT MACRO METRIC MAPPING
      const dimensionKey = mapMetricToDimension(item.questionId);
      const isSelf = response.respondentRelationship?.toLowerCase() === 'self';

      if (dimensionKey && accumulator[dimensionKey as keyof typeof accumulator]) {
        const target = accumulator[dimensionKey as keyof typeof accumulator];
        if (isSelf) {
          target.selfSum += score;
          target.selfCount += 1;
          target.selfScores.push(score); 
        } else {
          target.extSum += score;
          target.extCount += 1;
        }
      }
    });
  });

  const compiledPillars: any = {};
  SYNCSHIFT_DIMENSIONS.forEach((key) => {
    const data = accumulator[key as keyof typeof accumulator];
    const avgSelf = data.selfCount > 0 ? Number((data.selfSum / data.selfCount).toFixed(2)) : 0;
    const avgExt = data.extCount > 0 ? Number((data.extSum / data.extCount).toFixed(2)) : 0;

    compiledPillars[key] = {
      name: data.name,
      leaderSelfAvg: thresholdCleared ? avgSelf : 0,
      stakeholderAvg: thresholdCleared ? avgExt : 0,
      blindspotDelta: thresholdCleared ? Number((avgExt - avgSelf).toFixed(2)) : 0,
      cohesionVariance: thresholdCleared ? calculateVariance(data.selfScores) : 0
    };
  });

  const reportPayload: MacroTierReportData = {
    tierType,
    tierName: identifierValue || "Organization Wide",
    leaderCount: leaderIds.length,
    thresholdCleared,
    totalResponsesCollected: allResponses.length,
    pillars: compiledPillars
  };

  if (tierType === "organisation" && thresholdCleared) {
    const departmentsList = Array.from(new Set(targetUsers.map(u => u.department).filter(Boolean))) as string[];
    const frictionMap: Array<{ deptA: string; deptB: string; frictionDelta: number }> = [];

    for (let i = 0; i < departmentsList.length; i++) {
      for (let j = i + 1; j < departmentsList.length; j++) {
        const deptA = departmentsList[i];
        const deptB = departmentsList[j];

        const leadersA = targetUsers.filter(u => u.department === deptA).map(u => u.id);
        const leadersB = targetUsers.filter(u => u.department === deptB).map(u => u.id);

        const cyclesA = activeCycles.filter(c => leadersA.includes(c.leaderId || 0)).map(c => c.id);
        const cyclesB = activeCycles.filter(c => leadersB.includes(c.leaderId || 0)).map(c => c.id);

        const scoresA = allResponses.filter(r => cyclesA.includes(r.cycleId || 0)).flatMap(r => 
          (typeof r.responses === 'string' ? JSON.parse(r.responses) : r.responses || []).map((a: any) => parseInt(a.value))
        ).filter(v => !isNaN(v));

        const scoresB = allResponses.filter(r => cyclesB.includes(r.cycleId || 0)).flatMap(r => 
          (typeof r.responses === 'string' ? JSON.parse(r.responses) : r.responses || []).map((a: any) => parseInt(a.value))
        ).filter(v => !isNaN(v));

        const avgA = scoresA.length > 0 ? scoresA.reduce((a, b) => a + b, 0) / scoresA.length : 0;
        const avgB = scoresB.length > 0 ? scoresB.reduce((a, b) => a + b, 0) / scoresB.length : 0;

        frictionMap.push({
          deptA,
          deptB,
          frictionDelta: Number(Math.abs(avgA - avgB).toFixed(2))
        });
      }
    }
    reportPayload.functionalFrictionIndex = frictionMap;
  }

  return reportPayload;
}
