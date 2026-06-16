import { db } from "../db";
import { surveyCycles, surveyResponses, users, organizations } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

// Define the 6 explicit dimensions matching the SyncShift Framework
export const SYNCSHIFT_DIMENSIONS = [
  "direction", // Direction & Sense-Making
  "systems",   // Systems & Delivery
  "purpose",   // Purpose & Authenticity
  "skills",    // Skills & Agility
  "team",      // Team & Norms
  "impact"     // Impact & Reputation
];

export interface AggregatedReportData {
  cycleId: number;
  title: string;
  totalResponses: number;
  anonymityThresholdCleared: boolean;
  dimensions: {
    [key: string]: {
      name: string;
      selfScore: number;       // Intent / Personal Capability Levers
      externalScore: number;   // Impact / Systemic Alignment Outcomes
      delta: number;           // Perception Gap Vector
      isSuppressed: boolean;   // Protected by Anonymity Guardrail
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
      leaderSelfAvg: number;       // Collective self-perception
      stakeholderAvg: number;      // Collective operational reality
      blindspotDelta: number;      // Self vs External Alignment Gap
      cohesionVariance: number;    // Internal tier consistency score (Lower = Highly Cohesive)
    };
  };
  functionalFrictionIndex?: Array<{
    deptA: string;
    deptB: string;
    frictionDelta: number;        // Mathematical variance between departments
  }>;
}

/**
 * Helper function to instantiate an empty statistical accumulator
 */
function createDimensionAccumulator() {
  return {
    direction: { name: "Direction & Sense-Making", selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    systems:   { name: "Systems & Delivery",       selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    purpose:   { name: "Purpose & Authenticity",   selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    skills:    { name: "Skills & Agility",          selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    team:      { name: "Team & Norms",              selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] },
    impact:    { name: "Impact & Reputation",       selfSum: 0, selfCount: 0, extSum: 0, extCount: 0, selfScores: [] as number[] }
  };
}

/**
 * Computes standard variance to measure Team/Functional cohesion limits
 */
function calculateVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumOfSquares = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return Number((sumOfSquares / values.length).toFixed(2));
}

/**
 * 1:1 Individual Leader Interleaved Matrix Report Generator
 */
export async function generateSyncShiftReportData(cycleId: number): Promise<AggregatedReportData> {
  const [cycle] = await db.select().from(surveyCycles).where(eq(surveyCycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("Survey cycle deployment not found.");

  const allResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));

  const selfGroup = allResponses.filter(r => r.respondentRelationship?.toLowerCase() === 'self');
  const externalGroup = allResponses.filter(r => r.respondentRelationship?.toLowerCase() !== 'self');

  const totalExternalCount = externalGroup.length;
  const clearAnonymity = totalExternalCount >= 3;

  const dimensionAccumulator = createDimensionAccumulator();

  allResponses.forEach((response) => {
    const answersList: Array<{ questionId: any; type: string; value: any }> = 
      typeof response.responses === 'string' ? JSON.parse(response.responses) : (response.responses as any) || [];

    answersList.forEach((item) => {
      const qId = parseInt(item.questionId);
      const score = parseInt(item.value);
      
      if (isNaN(qId) || isNaN(score)) return;

      const dimensionKey = SYNCSHIFT_DIMENSIONS[(qId - 1) % 6];
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
    if (shouldSuppress) {
      finalExt = 0; 
    }

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
 * MACRO ENGINE: Compiles Team, Function, and Org alignment reports using Delta Maps
 */
export async function generateMacroTierReport(
  orgId: number, 
  tierType: "team" | "function" | "organisation", 
  identifierValue?: string
): Promise<MacroTierReportData> {
  
  // 1. Fetch relevant target user profiles within scope boundaries
  let targetUsers = await db.select().from(users).where(eq(users.organizationId, orgId));
  
  if (tierType === "team" && identifierValue) {
    targetUsers = targetUsers.filter(u => u.teamName?.toLowerCase() === identifierValue.toLowerCase());
  } else if (tierType === "function" && identifierValue) {
    targetUsers = targetUsers.filter(u => u.department?.toLowerCase() === identifierValue.toLowerCase());
  }

  const leaderIds = targetUsers.map(u => u.id);
  
  // Rule: High trust parameters require a minimum of 5 leaders to compile a macro tier matrix
  const thresholdCleared = leaderIds.length >= 5;

  if (leaderIds.length === 0) {
    throw new Error(`No active data sources tracked under the target parameters: ${identifierValue || 'All'}`);
  }

  // 2. Extract corresponding survey cycle tokens
  const activeCycles = await db.select().from(surveyCycles).where(inArray(surveyCycles.leaderId, leaderIds));
  const cycleIds = activeCycles.map(c => c.id);

  let allResponses: any[] = [];
  if (cycleIds.length > 0) {
    allResponses = await db.select().from(surveyResponses).where(inArray(surveyResponses.cycleId, cycleIds));
  }

  const accumulator = createDimensionAccumulator();

  // 3. Process data loops into dimensional matrices
  allResponses.forEach((response) => {
    const answersList: Array<{ questionId: any; type: string; value: any }> = 
      typeof response.responses === 'string' ? JSON.parse(response.responses) : (response.responses as any) || [];

    answersList.forEach((item) => {
      const qId = parseInt(item.questionId);
      const score = parseInt(item.value);
      if (isNaN(qId) || isNaN(score)) return;

      const dimensionKey = SYNCSHIFT_DIMENSIONS[(qId - 1) % 6];
      const isSelf = response.respondentRelationship?.toLowerCase() === 'self';

      if (dimensionKey && accumulator[dimensionKey as keyof typeof accumulator]) {
        const target = accumulator[dimensionKey as keyof typeof accumulator];
        if (isSelf) {
          target.selfSum += score;
          target.selfCount += 1;
          target.selfScores.push(score); // Kept for calculating Cohesion Variance scores
        } else {
          target.extSum += score;
          target.extCount += 1;
        }
      }
    });
  });

  // 4. Assemble Delta Mapping Vectors
  const compiledPillars: any = {};
  SYNCSHIFT_DIMENSIONS.forEach((key) => {
    const data = accumulator[key as keyof typeof accumulator];
    
    // Safety fallback boundaries for non-released metadata parameters
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

  // 5. Compute Systemic Functional Friction Matrix maps if compiling Organization level reviews
  if (tierType === "organisation" && thresholdCleared) {
    const departmentsList = Array.from(new Set(targetUsers.map(u => u.department).filter(Boolean))) as string[];
    const frictionMap: Array<{ deptA: string; deptB: string; frictionDelta: number }> = [];

    // Calculate alignment variances across tracking department permutations
    for (let i = 0; i < departmentsList.length; i++) {
      for (let j = i + 1; j < departmentsList.length; j++) {
        const deptA = departmentsList[i];
        const deptB = departmentsList[j];

        // Fetch department profiles
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
