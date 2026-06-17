import { MacroTierReportData } from "./reporting";

/**
 * Compiles macro tier analytics into a structured, print-ready HTML executive asset.
 */
export function compileMacroHtmlReport(data: MacroTierReportData, orgName: string): string {
  const dateString = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Map out tabular rows for the 6 core dimensions cleanly
  const pillarRows = Object.keys(data.pillars).map(key => {
    const p = data.pillars[key];
    const deltaColor = p.blindspotDelta < 0 ? "text-rose-600" : p.blindspotDelta > 0 ? "text-emerald-600" : "text-slate-600";
    const statusLabel = p.cohesionVariance > 1.2 ? "⚠️ Fragmented" : p.cohesionVariance > 0.6 ? "⚡ Varied" : "✅ Cohesive";

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition">
        <td class="py-4 px-4 text-sm font-semibold text-slate-800">${p.name}</td>
        <td class="py-4 px-4 text-sm text-center font-medium text-indigo-600 bg-indigo-50/30">${p.leaderSelfAvg}</td>
        <td class="py-4 px-4 text-sm text-center font-medium text-emerald-600 bg-emerald-50/30">${p.stakeholderAvg}</td>
        <td class="py-4 px-4 text-sm text-center font-bold ${deltaColor}">${p.blindspotDelta > 0 ? '+' : ''}${p.blindspotDelta}</td>
        <td class="py-4 px-4 text-sm text-center text-slate-600">${p.cohesionVariance}</td>
        <td class="py-4 px-4 text-sm text-center font-medium text-slate-700">${statusLabel}</td>
      </tr>
    `;
  }).join('');

  // Map out functional friction vectors if they exist
  let frictionSection = '';
  if (data.tierType === 'organisation' && data.functionalFrictionIndex && data.functionalFrictionIndex.length > 0) {
    const frictionRows = data.functionalFrictionIndex.map(item => {
      const riskClass = item.frictionDelta >= 1.2 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100';
      return `
        <div class="p-4 border rounded-xl flex justify-between items-center ${riskClass}">
          <span class="text-sm font-semibold">${item.deptA} <span class="opacity-40">↔</span> ${item.deptB}</span>
          <span class="text-xs font-bold px-2.5 py-1 rounded-md border bg-white/80">Delta: ${item.frictionDelta}</span>
        </div>
      `;
    }).join('');

    frictionSection = `
      <div class="mt-10 page-break-prevent">
        <h3 class="text-lg font-bold text-slate-900 border-b pb-2 mb-4 uppercase tracking-wider text-xs text-slate-400">Cross-Functional Interfacial Friction</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${frictionRows}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SyncShift Macro Alignment Brief - ${data.tierName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body { padding: 0; background: #fff; }
          .no-print { display: none; }
          .page-break { page-break-before: always; }
          .page-break-prevent { page-break-inside: avoid; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      </style>
    </head>
    <body class="bg-slate-50 py-12 px-6 min-h-screen">

      <div class="max-w-4xl mx-auto mb-6 no-print flex justify-end">
        <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition">
          Print or Save as PDF
        </button>
      </div>

      <div class="max-w-4xl mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-12">
        
        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">SyncShift™ Systems Evaluation</div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">${data.tierType.toUpperCase()} ALIGNMENT BRIEF</h1>
            <p class="text-slate-500 text-sm mt-1">Scope Boundary: <strong class="text-slate-800">${data.tierName}</strong></p>
          </div>
          <div class="text-right flex flex-col items-end">
            <div class="h-14 w-14 bg-slate-100 rounded-xl border flex items-center justify-center font-bold text-slate-400 text-xs text-center border-dashed">
              Logo
            </div>
            <span class="text-[10px] font-bold tracking-tight text-slate-800 mt-2">Ignite-me.com</span>
            <span class="text-[8px] text-slate-400 uppercase tracking-wider">Intent Meets Impact</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-150">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Organization</span>
            <span class="text-sm font-bold text-slate-800">${orgName}</span>
          </div>
          <div class="text-center border-x border-slate-200">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leaders Aggregated</span>
            <span class="text-sm font-bold text-slate-800">${data.leaderCount} Active Profiles</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analysis Generated</span>
            <span class="text-sm font-bold text-slate-800">${dateString}</span>
          </div>
        </div>

        <div class="mt-6">
          <h3 class="text-lg font-bold text-slate-900 border-b pb-2 mb-4 uppercase tracking-wider text-xs text-slate-400">Pillar Matrix Vector Alignments</h3>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                <th class="py-3 px-4 rounded-l-lg">SyncShift Master Pillar</th>
                <th class="py-3 px-4 text-center">Leader Self (Intent)</th>
                <th class="py-3 px-4 text-center">Stakeholder (Impact)</th>
                <th class="py-3 px-4 text-center">Perception Delta</th>
                <th class="py-3 px-4 text-center">Variance Index</th>
                <th class="py-3 px-4 text-center rounded-r-lg">Cohesion Core</th>
              </tr>
            </thead>
            <tbody>
              ${pillarRows}
            </tbody>
          </table>
        </div>

        ${frictionSection}

        <div class="mt-12 pt-6 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed flex justify-between">
          <span>© 2026 Ignite-Me. All rights reserved. Confidentially compiled under standard organizational psychometric safety boundaries.</span>
          <span class="font-semibold text-slate-500">Document Token Ref: SS-M-${data.tierType.substring(0,3).toUpperCase()}</span>
        </div>

      </div>
    </body>
    </html>
  `;
}
