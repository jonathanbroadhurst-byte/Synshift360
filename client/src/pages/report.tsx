import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ShieldAlert, Users, Layers, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface Dimension {
  name: string;
  selfScore: number;
  externalScore: number;
  delta: number;
  isSuppressed: boolean;
}

interface IndividualReportPayload {
  cycleId: number;
  title: string;
  totalResponses: number;
  anonymityThresholdCleared: boolean;
  dimensions: Record<string, Dimension>;
}

// Short human guidance per SyncShift dimension
const dimensionGuidance: Record<string, { emoji: string; meaning: string }> = {
  direction:    { emoji: "🧭", meaning: "Clarity of vision and how well the leader helps others make sense of direction." },
  systems:      { emoji: "🏗️", meaning: "Delivery engines, delegation, and the processes that turn intent into results." },
  purpose:      { emoji: "🔍", meaning: "Authenticity, integrity and values — the trust foundation of leadership." },
  skills:       { emoji: "⚡", meaning: "Capability, agility and the ability to grow and develop people." },
  team:         { emoji: "🤝", meaning: "Trust, collaboration and the health of team norms and culture." },
  impact:       { emoji: "🌟", meaning: "Executive presence, influence and external reputation." },
  cross_level:  { emoji: "🗝️", meaning: "Alignment across layers — how well the whole system works together." },
};

export default function Report() {
  const { reportId } = useParams();

  // The real individual-report payload is produced by the metrics endpoint.
  const { data: report, isLoading, isError } = useQuery<IndividualReportPayload>({
    queryKey: [`/api/reports/${reportId}/metrics`],
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading report…</p>
        </main>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
              <p className="text-gray-600">This individual report could not be loaded. Ensure the leader has an active survey cycle with responses.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const dims = report.dimensions || {};
  const dimList = Object.keys(dims).map((k) => ({ key: k, ...dims[k] }));
  const hasExternal = report.anonymityThresholdCleared;

  // Chart data for the two pillared bars
  const chartData = dimList.map((d) => ({
    dimension: d.name.split(" &")[0],
    "Self-Perception": d.selfScore || 0,
    "Stakeholder Reality": hasExternal ? d.externalScore || 0 : 0,
  }));

  // Radar data (delta magnitude colour): show how far self vs stakeholders diverge
  const radarData = dimList.map((d) => ({ dimension: d.name.split(" &")[0], "Gap (Δ)": Math.abs(d.delta || 0) }));

  // Derive strengths = dimensions with the strongest confirmed external scores;
  // development = dimensions with the most negative delta (stakeholders see it weaker than the leader does).
  const ranked = dimList.filter((d) => hasExternal && (d.externalScore ?? 0) > 0).sort((a, b) => b.externalScore - a.externalScore);
  const strengths = ranked.slice(0, 3);
  const development = [...dimList].filter((d) => d.delta !== undefined).sort((a, b) => a.delta - b.delta).slice(0, 3);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/${report.cycleId}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("download failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = (report.title || "report").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      a.download = `${safe}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download fail:", e);
      alert("Could not download this report.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />

        <div className="p-6 md:p-8 space-y-6">
          {/* Report header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
              <p className="text-sm text-slate-500 mt-1">Individual leadership profile · {report.totalResponses} feedback responses collected</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={!report.anonymityThresholdCleared}
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>

          {/* Anonymity guardrail */}
          {!report.anonymityThresholdCleared && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Statistical suppression active</p>
                <p className="text-amber-800">Fewer than 3 external responses were collected. Stakeholder scores are withheld to protect reviewer anonymity.</p>
              </div>
            </div>
          )}

          {/* Scorecard strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6 flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Feedback Responses</p><p className="text-3xl font-bold text-slate-900 mt-1">{report.totalResponses}</p></div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="h-6 w-6" /></div>
            </CardContent></Card>
            <Card><CardContent className="pt-6 flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stakeholder Views</p><p className="text-3xl font-bold text-slate-900 mt-1">{hasExternal ? "Cleared" : "Suppressed"}</p></div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Layers className="h-6 w-6" /></div>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dimensions Analysed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dimList.length}</p>
            </CardContent></Card>
          </div>

          {/* Self vs stakeholder bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-bold text-slate-900">Self-Perception vs Stakeholder Reality</CardTitle>
            <CardDescription>How this leader rates themselves versus how their team, peers and others rate them, by dimension.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 7]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Self-Perception" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Stakeholder Reality" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* perception-gap radar */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-bold text-slate-900">Perception Gap Profile</CardTitle>
            <CardDescription>Distance between self- and stakeholder-ratings per dimension. Higher spikes = bigger blindspots.</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-8">
              <div className="w-full md:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 11 }} />
                    <Radar name="Gap (Δ)" dataKey="Gap (Δ)" stroke="#f43f5e" fill="#fb7185" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 text-sm">
                {dimList.map((d) => (
                  <div key={d.key} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-700">{dimensionGuidance[d.key]?.emoji} {d.name}</span>
                    <span className={`font-bold ${Math.abs(d.delta || 0) >= 1.2 ? "text-rose-600" : Math.abs(d.delta || 0) >= 0.5 ? "text-amber-600" : "text-emerald-600"}`}>
                      {hasExternal ? `${d.delta > 0 ? "+" : ""}${d.delta}` : "suppressed"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths + development */}
          {hasExternal && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-xl text-emerald-700">Key Strengths</CardTitle>
                <CardDescription>Dimensions where stakeholders score this leader most highly.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  {strengths.length ? strengths.map((d, i) => (
                    <div key={i} className="border-l-4 border-emerald-500 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900">{dimensionGuidance[d.key]?.emoji} {d.name}</h4>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{d.externalScore}/7</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{dimensionGuidance[d.key]?.meaning}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">Not enough cleared stakeholder data to rank strengths yet.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-xl text-rose-700">Development Opportunities</CardTitle>
                <CardDescription>Largest self-stakeholder gaps — where blindspots likely sit.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  {development.length ? development.map((d, i) => (
                    <div key={i} className="border-l-4 border-rose-500 pl-4 bg-rose-50/40 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900">{dimensionGuidance[d.key]?.emoji} {d.name}</h4>
                        <Badge variant="outline" className="border-rose-400 text-rose-700">Δ {d.delta > 0 ? "+" : ""}{d.delta}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{dimensionGuidance[d.key]?.meaning}</p>
                      <p className="text-xs text-rose-700 mt-1">Stakeholders perceive a {d.delta < 0 ? "lower" : "higher"} level than the leader's self-rating.</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No notable self-stakeholder gaps detected.</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* interpretation note */}
          <div className="flex gap-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-4 text-sm">
            <Info className="h-5 w-5 shrink-0 text-slate-400" />
            <p>All scores sit on a 1–7 scale. A positive gap (Δ) means stakeholders rate the leader higher than they rate themselves; a negative gap means the leader may be overrating a blindspot. Share this report with the leader for their 360 development conversation.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
