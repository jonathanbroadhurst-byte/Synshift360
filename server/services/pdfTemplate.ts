import { AggregatedReportData } from "./reporting";

/**
 * Dynamically computes a high-fidelity, gradient-filled visual SVG radar chart
 * Upgraded to support a 7-spoke heptagonal framework blueprint.
 */
function generateRadarSVG(dimensions: any): string {
  const cx = 250;
  const cy = 230; // Adjusted slightly to allow space for top labels
  const rMax = 140;
  // Expanded to include the 7 dynamic keys matching the reporting engine
  const keys = ["direction", "systems", "purpose", "skills", "team", "impact", "cross_level"];
  
  const valToR = (val: number) => (val / 7.0) * rMax;

  // Compute points for both datasets
  const compPts: string[] = [];
  const alignPts: string[] = [];

  keys.forEach((key, i) => {
    // Calculated using a strict 7-slice angular layout (51.43 degrees offset)
    const angle = i * (2 * Math.PI / 7) - (Math.PI / 2);
    const dim = dimensions[key];
    
    // Personal Competency Levers (Intent Line)
    const rComp = valToR(dim?.selfScore || 0);
    compPts.push(`${cx + rComp * Math.cos(angle)},${cy + rComp * Math.sin(angle)}`);
    
    // Systemic Alignment Outcomes (Impact Line - respects suppression safety bounds)
    const rAlign = valToR(dim?.isSuppressed ? 0 : dim?.externalScore || 0);
    alignPts.push(`${cx + rAlign * Math.cos(angle)},${cy + rAlign * Math.sin(angle)}`);
  });

  // Render concentric ring webs for a 7-spoke heptagon grid
  let webGrid = "";
  for (let level = 1; level <= 7; level++) {
    const pts: string[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = i * (2 * Math.PI / 7) - (Math.PI / 2);
      const r = valToR(level);
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    webGrid += `  <polygon points="${pts.join(" ")}" fill="none" stroke="#E2E8F0" stroke-width="1" />\n`;
  }

  // Render axis labels and ray spokes
  let axisElements = "";
  const displayNames = [
    "Direction & Sense-Making",
    "Systems & Delivery",
    "Purpose & Authenticity",
    "Skills & Agility",
    "Team & Norms",
    "Impact & Reputation",
    "Cross-Level Alignment"
  ];

  keys.forEach((key, i) => {
    const angle = i * (2 * Math.PI / 7) - (Math.PI / 2);
    const r = valToR(7);
    axisElements += `  <line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="4,4" />\n`;
    
    const labelR = r + 24;
    const lx = cx + labelR * Math.cos(angle);
    let ly = cy + labelR * Math.sin(angle);
    
    let anchor = "middle";
    if (Math.cos(angle) > 0.1) anchor = "start";
    else if (Math.cos(angle) < -0.1) anchor = "end";
    
    if (Math.abs(Math.sin(angle)) < 0.1) ly += 4;
    else if (Math.sin(angle) > 0.5) ly += 12;
    else ly -= 4;

    axisElements += `  <text x="${lx}" y="${ly}" font-family='Arial' font-size='10' font-weight='bold' fill='#0A192F' text-anchor='${anchor}'>${displayNames[i]}</text>\n`;
  });

  return `
  <svg viewBox="0 0 500 470" width="100%" height="420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D97706" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.05" />
      </linearGradient>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.05" />
      </linearGradient>
    </defs>
    ${webGrid}
    ${axisElements}
    
    <!-- Render Solid Data Polybounds -->
    <polygon points="${compPts.join(" ")}" fill="url(#goldGrad)" stroke="#D97706" stroke-width="3" stroke-linejoin="round" />
    <polygon points="${alignPts.join(" ")}" fill="url(#blueGrad)" stroke="#1E3A8A" stroke-width="3" stroke-linejoin="round" />
    
    <circle cx="${cx}" cy="${cy}" r="4" fill="#0A192F" />

    <!-- Inline Modern Legend Bar Map -->
    <g transform="translate(110, 445)">
      <rect x="0" y="0" width="12" height="12" rx="3" fill="#D97706" />
      <text x="18" y="10" font-family="Arial" font-size="9.5" font-weight="bold" fill="#475569">Leadership Intent (Self)</text>
      
      <rect x="160" y="0" width="12" height="12" rx="3" fill="#1E3A8A" />
      <text x="178" y="10" font-family="Arial" font-size="9.5" font-weight="bold" fill="#475569">Systemic Impact (Stakeholders)</text>
    </g>
  </svg>`;
}

/**
 * Evaluates live numerical deltas and returns clean, high-impact context commentary
 */
function getDynamicExplanation(key: string, self: number, ext: number, isSuppressed: boolean): string {
  if (isSuppressed) {
    return "Detailed stakeholder consensus metrics are currently hidden on this dimension to protect respondent anonymity.";
  }

  const delta = ext - self;

  // Injected the 4 new metrics completely into the text analyzer blocks
  const commentaryBank: Record<string, { blindspot: string; aligned: string; positive: string }> = {
    direction: {
      blindspot: "Your leadership has developed a strategic transmission drift. While you feel you regularly connect tasks to the corporate vision, your team is executing in a context vacuum. They experience their daily tasks as purely transactional, unable to see how their immediate workload contributes to the organization's broader purpose.",
      aligned: "Your vision transmission parameters are highly synchronized. The strategic objectives you intentionally broadcast mirror the exact execution priorities recognized across your active department teams.",
      positive: "Your organizational network demonstrates extreme strategic resonance. Your operational teams absorb, own, and champion the long-term strategic map at a level that outpaces your personal assumptions."
    },
    systems: {
      blindspot: "An operational breakdown point is developing. While you prioritize high-level management, your teams indicate that basic execution frameworks, task tracking, or feedback loops are missing. This gap forces staff to invent workarounds, causing major day-to-day workflow drag.",
      aligned: "Operational delivery infrastructures are highly stable. The workflow routines, task handoffs, and accountability loops you have configured allow departments to run cleanly without management dependencies.",
      positive: "Your execution parameters are running with exceptional autonomy. Teams value and lean on your operational guardrails even higher than your estimation, using them to deliver consistent outcomes with near-zero friction."
    },
    purpose: {
      blindspot: "Your leadership has developed a strategic transmission drift. While you feel you regularly connect tasks to the corporate vision, your team is executing in a context vacuum. They experience their daily tasks as purely transactional, unable to see how their immediate workload contributes to the organization's broader purpose.",
      aligned: "Your strategic purpose transmission is beautifully synchronized. The macro vision you broadcast maps directly into the daily operational meaning experienced by your team on the ground.",
      positive: "Your department has achieved complete purpose resonance. Your team owns, articulates, and derives deep personal meaning from the corporate vision at a level that completely outpaces your assumptions."
    },
    skills: {
      blindspot: "A structural risk-aversion default has set in. While you believe you are encouraging new ideas, your team experiences a distinct psychological safety vacuum. They do not feel empowered to take calculated risks or iterate quickly because they perceive that past failures carry a penalties premium.",
      aligned: "Your developmental sandbox is highly stable. You successfully balance operational delivery with a safe psychological space, giving your team the functional confidence to experiment, fail forward, and iterate swiftly.",
      positive: "Your department has established an exceptional high-trust innovation loop. Your team actively treats failures as pure navigation data, aggressively piloting fresh concepts and adapting to changes with absolute autonomy."
    },
    team: {
      blindspot: "A structural risk-aversion default has set in. While you believe you are encouraging new ideas, your team experiences a distinct psychological safety vacuum. They do not feel empowered to take calculated risks or iterate quickly because they perceive that past failures carry a penalties premium. Sub-groups are context-hoarding, creating communication friction[cite: 2].",
      aligned: "Internal group norms are deeply cohesive. Teams practice healthy mutual support parameters, ensuring open cross-functional communication balances cleanly against performance requirements.",
      positive: "Your department operations have achieved complete high-velocity alignment. Teams resolve complex issues autonomously, driving collective accountability loops that remove cross-department friction completely."
    },
    impact: {
      blindspot: "An execution bottleneck is actively stalling your velocity. While you believe your goals are clear and strategically sound, your team's operational feedback indicates a target mismatch. Priorities are either conflicting or poorly defined, causing the team to consistently miss key milestones despite high effort.",
      aligned: "Your execution parameters are tightly locked. The measurable goals you establish are perfectly matched to your strategic priorities, allowing your team to predictably and consistently hit their operational targets.",
      positive: "Your team demonstrates elite execution velocity. Because you align work cleanly with overarching priorities, your team operates with near-zero friction, consistently outpacing and exceeding all macro performance baselines."
    },
    cross_level: {
      blindspot: "A severe cross-functional silo warning is active. While you believe your team's goals are cleanly integrated across the wider enterprise, your immediate peers and reports experience major boundary friction. Your objectives are isolated, causing dropped handoffs and resource tension with neighboring departments.",
      aligned: "Your cross-functional boundary parameters are highly secure. Your team’s objectives are cleanly linked and transparently visible to other parts of the organization, preventing internal drag during joint operations.",
      positive: "Your department operates with complete cross-enterprise integration. Your workflow handoffs are entirely seamless, and your team autonomously co-engineers objectives with neighboring business units to remove systemic friction across the entire enterprise matrix."
    }
  };

  const pool = commentaryBank[key] || commentaryBank["direction"];
  if (delta <= -1.0) return pool.blindspot;
  if (delta >= 1.0) return pool.positive;
  return pool.aligned;
}

const DIMENSION_NAMES: Record<string, string> = {
  direction: "Direction & Sense-Making",
  systems: "Systems & Delivery",
  purpose: "Purpose & Authenticity",
  skills: "Skills & Agility",
  team: "Team & Norms",
  impact: "Impact & Reputation",
  cross_level: "Cross-Level Alignment",
};

/**
 * Concrete, plain-language coaching actions for each dimension, tuned by delta direction.
 * Returns a short array of recommended behaviors for the leader.
 */
function getRecommendedActions(key: string, self: number, ext: number, isSuppressed: boolean): string[] {
  if (isSuppressed) return ["Collect more stakeholder feedback before acting — fewer than 3 external responses are currently available."];
  const delta = ext - self;

  const bank: Record<string, { building: string[]; aligned: string[]; bridge: string[] }> = {
    direction: {
      building: [
        "Run one 'why does this matter' briefing per quarter: map every active team goal back to the organisation's top 3 strategic priorities and get the team to restate the connection in their own words.",
        "Start each 1:1 with 60 seconds on the bigger picture before diving into tasks, so daily work isn't experienced as purely transactional.",
        "Ask 2–3 trusted stakeholders what 'good direction' looks like to them, and mirror their language when setting priorities."
      ],
      aligned: [
        "Keep your current cadence — it's landing. Formalise it so it survives busy periods, e.g. a short monthly 'strategy to work' recap you reuse.",
        "Add one deliberate 'sense-making' moment: invite the team to challenge the plan and test whether the direction still holds."
      ],
      bridge: [
        "You're being clear — make sure it's heard. Add a visual one-page 'where we're headed' that the team owns and can re-say to others.",
        "Consider reversing the flow: ask the team what they think the strategy is first, then correct gaps — this surfaces how well direction actually transmits."
      ]
    },
    systems: {
      building: [
        "Audit one core workflow end-to-end with the people who run it; identify the single biggest friction point and remove it in the next two weeks.",
        "Introduce a lightweight, visible task tracker and a simple weekly 'where are we stuck' loop so teams stop inventing workarounds.",
        "Delegate end-to-end ownership of one process to a team member and hold them accountable for making it smoother."
      ],
      aligned: [
        "Maintain the guardrails you have — they're holding. Codify the most successful routine so it doesn't depend on you personally.",
        "Pick one recurring task and map its handoffs to confirm no hidden dependency or single point of failure."
      ],
      bridge: [
        "Your systems work — ensure others know how to use them. A short 'how we deliver' playbook turns your personal routines into shared infrastructure.",
        "Test one process by removing yourself from it and see whether the team can run it without you."
      ]
    },
    purpose: {
      building: [
        "Hold a 'line of sight' session: get each person to say how their role links to the mission, and co-write the missing links together.",
        "Share a decision you made, plus the values behind it, so the team can see authenticity in action.",
        "Ask what people genuinely care about at work and reflect it in how you communicate the team's purpose."
      ],
      aligned: [
        "Your purpose messaging is resonating — capitalise by making it more frequent and more personal.",
        "Capture one example of the mission coming alive in your team and share it internally to reinforce meaning."
      ],
      bridge: [
        "The team already feels purpose — give them credit for it publicly and let them lead the storytelling.",
        "Check you aren't over-claiming: invite a 'what still feels hollow' conversation to ground the purpose in reality."
      ]
    },
    skills: {
      building: [
        "Normalise 'intelligent failure': share one of your own mistakes publicly and what you learned, to signal that failing forward is safe.",
        "Protect a recurring 'experiment slot' where the team can test an idea with a sandboxed budget and zero blame on negative results.",
        "Coach one team member through a stretch task rather than doing it for them, reinforcing their capability to iterate."
      ],
      aligned: [
        "Your developmental space is a strength — keep baking it into delivery so experimentation survives deadlines.",
        "Identify one person who thrives on risk and give them a visible innovation remit."
      ],
      bridge: [
        "The team feels safer than you assume — harness that trust by raising the ambition of the experiments you invite.",
        "Turn one successful pilot into a repeatable process others can adopt."
      ]
    },
    team: {
      building: [
        "Run a team 'norms and safety' check-in: what honestly happens when someone makes a mistake? Co-create a shared rule that removes blame and adds learning.",
        "Break one silo: pair sub-groups on a shared deliverable and rotate communication, so context stops being hoarded.",
        "Give explicit, specific praise for risk-taking, not just results, in your next team meeting."
      ],
      aligned: [
        "Your team cohesion is strong — maintain it by making the psychological-safety message explicit and regular.",
        "Rotate meeting facilitation so ownership of healthy norms spreads beyond you."
      ],
      bridge: [
        "It's working — guard it. Protect the 'no blame' cadence during high-pressure periods when it's most likely to erode.",
        "Check for hidden sub-groups: extend your open communication loop to quieter corners of the team."
      ]
    },
    impact: {
      building: [
        "Re-grade priorities with the team: cut or reprioritise anything ambiguous so effort maps to the agreed milestones.",
        "Publish a simple 'we committed to X' ladder and track progress visibly each week, so goals can't drift.",
        "Ask a stakeholder what 'winning' looks like to them, then align your next milestone to it directly."
      ],
      aligned: [
        "Your execution is on-target — make the wins visible to build momentum and external reputation.",
        "Identify the next level of ambition: what would a step-function improvement look like?"
      ],
      bridge: [
        "You're delivering more than your reputation reflects — amplify it. Share wins proactively with leadership and peers.",
        "Occasionally widen your circle: let stakeholders see how priorities connect to your results."
      ]
    },
    cross_level: {
      building: [
        "Map one joint initiative with a neighbouring team and make everyone's objectives visible to both sides; resolve the biggest boundary friction together.",
        "Institute a 'dependants board' so handoffs are explicit and neither side drops the ball.",
        "Set up a monthly or fortnightly check-in with the leaders of adjacent functions to pre-empt resource tension."
      ],
      aligned: [
        "Your cross-functional alignment is a strength — keep objectives visible and shared across boundaries.",
        "Model the behaviour: volunteer one of your objectives to be jointly owned with a partner team."
      ],
      bridge: [
        "The connection that exists is real — make it explicit and durable rather than personal, so it survives line-drawing.",
        "Extend the transparent-objectives practice to one more team you touch, to widen the alignment surface."
      ]
    }
  };

  const pool = bank[key] || bank["direction"];
  if (delta <= -1.0) return pool.building;
  if (delta >= 1.0) return pool.bridge;
  return pool.aligned;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Compiles the raw dynamic dashboard HTML string matching the SyncShift brand identity
 */
export function compileSyncShiftHtmlReport(data: AggregatedReportData, leaderName: string, orgName: string): string {
  const radarSvg = generateRadarSVG(data.dimensions);
  const dims = data.dimensions;

  // Compute an overall posture + strengths/priorities so the report gives real feedback.
  const dimEntries = Object.keys(dims).map((key) => ({ key, ...dims[key] }));
  const cleared = dimEntries.filter((d) => !d.isSuppressed);
  const avgDelta = cleared.length ? cleared.reduce((a, d) => a + (d.externalScore - d.selfScore), 0) / cleared.length : 0;
  const maxSingle = cleared.length ? Math.max(...cleared.map((d) => Math.abs(d.externalScore - d.selfScore))) : 0;

  let posture: string;
  let postureTone = "aligned";
  if (!data.anonymityThresholdCleared) {
    posture = "Awaiting more stakeholder feedback before a reliable posture can be assigned.";
  } else if (avgDelta <= -0.8) {
    posture = `This profile shows a clear self-overestimation pattern — on average stakeholders rate this leader ${Math.abs(avgDelta).toFixed(1)} points below their own self-rating. The leadership intent is present, but it is landing short of its intended impact.`;
    postureTone = "negative";
  } else if (avgDelta >= 0.8) {
    posture = "Stakeholders rate this leader higher than they rate themselves — a history of under-claiming. The capability is real and valued; the work is to own and amplify it.";
  } else if (maxSingle >= 1.0) {
    posture = "Generally well-aligned, but with one or two pockets where perception meaningfully diverges. Prioritise the specific dimensions flagged below rather than a broad overhaul.";
  } else {
    posture = "Well-aligned overall — self-rating and stakeholder experience are within a healthy margin on most dimensions. Maintain the behaviours that earned this consistency.";
  }

  // Strengths = top 3 external scores (cleared); priorities = top 3 by |gap| (cleared, gap>0.5).
  const strengths = [...cleared].sort((a, b) => (b.externalScore || 0) - (a.externalScore || 0)).slice(0, 3);
  const priorities = [...cleared]
    .filter((d) => Math.abs(d.externalScore - d.selfScore) >= 0.5)
    .sort((a, b) => Math.abs(b.externalScore - b.selfScore) - Math.abs(a.externalScore - a.selfScore))
    .slice(0, 3);

  const execSummary = `
    <div class="page-break"></div>
    <div class="page-container">
      <h1>Executive Summary</h1>
      <div class="summary-panel">
        <p>${posture}</p>
      </div>
      ${cleared.length ? `
        <p>Across the 7 SyncShift dimensions the average perception gap is <strong>${avgDelta > 0 ? '+' : ''}${avgDelta.toFixed(2)}</strong> on the 1–7 scale. The largest single gap is <strong>${maxSingle.toFixed(2)}</strong>.</p>
        <h2>What's working</h2>
        <p>${strengths.length ? strengths.map((d) => `<strong>${d.name}</strong> (stakeholders ${d.externalScore}/7)`).join(" · ") : "Not enough cleared data to identify strengths yet."}</p>
        <h2>What to prioritise</h2>
        <p>${priorities.length ? priorities.map((d, i) => `${i + 1}. <strong>${d.name}</strong> — gap of ${(d.externalScore - d.selfScore) > 0 ? '+' : ''}${(d.externalScore - d.selfScore).toFixed(2)} (${DIMENSION_NAMES[d.key]})`).join("<br/>") : "No significant perception gaps detected — maintain the current approach and re-assess next cycle."}</p>
      ` : `<p>${posture}</p>`}
    </div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SyncShift Executive 360 - ${leaderName}</title>
<style>
  @page {
    size: A4;
    margin: 22mm 20mm;
    @bottom-right { content: "Page " counter(page); font-family: -apple-system, sans-serif; font-size: 8.5pt; color: #94A3B8; }
    @bottom-left { content: "SyncShift Alignment Framework — Executive 360°"; font-family: -apple-system, sans-serif; font-size: 8.5pt; color: #94A3B8; font-weight: bold; }
  }
  @page:first { background-color: #0A192F; margin: 0; @bottom-right { content: none; } @bottom-left { content: none; } }
  
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #334155; background-color: #FFFFFF; line-height: 1.6; font-size: 10.5pt; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  
  /* COVER GRAPHICS */
  .cover-wrapper { padding: 60mm 25mm 25mm 25mm; height: 297mm; position: relative; box-sizing: border-box; background-color: #0A192F; color: #F8FAFC; }
  .cover-accent-line { width: 30mm; height: 4px; background-color: #D97706; margin-bottom: 8mm; }
  .cover-title { font-size: 34pt; font-weight: bold; color: #F8FAFC; line-height: 1.15; margin: 0 0 5mm 0; letter-spacing: -0.5px; }
  .cover-subtitle { font-size: 12pt; color: #94A3B8; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
  .cover-meta-table { width: calc(100% - 50mm); position: absolute; bottom: 40mm; left: 25mm; border-collapse: collapse; }
  .cover-meta-table td { padding: 10px 0; border-bottom: 1px solid #1E293B; font-size: 11pt; }
  .cover-meta-label { color: #64748B; width: 35%; text-transform: uppercase; letter-spacing: 1.5px; font-size: 8.5pt; font-weight: bold; }
  .cover-meta-value { color: #E2E8F0; font-weight: bold; }
  
  /* LAYOUT STRUCTURES */
  .page-break { page-break-before: always; }
  .page-container { padding: 10mm 5mm; }
  h1 { font-size: 22pt; color: #0A192F; border-bottom: 2px solid #F1F5F9; padding-bottom: 4mm; margin-top: 0; margin-bottom: 6mm; page-break-after: avoid; font-weight: 800; letter-spacing: -0.5px; }
  h2 { font-size: 14pt; color: #1E3A8A; margin-top: 8mm; margin-bottom: 4mm; page-break-after: avoid; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  p { margin-top: 0; margin-bottom: 5mm; color: #475569; text-align: justify; }
  .summary-panel { background-color: #F8FAFC; border-left: 4px solid #1E3A8A; padding: 6mm 7mm; margin-bottom: 8mm; border-radius: 0 6px 6px 0; }
  .summary-panel p { margin: 0; font-size: 10.5pt; color: #334155; }
  .center-container { text-align: center; margin: 8mm 0; page-break-inside: avoid; }
  
  /* CORE PILLAR BLOCKS */
  .pillar-block { margin-bottom: 6mm; border: 1px solid #E2E8F0; border-radius: 12px; padding: 6mm; page-break-inside: avoid; background: #FFFFFF; }
  .pillar-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 3mm; margin-bottom: 4mm; }
  .pillar-title { font-size: 12pt; font-weight: 800; color: #0A192F; }
  .gap-badge { font-size: 8.5pt; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
  .gap-negative { background-color: #FFE4E6; color: #9F1239; }
  .gap-aligned { background-color: #DCFCE7; color: #166534; }
  
  /* SYSTEMIC HORIZON METRICS */
  .bar-chart-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
  .bar-chart-table td { padding: 6px 0; vertical-align: middle; }
  .bar-label { width: 160px; font-size: 8.5pt; color: #64748B; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .bar-bg { width: 100%; background-color: #F1F5F9; height: 12px; border-radius: 6px; overflow: hidden; }
  .bar-fill-comp { background-color: #D97706; height: 12px; border-radius: 6px; }
  .bar-fill-align { background-color: #1E3A8A; height: 12px; border-radius: 6px; }
  .bar-val { width: 50px; text-align: right; font-size: 11pt; font-weight: 800; color: #1E293B; }
  
  /* ANALYSIS CONTAINER CELLS */
  .diagnostic-container { margin-top: 4mm; padding-top: 3mm; border-top: 1px dashed #E2E8F0; }
  .diagnostic-subtitle { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #0A192F; margin-bottom: 1mm; letter-spacing: 0.5px; }
  .diagnostic-text { font-size: 10pt; color: #475569; line-height: 1.5; text-align: justify; }
</style>
</head>
<body>

  <div class="cover-wrapper">
    <div class="cover-accent-line"></div>
    <h1 class="cover-title">The SyncShift Profile</h1>
    <div class="cover-subtitle">Leadership Capability &amp; System Alignment Scan</div>
    
    <table class="cover-meta-table">
      <tr><td class="cover-meta-label">Prepared For</td><td class="cover-meta-value">${leaderName}</td></tr>
      <tr><td class="cover-meta-label">Organisation</td><td class="cover-meta-value">${orgName}</td></tr>
      <tr><td class="cover-meta-label">Diagnostic Baseline</td><td class="cover-meta-value">SyncShift Interleaved Dual-Line Core Matrix (7-Dimension Criteria)</td></tr>
      <tr><td class="cover-meta-label">Total Responses</td><td class="cover-meta-value">${data.totalResponses} submissions</td></tr>
    </table>
  </div>

  <div class="page-break"></div>
  <div class="page-container">
    <h1>Understanding Your SyncShift Profile</h1>
    <p>High performance is never static. It spirals upward when people, systems, and purpose stay in sync. When these elements drift apart, organizations experience friction, execution drag, and lost momentum.</p>
    <p>This diagnostic profile unbundles your personal leadership execution vectors and balances them directly against how your surrounding operational ecosystem experiences that execution.</p>
    
    <h2>The Core Philosophy: Intent vs. Impact</h2>
    <p>Great leadership is defined by the relationship between two distinct forces:</p>
    <p><strong>1. Your Intent (The Competency Levers):</strong> The specific behaviors, values, and capabilities you bring to your role every day. This is captured by your personal and peer competency vectors.</p>
    <p><strong>2. Your Impact (The Systemic Outcomes):</strong> How your surrounding corporate ecosystem actually experiences your leadership. This tracks whether those actions are translating into true, sustainable organizational alignment.</p>
  </div>

  ${execSummary}

  <div class="page-break"></div>
  <div class="page-container">
    <h1>Macro Alignment Profile</h1>
    <div class="summary-panel">
      <p>The radar visualization below isolates your system's operational parameters. The <strong>Gold Line</strong> tracks your personal competency lever execution (Intent), while the <strong>Blue Line</strong> maps the actual systemic alignment outcome (Impact) registered across your infrastructure.</p>
    </div>
    <div class="center-container">
      ${radarSvg}
    </div>
  </div>

  <div class="page-break"></div>
  <div class="page-container">
    <h1>Interleaved Framework Metrics</h1>
    <p>This section unbundles your performance indicators by tracking the 1–7 scale scoring means for both critical variables across your native SyncShift framework dimensions.</p>

    ${Object.keys(dims).map((key) => {
      const item = dims[key];
      const delta = item.isSuppressed ? 0 : (item.externalScore - item.selfScore);
      const isNegative = delta < 0;
      
      return `
      <div class="pillar-block">
        <div class="pillar-header">
          <span class="pillar-title">${item.name}</span>
          <span class="gap-badge ${isNegative ? 'gap-negative' : 'gap-aligned'}">
            ${item.isSuppressed ? "Anonymity Locked" : `Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
          </span>
        </div>
        <table class="bar-chart-table">
          <tr>
            <td class="bar-label">Leadership Intent</td>
            <td class="bar-track"><div class="bar-bg"><div class="bar-fill-comp" style="width: ${(item.selfScore / 7) * 100}%;"></div></div></td>
            <td class="bar-val">${item.selfScore.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="bar-label">Systemic Impact</td>
            <td class="bar-track">
              <div class="bar-bg">
                <div class="bar-fill-align" style="width: ${item.isSuppressed ? 0 : (item.externalScore / 7) * 100}%;"></div>
              </div>
            </td>
            <td class="bar-val">${item.isSuppressed ? "Suppressed" : item.externalScore.toFixed(2)}</td>
          </tr>
        </table>
        <div class="diagnostic-container">
          <div class="diagnostic-subtitle">In Plain Terms:</div>
          <div class="diagnostic-text">
            ${getDynamicExplanation(key, item.selfScore, item.externalScore, item.isSuppressed)}
          </div>
        </div>
        <div class="diagnostic-container">
          <div class="diagnostic-subtitle">Recommended Focus:</div>
          <ul style="margin:0; padding-left:5mm; font-size:9.5pt; line-height:1.5; color:#475569;">
            ${getRecommendedActions(key, item.selfScore, item.externalScore, item.isSuppressed).map((a) => `<li>${a}</li>`).join("")}
          </ul>
        </div>
      </div>`;
    }).join("")}
  </div>

  <div class="page-break"></div>
  <div class="page-container">
    <h1>Your Development Plan</h1>
    <p>This section turns the feedback into an actionable 90-day focus. Work one or two priorities at a time — spreading effort across all dimensions dilutes impact.</p>
    ${priorities.length ? priorities.map((d, i) => `
      <div class="pillar-block">
        <div class="pillar-header">
          <span class="pillar-title">${i + 1}. ${d.name}</span>
          <span class="gap-badge ${(d.externalScore - d.selfScore) < 0 ? 'gap-negative' : 'gap-aligned'}">
            Gap ${(d.externalScore - d.selfScore) > 0 ? '+' : ''}${(d.externalScore - d.selfScore).toFixed(2)}
          </span>
        </div>
        <div class="diagnostic-text" style="margin-bottom:3mm;">
          ${getDynamicExplanation(d.key, d.selfScore, d.externalScore, d.isSuppressed)}
        </div>
        <div class="diagnostic-subtitle">Recommended actions</div>
        <ul style="margin:0; padding-left:5mm; font-size:9.5pt; line-height:1.5; color:#475569;">
          ${getRecommendedActions(d.key, d.selfScore, d.externalScore, d.isSuppressed).map((a) => `<li>${a}</li>`).join("")}
        </ul>
      </div>`).join("") : `<div class="summary-panel"><p>No significant perception gaps to prioritise right now. Keep the current approach consistent, and re-run the assessment next cycle to confirm alignment holds.</p></div>`}
    <h2>A simple 90-day rhythm</h2>
    <ul style="margin:0; padding-left:5mm; font-size:10pt; line-height:1.6; color:#334155;">
      <li><strong>Days 1–30:</strong> Pick your #1 priority above. Do one of its recommended actions weekly and tell your team what you're working on.</li>
      <li><strong>Days 31–60:</strong> Check in with one stakeholder on that dimension to gauge whether they can see the change.</li>
      <li><strong>Days 61–90:</strong> Re-run a lightweight pulse (or full 360) on the dimension and compare the delta with this baseline.</li>
    </ul>
  </div>

</body>
</html>`;
}
