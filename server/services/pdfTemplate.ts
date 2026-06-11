import { AggregatedReportData } from "./reporting";

/**
 * Dynamically computes SVG coordinates for the dual-line alignment radar chart
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
    
    // Personal Competency Levers
    const rComp = valToR(dim?.selfScore || 0);
    compPts.push(`${cx + rComp * Math.cos(angle)},${cy + rComp * Math.sin(angle)}`);
    
    // Systemic Alignment Outcomes (Check for suppression firewall)
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
    webGrid += `  <text x="${cx + valToR(level) * Math.cos(-Math.PI / 2) + 6}" y="${cy + valToR(level) * Math.sin(-Math.PI / 2) + 4}" font-family='Arial' font-size='8' fill='#94A3B8' font-weight='bold'>${level}</text>\n`;
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
    axisElements += `  <line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="3,3" />\n`;
    
    const labelR = r + 22;
    const lx = cx + labelR * Math.cos(angle);
    let ly = cy + labelR * Math.sin(angle);
    
    let anchor = "middle";
    if (Math.cos(angle) > 0.1) anchor = "start";
    else if (Math.cos(angle) < -0.1) anchor = "end";
    
    if (Math.abs(Math.sin(angle)) < 0.1) ly += 4;
    else if (Math.sin(angle) > 0.5) ly += 12;
    else ly -= 4;

    axisElements += `  <text x="${lx}" y="${ly}" font-family='Arial' font-size='10' font-weight='bold' fill='#1E293B' text-anchor='${anchor}'>${displayNames[i]}</text>\n`;
  });

  return `
  <svg viewBox="0 0 500 450" width="100%" height="450" xmlns="http://www.w3.org/2000/svg">
    ${webGrid}
    ${axisElements}
    <polygon points="${compPts.join(" ")}" fill="rgba(217, 119, 6, 0.12)" stroke="#D97706" stroke-width="2.5" stroke-linejoin="round" />
    <polygon points="${alignPts.join(" ")}" fill="rgba(30, 58, 138, 0.12)" stroke="#1E3A8A" stroke-width="2.5" stroke-linejoin="round" />
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="#64748B" />
  </svg>`;
}

/**
 * Compiles the raw dynamic dashboard HTML string matching the SyncShift brand identity
 */
export function compileSyncShiftHtmlReport(data: AggregatedReportData, leaderName: string, orgName: string): string {
  const radarSvg = generateRadarSVG(data.dimensions);
  const dims = data.dimensions;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 22mm 20mm;
    @bottom-right { content: "Page " counter(page); font-family: 'Arial', sans-serif; font-size: 8.5pt; color: #94A3B8; }
    @bottom-left { content: "SyncShift Alignment Framework — Executive 360°"; font-family: 'Arial', sans-serif; font-size: 8.5pt; color: #94A3B8; font-weight: bold; }
  }
  @page:first { background-color: #0A192F; margin: 0; @bottom-right { content: none; } @bottom-left { content: none; } }
  body { font-family: 'Arial', sans-serif; color: #334155; background-color: #FFFFFF; line-height: 1.6; font-size: 10pt; margin: 0; padding: 0; }
  .cover-wrapper { padding: 60mm 25mm 25mm 25mm; height: 297mm; position: relative; box-sizing: border-box; }
  .cover-accent-line { width: 30mm; height: 4px; background-color: #D97706; margin-bottom: 8mm; }
  .cover-title { font-size: 34pt; font-weight: bold; color: #F8FAFC; line-height: 1.15; margin: 0 0 5mm 0; letter-spacing: -0.5px; }
  .cover-subtitle { font-size: 12pt; color: #94A3B8; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
  .cover-meta-table { width: 100%; position: absolute; bottom: 40mm; left: 25mm; border-collapse: collapse; }
  .cover-meta-table td { padding: 8px 0; font-size: 11pt; }
  .cover-meta-label { color: #64748B; width: 30%; text-transform: uppercase; letter-spacing: 1.5px; font-size: 8.5pt; font-weight: bold; }
  .cover-meta-value { color: #E2E8F0; font-weight: bold; }
  .page-break { page-break-before: always; }
  h1 { font-size: 22pt; color: #0A192F; border-bottom: 2px solid #F1F5F9; padding-bottom: 4mm; margin-top: 0; margin-bottom: 6mm; page-break-after: avoid; font-weight: bold; }
  h2 { font-size: 13pt; color: #1E3A8A; margin-top: 8mm; margin-bottom: 4mm; page-break-after: avoid; font-weight: bold; text-transform: uppercase; }
  p { margin-top: 0; margin-bottom: 4mm; color: #475569; text-align: justify; }
  .summary-panel { background-color: #F8FAFC; border-left: 4px solid #1E3A8A; padding: 6mm 7mm; margin-bottom: 8mm; border-radius: 0 6px 6px 0; }
  .summary-panel p { margin: 0; font-size: 10.5pt; color: #334155; }
  .center-container { text-align: center; margin: 4mm 0 6mm 0; page-break-inside: avoid; }
  .badge-pillar { display: inline-block; padding: 3px 9px; background-color: #E0F2FE; color: #0369A1; border-radius: 4px; font-size: 8.5pt; font-weight: bold; margin-bottom: 4mm; text-transform: uppercase; }
  .bar-chart-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
  .bar-chart-table td { padding: 5px 0; vertical-align: middle; }
  .bar-label { width: 150px; font-size: 9pt; color: #64748B; font-weight: bold; }
  .bar-bg { width: 100%; background-color: #F1F5F9; height: 12px; border-radius: 3px; overflow: hidden; }
  .bar-fill-comp { background-color: #D97706; height: 12px; }
  .bar-fill-align { background-color: #1E3A8A; height: 12px; }
  .bar-val { width: 45px; text-align: right; font-size: 9.5pt; font-weight: bold; color: #334155; }
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
      <tr><td class="cover-meta-label">Diagnostic Baseline</td><td class="cover-meta-value">SyncShift Interleaved Dual-Line Core (2026 Criteria)</td></tr>
      <tr><td class="cover-meta-label">Total Responses</td><td class="cover-meta-value">${data.totalResponses} submissions</td></tr>
    </table>
  </div>

  <div class="page-break"></div>
  <h1>Understanding Your SyncShift Profile</h1>
  <p>High performance is never static. It spirals upward when people, systems, and purpose stay in sync. When these elements drift apart, organizations experience friction, execution drag, and lost momentum.</p>
  <p>This diagnostic profile is designed to help you see exactly where you are creating clear organizational momentum and where hidden friction points might be slowing your progress.</p>
  
  <h2>The Core Philosophy: Intent vs. Impact</h2>
  <p>Great leadership is defined by the relationship between two distinct forces:</p>
  <p><strong>1. Your Intent (The Competency Levers):</strong> The specific behaviors, values, and capabilities you bring to your role every day. This is captured by your personal and peer competency vectors.</p>
  <p><strong>2. Your Impact (The Systemic Outcomes):</strong> How your surrounding corporate ecosystem actually experiences your leadership. This tracks whether those actions are translating into true, sustainable organizational alignment.</p>

  <div class="page-break"></div>
  <h1>Macro Alignment Profile</h1>
  <div class="summary-panel">
    <p>The radar visualization below isolates your system's operational parameters. The <strong>Gold Line</strong> tracks your personal competency lever execution, while the <strong>Blue Line</strong> maps the actual systemic alignment outcome registered across your infrastructure.</p>
  </div>
  <div class="center-container">
    ${radarSvg}
  </div>

  <div class="page-break"></div>
  <h1>Interleaved Framework Metrics</h1>
  <p>This section unbundles indicators by tracking the 1–7 scale means for both variables across your native SyncShift framework dimensions.</p>

  ${Object.keys(dims).map((key) => {
    const item = dims[key];
    return `
    <div style="margin-bottom: 6mm; border-bottom: 1px solid #F1F5F9; padding-bottom: 4mm; page-break-inside: avoid;">
      <span class="badge-pillar">${item.name}</span>
      <table class="bar-chart-table">
        <tr>
          <td class="bar-label">Leadership Competency</td>
          <td class="bar-track"><div class="bar-bg"><div class="bar-fill-comp" style="width: ${(item.selfScore / 7) * 100}%;"></div></div></td>
          <td class="bar-val">${item.selfScore}</td>
        </tr>
        <tr>
          <td class="bar-label">Systemic Alignment</td>
          <td class="bar-track">
            <div class="bar-bg">
              <div class="bar-fill-align" style="width: ${item.isSuppressed ? 0 : (item.externalScore / 7) * 100}%;"></div>
            </div>
          </td>
          <td class="bar-val">${item.isSuppressed ? "Suppressed" : item.externalScore}</td>
        </tr>
      </table>
    </div>`;
  }).join("")}

</body>
</html>`;
}
