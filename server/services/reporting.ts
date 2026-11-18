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
  tierType: "organisation" | "leadership" | "function" | "team";
  tierName: string;
  leaderCount: number;
  thresholdCleared: boolean;
  totalResponsesCollected: number;
  highestDiscrepancyDimensions: string[];
  cohort: Array<{
    leaderId: number;
    leaderName: string;
    email: string;
    department: string;
    teamName: string;
    position: string;
    cycleId: number | null;
    responseCount: number;
    selfAvg: number;
    stakeholderAvg: number;
    delta: number;
  }>;
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

/** Returns the average raw score across a response's answers (skips non-numeric). */
function averageResponseScores(responses: any): number {
  const list: Array<{ value: any }> =
    typeof responses === "string" ? JSON.parse(responses) : (responses as any) || [];
  const scores = list.map((i) => parseInt(i.value)).filter((v) => !isNaN(v));
  if (scores.length === 0) return 0;
  return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
}

/**
 * Builds the per-leader roster for a macro tier: one row per assessed leader with their
 * cycle id (for drill-down), response count, self-average, stakeholder-average and delta.
 * Uses the leader's most recent cycle in scope for the drill-down link.
 */
function buildCohortRoster(targetUsers: any[], cycles: any[], responses: any[]): any[] {
  const respByCycle: Record<number, any[]> = {};
  for (const r of responses) {
    (respByCycle[r.cycleId] = respByCycle[r.cycleId] || []).push(r);
  }
  // Per leader: pick the newest cycle in scope so drill-down targets a real report.
  const newestCyclePerLeader: Record<number, any> = {};
  for (const c of cycles) {
    if (!c.leaderId) continue;
    const cur = newestCyclePerLeader[c.leaderId];
    if (!cur || new Date(c.createdAt || 0) > new Date(cur.createdAt || 0)) newestCyclePerLeader[c.leaderId] = c;
  }

  return targetUsers.map((u) => {
    const cycle = newestCyclePerLeader[u.id];
    const cycResp = cycle ? respByCycle[cycle.id] || [] : [];
    let selfSum = 0, extSum = 0, selfN = 0, extN = 0;
    for (const r of cycResp) {
      const isSelf = r.respondentRelationship?.toLowerCase() === "self";
      const score = averageResponseScores(r.responses);
      if (isSelf) { selfSum += score; selfN++; } else { extSum += score; extN++; }
      // Only count externally-derived scores toward stakeholder average (self excluded)
    }
    return {
      leaderId: u.id,
      leaderName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      email: u.email,
      department: u.department || "",
      teamName: u.teamName || "",
      position: u.position || "",
      cycleId: cycle?.id ?? null,
      responseCount: cycResp.length,
      selfAvg: selfN > 0 ? Number((selfSum / selfN).toFixed(2)) : 0,
      stakeholderAvg: extN > 0 ? Number((extSum / extN).toFixed(2)) : 0,
      delta: extN > 0 && selfN > 0 ? Number(((extSum / extN) - (selfSum / selfN)).toFixed(2)) : 0,
    };
  });
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
  tierType: "organisation" | "leadership" | "function" | "team", 
  identifierValue?: string
): Promise<MacroTierReportData> {
  
  let targetUsers = await db.select().from(users).where(eq(users.organizationId, orgId));
  
  // Leadership group = the org's assessed leaders, optionally narrowed to a named leadership cohort (team_name)
  if (tierType === "leadership") {
    targetUsers = targetUsers.filter(u => u.role === 'leader' || u.role === 'org_admin' || u.role === 'company_admin');
    if (identifierValue) {
      targetUsers = targetUsers.filter(u => u.teamName?.toLowerCase() === identifierValue.toLowerCase());
    }
  } else if (tierType === "team" && identifierValue) {
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

  // Scope cycles correctly per tier:
  // - 'organisation': all of the org's cycles (org-wide aggregation)
  // - 'function'/'team'/'leadership': only the cycles of the filtered leaders, so a
  //   department/team report aggregates only that group's responses, not the whole org.
  const isOrgWide = tierType === "organisation";
  const activeCycles = isOrgWide
    ? await db.select().from(surveyCycles).where(eq(surveyCycles.organizationId, orgId))
    : await db.select().from(surveyCycles).where(inArray(surveyCycles.leaderId, leaderIds));
  // Include cycles where the leader record belongs to this org but the cycle references a leader
  // whose user row lives under another org (legacy/migrated data) — counted for org-wide only.
  const cycleIdsSet = new Set(activeCycles.map(c => c.id));
  if (isOrgWide && leaderIds.length > 0) {
    const extra = await db.select().from(surveyCycles).where(inArray(surveyCycles.leaderId, leaderIds));
    for (const c of extra) cycleIdsSet.add(c.id);
  }
  const cycleIds = Array.from(cycleIdsSet);

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
    highestDiscrepancyDimensions: Object.entries(compiledPillars as Record<string, { name: string; blindspotDelta: number }>)
      .map(([key, p]) => ({ key, abs: Math.abs(p.blindspotDelta ?? 0), name: p.name }))
      .sort((a, b) => b.abs - a.abs)
      .slice(0, 3)
      .map((d) => d.name),
    cohort: buildCohortRoster(targetUsers, activeCycles, allResponses),
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
