import { db } from "../db";
import { responses, surveyCycles, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Define the 6 explicit dimensions matching the SyncShift Framework 
export const SYNCSHIFT_DIMENSIONS = [
  "direction", // Direction & Sense-Making [cite: 6]
  "systems",   // Systems & Delivery [cite: 20]
  "purpose",   // Purpose & Authenticity [cite: 31]
  "skills",    // Skills & Agility [cite: 42]
  "team",      // Team & Norms [cite: 53]
  "impact"     // Impact & Reputation [cite: 64]
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

/**
 * Computes the 1:1 Interleaved Matrix for the SyncShift Spiral Model
 */
export async function generateSyncShiftReportData(cycleId: number): Promise<AggregatedReportData> {
  // 1. Fetch Cycle Context
  const [cycle] = await db.select().from(surveyCycles).where(eq(surveyCycles.id, cycleId)).limit(1);
  if (!cycle) throw new Error("Survey cycle deployment not found.");

  // 2. Fetch All Submitted Responses for this specific loop
  const allResponses = await db.select().from(responses).where(eq(responses.surveyCycleId, cycleId));

  // 3. Segment Responses into Distinct Rater Group Cohorts
  const selfGroup = allResponses.filter(r => r.respondentRelationship?.toLowerCase() === 'self');
  const externalGroup = allResponses.filter(r => r.respondentRelationship?.toLowerCase() !== 'self');

  const totalExternalCount = externalGroup.length;
  // Rule: Multi-rater safety requires a minimum threshold of 3 external submissions to prevent exposure
  const clearAnonymity = totalExternalCount >= 3;

  // Initialize data accumulator matrices
  const dimensionAccumulator: {
    [key: string]: { name: string; selfSum: number; selfCount: number; extSum: number; extCount: number }
  } = {
    direction: { name: "Direction & Sense-Making", selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }, [cite: 6]
    systems:   { name: "Systems & Delivery",       selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }, [cite: 20]
    purpose:   { name: "Purpose & Authenticity",   selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }, [cite: 31]
    skills:    { name: "Skills & Agility",         selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }, [cite: 42]
    team:      { name: "Team & Norms",             selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }, [cite: 53]
    impact:    { name: "Impact & Reputation",      selfSum: 0, selfCount: 0, extSum: 0, extCount: 0 }  [cite: 64]
  };

  // 4. Run the Modulo-6 Interleaved Matrix Processor over all answers
  allResponses.forEach((response) => {
    // Assume response.answers payload structure: Array of { questionId: number, score: number }
    const answersList: Array<{ questionId: number; score: number }> = 
      typeof response.answers === 'string' ? JSON.parse(response.answers) : (response.answers as any) || [];

    answersList.forEach(({ questionId, score }) => {
      // Apply the Interleaved Modulo Sorter Formula: (ID - 1) % 6
      const dimensionKey = SYNCSHIFT_DIMENSIONS[(questionId - 1) % 6];
      const isSelf = response.respondentRelationship?.toLowerCase() === 'self';

      if (dimensionKey && dimensionAccumulator[dimensionKey]) {
        if (isSelf) {
          dimensionAccumulator[dimensionKey].selfSum += Number(score);
          dimensionAccumulator[dimensionKey].selfCount += 1;
        } else {
          dimensionAccumulator[dimensionKey].extSum += Number(score);
          dimensionAccumulator[dimensionKey].extCount += 1;
        }
      }
    });
  });

  // 5. Build Compiled Summary Payload and Compute Deltas
  const finalizedDimensions: any = {};
  
  SYNCSHIFT_DIMENSIONS.forEach((key) => {
    const data = dimensionAccumulator[key];
    
    const finalSelf = data.selfCount > 0 ? Number((data.selfSum / data.selfCount).toFixed(2)) : 0;
    let finalExt = data.extCount > 0 ? Number((data.extSum / data.extCount).toFixed(2)) : 0;
    
    // Apply Confidentiality Suppression Layer if threshold bounds are violated
    const shouldSuppress = !clearAnonymity && key !== 'self';
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
