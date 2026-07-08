import { AggregatedReportData } from "./reporting";

/**
 * Dynamically computes a high-fidelity, gradient-filled visual SVG radar chart
 */
function generateRadarSVG(dimensions: any): string {
  const cx = 250;
  const cy = 210;
  const rMax = 140;
  const keys = ["direction", "systems", "purpose", "skills", "team", "impact"];
  
  const valToR = (val: number) => (val / 7.0) * rMax;

  // Compute points for both datasets
  const compPts: string[] = [];
  const alignPts: string[] = [];

  keys.forEach((key, i) => {
    const angle = i * (2 * Math.PI / 6) - (Math.PI / 2);
    const dim = dimensions[key];
    
    // Personal Competency Levers (Intent Line)
    const rComp = valToR(dim?.selfScore || 0);
    compPts.push(`${cx + rComp * Math.cos(angle)},${cy + rComp * Math.sin(angle)}`);
    
    // Systemic Alignment Outcomes (Impact Line - respects suppression safety bounds)
    const rAlign = valToR(dim?.isSuppressed ? 0 : dim?.externalScore || 0);
    alignPts.push(`${cx + rAlign * Math.cos(angle)},${cy + rAlign * Math.sin(angle)}`);
  });

  // Render concentric ring webs
  let webGrid = "";
  for (let level = 1; level <= 7; level++) {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = i * (2 * Math.PI / 6) - (Math.PI / 2);
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
    "Impact & Reputation"
  ];

  keys.forEach((key, i) => {
    const angle = i * (2 * Math.PI / 6) - (Math.PI / 2);
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
  <svg viewBox="0 0 500 460" width="100%" height="420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D97706" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.05" />
      </linearGradient>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.05" />
      </linearGradient>
      <filter id="dotShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
      </filter>
    </defs>
    ${webGrid}
    ${axisElements}
    
    <!-- Render Solid Data Polybounds -->
    <polygon points="${compPts.join(" ")}" fill="url(#goldGrad)" stroke="#D97706" stroke-width="3" stroke-linejoin="round" />
    <polygon points="${alignPts.join(" ")}" fill="url(#blueGrad)" stroke="#1E3A8A" stroke-width="3" stroke-linejoin="round" />
    
    <circle cx="${cx}" cy="${cy}" r="4" fill="#0A192F" />

    <!-- Inline Modern Legend Bar Map -->
    <g transform="translate(110, 435)">
      <rect x="0" y="0" width="12" height="12" rx="3" fill="#D97706" />
      <text x="18" y="10" font-family="Arial" font-size="9.5" font-weight="bold" fill="#475569">Leadership Intent (Self)</text>
      
      <rect x="150" y="0" width="12" height="12" rx="3" fill="#1E3A8A" />
      <text x="168" y="10" font-family="Arial" font-size="9.5" font-weight="bold" fill="#475569">Systemic Impact (Stakeholders)</text>
    </g>
  </svg>`;
}

/**
 * Evaluates live numerical deltas and returns deep context commentary
 */
function getDynamicExplanation(key: string, self: number, ext: number, isSuppressed: boolean): string {
  if (isSuppressed) {
    return "Detailed stakeholder consensus metrics are currently suppressed on this framework vector to strictly ensure respondent anonymity protocols.";
  }

  const delta = ext - self;

  const commentaryBank: Record<string, { blindspot: string; aligned: string; positive: string }> = {
    direction: {
      blindspot: "You maintain absolute clarity regarding long-term vision benchmarks. However, your team scored you significantly lower on communication. This indicates your roadmap is localized inside leadership columns; because context isn't broadcast frequently enough, stakeholders absorb daily strategy pivots as erratic volatility rather than systematic milestones.",
      aligned: "Your vision transmission parameters are highly synchronized. The strategic objectives you intentionally broadcast mirror the exact execution priorities recognized across your active department teams.",
      positive: "Your organizational network demonstrates extreme strategic resonance. Your operational teams absorb, own, and champion the long-term strategic map at a level that outpaces your personal assumptions."
    },
    systems: {
      blindspot: "An operational breakdown point is developing. While you prioritize strategic orchestration, your teams indicate that baseline execution frameworks, feedback loops, or task tracking infrastructure are missing. This gap causes critical workflow drag as individuals work around system mechanics.",
      aligned: "Operational delivery infrastructures are highly stable. The workflow routines, task handoffs, and accountability loops you have configured allow departments to run cleanly without management dependencies.",
      positive: "Your execution parameters are running with exceptional autonomy. Teams value and lean on your operational guardrails even higher than your estimation, using them to deliver consistent outcomes with near-zero friction."
    },
    purpose: {
      blindspot: "A cultural trust drift is observable. While you feel your operational principles are transparently clear, stakeholders experience a values mismatch. This variance often implies that corporate decisions are perceived as purely transactional, risking baseline team engagement.",
      aligned: "Your values and authentic leadership presence match the structural expectations of your team completely. This shared connection anchors core relational capital that you can safely lean on during heavy organizational adjustments.",
      positive: "Stakeholders recognize a profound level of authentic purpose behind your executive actions, establishing a powerful cultural baseline of safety that inspires high organizational accountability."
    },
    skills: {
      blindspot: "Capability mismatch vector. Your personal pivot agility outruns your team's current development training wheels, or vice versa. This structural variance suggests that tactical requirements are changing faster than systemic skills can realistically adapt.",
      aligned: "Tactical adaptive readiness is beautifully matched. Your group's developmental capabilities match marketplace shifts, enabling fast adjustments without burning out team units.",
      positive: "Your operational network displays exceptional problem-solving capacity, executing complex skill-set transitions swiftly to absorb fresh marketplace challenges without project interruptions."
    },
    team: {
      blindspot: "A structural team silo warning is active. While you see your internal department parameters as highly supportive, your peers and reports experience fragmented workflows. Sub-groups are hoarding operational context, leading to internal resource friction.",
      aligned: "Internal group norms are deeply cohesive. Teams practice healthy mutual support parameters, ensuring open cross-functional communication balances cleanly against performance requirements.",
      positive: "Your department operations have achieved complete high-velocity alignment. Teams resolve complex issues autonomously, driving collective accountability loops that remove cross-department friction completely."
    },
    impact: {
      blindspot: "Brand projection drift. Your personal energy output does not match the actual reputation parameters acknowledged across the enterprise matrix. External stakeholder columns do not fully see or register your core tactical achievements.",
      aligned: "Corporate brand authority parameters are perfectly secure. Your performance choices map cleanly into consistent reputation metrics recognized universally across external operational lines.",
      positive: "Your leadership footprint commands exceptional authority across the ecosystem, creating deep executive influence that effortlessly opens doors across high-level strategic nodes."
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
      <tr><td class="cover-meta-label">Diagnostic Baseline</td><td class="cover-meta-value">SyncShift Interleaved Dual-Line Core Matrix</td></tr>
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
