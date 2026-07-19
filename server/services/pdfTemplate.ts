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

/**
 * Compiles the raw dynamic dashboard HTML string matching the SyncShift brand identity
 */
export function compileSyncShiftHtmlReport(data: AggregatedReportData, leaderName: string, orgName: string): string {
  const radarSvg = generateRadarSVG(data.dimensions);
  const dims = data.dimensions;

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
          <div class="diagnostic-subtitle">The Strategic Conflict:</div>
          <div class="diagnostic-text">
            ${getDynamicExplanation(key, item.selfScore, item.externalScore, item.isSuppressed)}
          </div>
        </div>
      </div>`;
    }).join("")}
  </div>

</body>
</html>`;
}
