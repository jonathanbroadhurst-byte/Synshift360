import { MacroTierReportData } from "./reporting";

const DIMENSION_EXPLANATION: Record<string, string> = {
  "Direction & Sense-Making": "How clearly leadership direction and the 'why' behind work transmits to teams.",
  "Systems & Delivery": "Whether the processes, tracking and accountability loops are in place to actually deliver.",
  "Purpose & Authenticity": "How well the organisation’s purpose and values are felt day-to-day by its people.",
  "Skills & Agility": "Whether people feel safe to experiment, adapt and grow, and the capability available to do so.",
  "Team & Norms": "The health of collaboration, psychological safety and shared norms across teams.",
  "Impact & Reputation": "Whether effort is translating into visible results and a strong external reputation.",
  "Cross-Level Alignment": "How cleanly goals and handoffs connect across functions and levels.",
};

// Cohesion thresholds mirror the dashboard badge (variance of leaders' own scores within a dimension).
function cohesionLabel(variance: number): "Cohesive" | "Varied" | "Fragmented" {
  if (variance > 1.2) return "Fragmented";
  if (variance > 0.6) return "Varied";
  return "Cohesive";
}

/**
 * Plain-language interpretation for one pillar, using BOTH the perception delta and the
 * internal cohesion (variance of leaders' scores). A group can have aligned AVERAGES yet be
 * internally inconsistent — that internal fragmentation is exactly what the variance captures.
 */
function pillarInterpretation(name: string, self: number, ext: number, variance: number): string {
  const delta = ext - self;
  const coh = cohesionLabel(variance);
  const spreadDesc = variance > 1.2
    ? "Leaders across this scope rate themselves very differently on this dimension (variance ≈ " + variance.toFixed(1) + " on a 1–7 scale) — there is no shared standard or common view of what good looks like here."
    : variance > 0.6
    ? "There is moderate spread in how leaders rate themselves here (variance ≈ " + variance.toFixed(1) + "), suggesting partial consistency."
    : "Leaders rate themselves consistently on this dimension (variance ≈ " + variance.toFixed(1) + ") — a shared internal standard is in place.";

  if (coh === "Fragmented") {
    if (Math.abs(delta) < 0.5) {
      return "The group AVERAGE matches stakeholder perception, but that hides real internal disagreement. " + spreadDesc + " The apparent balance is a coincidence of averaging — the actual inconsistency is the risk.";
    }
    if (delta <= -0.5) {
      return "The group overrates itself here relative to stakeholders (" + (self).toFixed(1) + " vs " + (ext).toFixed(1) + "), and leaders are internally inconsistent too. " + spreadDesc + " Fixing the gap starts with a shared standard.";
    }
    return "Stakeholders rate this dimension above the leaders' own view, but the internal picture is fragmented. " + spreadDesc;
  }

  // Cohesive / Varied: read the delta normally.
  if (delta <= -0.5) return "Leaders rate themselves above stakeholder experience here (" + self.toFixed(1) + " vs " + ext.toFixed(1) + " on a 1–7 scale) — a real perception gap on a dimension that is internally consistent.";
  if (delta >= 0.5) return "Stakeholders experience this dimension more positively than the leaders rate themselves (" + ext.toFixed(1) + " vs " + self.toFixed(1) + ") — capability is under-claimed.";
  return "Self-rating and stakeholder experience are closely aligned here (" + self.toFixed(1) + " vs " + ext.toFixed(1) + "), and the internal picture is consistent (" + coh.toLowerCase() + ").";
}

/**
 * Recommended organisational focus for one pillar, driven by where the group is weakest.
 */
function pillarRecommendation(name: string, self: number, ext: number, variance: number): string {
  const coh = cohesionLabel(variance);
  const explain = DIMENSION_EXPLANATION[name] || "";
  if (coh === "Fragmented") {
    return "Leaders hold no shared standard on <strong>" + name + "</strong> (self-score variance ≈ " + variance.toFixed(1) + "). " + explain + " Align on what good looks like first — a shared rubric, calibration session, or common success criteria — before setting improvement targets, since averages without agreement are not actionable.";
  }
  const delta = ext - self;
  if (delta <= -0.5) return "Close the perception gap on <strong>" + name + "</strong> (delta " + delta.toFixed(2) + "). " + explain + " Run a targeted pulse after one working cycle to confirm the change lands for stakeholders, not just leaders.";
  if (delta >= 0.5) return "<strong>" + name + "</strong> is under-claimed — stakeholders see it above the leaders' self-view. Amplify and credit the behaviour you no longer need to flag internally.";
  return "<strong>" + name + "</strong> is aligned and internally consistent. Maintain the cadence that produces it and re-check on the next cycle so drift is caught early.";
}

/**
 * Build plain-language, data-driven feedback for a macro (organisation / leadership / function /
 * team) aggregation so the export is an interpretation, not just a table. Reads BOTH the average
 * perception delta AND the internal cohesion (variance) so the narrative can never call a
 * fragmented group 'healthy'.
 */
function buildMacroFeedback(data: MacroTierReportData): {
  interpretation: string;
  orgRecommendations: string[];
  pillarFeedback: Array<{ name: string; self: number; ext: number; delta: number; variance: number; cohesion: string; interpretation: string; recommendation: string }>;
} {
  const pillars = Object.values(data.pillars || {});
  const cleared = pillars;
  const avgDelta = cleared.length ? cleared.reduce((a, p) => a + (p.blindspotDelta || 0), 0) / cleared.length : 0;
  const avgVariance = cleared.length ? cleared.reduce((a, p) => a + (p.cohesionVariance || 0), 0) / cleared.length : 0;
  const avgSelf = cleared.length ? cleared.reduce((a, p) => a + (p.leaderSelfAvg || 0), 0) / cleared.length : 0;
  const avgExt = cleared.length ? cleared.reduce((a, p) => a + (p.stakeholderAvg || 0), 0) / cleared.length : 0;
  const fragmentedCount = cleared.filter((p) => cohesionLabel(p.cohesionVariance || 0) === "Fragmented").length;
  const biggestGaps = [...cleared].filter((p) => Math.abs(p.blindspotDelta || 0) >= 0.5).sort((a, b) => Math.abs(b.blindspotDelta || 0) - Math.abs(a.blindspotDelta || 0));
  const lowestImpact = [...cleared].filter((p) => (p.stakeholderAvg || 0) > 0).sort((a, b) => (a.stakeholderAvg || 0) - (b.stakeholderAvg || 0)).slice(0, 2);

  // Interpretation now weighs internal fragmentation as a first-class signal.
  let interpretation: string;
  if (fragmentedCount >= Math.ceil(cleared.length / 2)) {
    interpretation = `Across this ${data.tierName} scope, the group average looks aligned (${avgSelf.toFixed(1)} vs ${avgExt.toFixed(1)}), but ${fragmentedCount} of ${cleared.length} dimensions are internally fragmented — leaders rate themselves very differently (average variance ≈ ${avgVariance.toFixed(1)}). The apparent balance is a coincidence of averaging across a group that has no shared standard. The real work is alignment and a common definition of good, not closing a perception gap.`;
  } else if (avgDelta <= -0.5) {
    interpretation = `Across this ${data.tierName} scope, leaders rate their own leadership ${Math.abs(avgDelta).toFixed(1)} points above how stakeholders experience it (average ${avgSelf.toFixed(1)} vs ${avgExt.toFixed(1)} on a 1–7 scale), while intra-group consistency is ${cohesionLabel(avgVariance).toLowerCase()}. This is a perception gap: intent is real but not translating into the impact people feel.`;
  } else if (avgDelta >= 0.5) {
    interpretation = `Across this ${data.tierName} scope, stakeholders rate these leaders higher than the leaders rate themselves (average ${avgExt.toFixed(1)} vs ${avgSelf.toFixed(1)}). Capability is under-claimed more than under-delivered, with ${cohesionLabel(avgVariance).toLowerCase()} internal consistency.`;
  } else {
    interpretation = fragmentedCount > 0
      ? `Across this ${data.tierName} scope, the group average is within a healthy margin (${avgSelf.toFixed(1)} vs ${avgExt.toFixed(1)}). However, ${fragmentedCount} dimension(s) are internally fragmented — leaders disagree among themselves even though averages line up. Address that internal inconsistency before reading group success as stable.`
      : `Across this ${data.tierName} scope, self-rating and stakeholder experience are closely aligned and internally consistent (${avgSelf.toFixed(1)} vs ${avgExt.toFixed(1)} on a 1–7 scale). A genuinely healthy picture.`;
  }

  const recommendations: string[] = [];

  // Internal fragmentation is the top organisational priority when it is widespread.
  if (fragmentedCount >= 2) {
    const fragNames = cleared.filter((p) => cohesionLabel(p.cohesionVariance || 0) === "Fragmented").map((p) => p.name).slice(0, 3).join(", ");
    recommendations.push(`A leading priority is <strong>internal alignment</strong>: ${fragmentedCount} dimension(s) — ${fragNames} — are fragmented (leaders disagree in their own views). Establish one shared definition of good across these dimensions (common rubric / calibration / success criteria) so the group averages become meaningful direction instead of an accident of averaging.`);
  } else if (fragmentedCount === 1) {
    const fragName = cleared.find((p) => cohesionLabel(p.cohesionVariance || 0) === "Fragmented")?.name;
    recommendations.push(`Dimension <strong>${fragName}</strong> is internally fragmented even though the group average looks fine — leaders disagree on what good looks like there. Run a calibration on this one dimension before setting improvement targets.`);
  }
  if (biggestGaps.length >= 1) {
    const label = biggestGaps[0].name;
    recommendations.push(`Close the perception gap on <strong>${label}</strong> first — it holds the largest self-vs-stakeholder delta (${biggestGaps[0].blindspotDelta > 0 ? '+' : ''}${biggestGaps[0].blindspotDelta.toFixed(2)}). ${DIMENSION_EXPLANATION[label] || ''} Run a targeted pulse on this dimension after one working cycle to confirm the change lands.`);
  }
  if (lowestImpact[0] && (lowestImpact[0].stakeholderAvg || 0) > 0 && (lowestImpact[0].stakeholderAvg || 0) < 4.5) {
    recommendations.push(`The lowest stakeholder-scored dimension is <strong>${lowestImpact[0].name}</strong> (${lowestImpact[0].stakeholderAvg.toFixed(1)}/7). Treat it as the organisation development priority for the next quarter and align leadership attention around it.`);
  }
  // Cross-functional / team guidance from friction, where present.
  if (data.functionalFrictionIndex && data.functionalFrictionIndex.length) {
    const high = data.functionalFrictionIndex.sort((a, b) => b.frictionDelta - a.frictionDelta).slice(0, 2);
    const worst = high[0];
    if (worst && worst.frictionDelta >= 0.8) {
      recommendations.push(`The most strained cross-functional boundary is <strong>${worst.deptA} ↔ ${worst.deptB}</strong> (friction ${worst.frictionDelta.toFixed(2)}). Broker a joint objective and a shared review cadence between these two functions to reduce handoff-driven drag.`);
    }
  }
  if (avgDelta <= -0.5) {
    recommendations.push(`Because self-perception runs ahead of stakeholder experience group-wide, start leadership 1:1s with the 'what are you trying to achieve, and how would others know?' framing — it turns the gap into shared, observable goals rather than a confidence issue.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Alignment is healthy and internally consistent across the measured dimensions. Keep the cadence and re-assess on the next cycle so early misalignment is caught before it compounds.");
  }

  // Per-dimension feedback blocks, so the macro report matches the depth of the individual report.
  const pillarFeedback = cleared.map((p) => {
    const self = p.leaderSelfAvg || 0;
    const ext = p.stakeholderAvg || 0;
    const variance = p.cohesionVariance || 0;
    return {
      name: p.name,
      self,
      ext,
      delta: ext - self,
      variance,
      cohesion: cohesionLabel(variance),
      interpretation: pillarInterpretation(p.name, self, ext, variance),
      recommendation: pillarRecommendation(p.name, self, ext, variance),
    };
  });

  return { interpretation, orgRecommendations: recommendations, pillarFeedback };
}

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

        ${(() => {
          const fb = buildMacroFeedback(data);
          return `
          <div class="mb-8 border-l-4 border-indigo-600 bg-indigo-50/40 rounded-r-xl p-6">
            <h3 class="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs text-indigo-700">Executive Interpretation</h3>
            <p class="text-sm text-slate-700 leading-relaxed">${fb.interpretation}</p>
          </div>
          <div class="mb-8 border-l-4 border-amber-500 bg-amber-50/40 rounded-r-xl p-6">
            <h3 class="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs text-amber-700">Recommended Organisational Focus</h3>
            <ul class="space-y-3 text-sm text-slate-700">
              ${fb.orgRecommendations.map((r) => `<li class="flex items-start gap-2"><span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span><span>${r}</span></li>`).join("")}
            </ul>
          </div>`;
        })()}

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

        ${(() => {
          const fb = buildMacroFeedback(data);
          return `
          <div class="mt-10 page-break-prevent">
            <h3 class="text-lg font-bold text-slate-900 border-b pb-2 mb-4 uppercase tracking-wider text-xs text-slate-400">Dimension Deep-Dive</h3>
            <div class="space-y-4">
              ${fb.pillarFeedback.map((pf) => `
                <div class="border border-slate-200 rounded-xl p-5 ${pf.cohesion === 'Fragmented' ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50/40'}">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span class="text-sm font-bold text-slate-900">${pf.name}</span>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">Self ${pf.self.toFixed(1)}</span>
                      <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">Stake ${pf.ext.toFixed(1)}</span>
                      <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">Δ ${pf.delta > 0 ? '+' : ''}${pf.delta.toFixed(2)}</span>
                      <span class="px-2 py-0.5 rounded-md ${pf.cohesion === 'Fragmented' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'} font-semibold">Variance ${pf.variance.toFixed(1)}</span>
                    </div>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed mb-3">${pf.interpretation}</p>
                  <p class="text-sm text-slate-700 leading-relaxed">${pf.recommendation}</p>
                </div>
              `).join("")}
            </div>
          </div>`;
        })()}

        <div class="mt-12 pt-6 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed flex justify-between">
          <span>© 2026 Ignite-Me. All rights reserved. Confidentially compiled under standard organizational psychometric safety boundaries.</span>
          <span class="font-semibold text-slate-500">Document Token Ref: SS-M-${data.tierType.substring(0,3).toUpperCase()}</span>
        </div>

      </div>
    </body>
    </html>
  `;
}
