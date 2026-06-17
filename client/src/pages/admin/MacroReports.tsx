import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { 
  ShieldAlert, Users, Layers, Landmark, TrendingUp, HelpCircle, ArrowUpRight, Zap, Download 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface MacroReportPayload {
  tierType: "team" | "function" | "organisation";
  tierName: string;
  leaderCount: number;
  thresholdCleared: boolean;
  totalResponsesCollected: number;
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

export default function MacroReportsDashboard() {
  const [tierType, setTierType] = useState<"team" | "function" | "organisation">("organisation");
  const [identifier, setIdentifier] = useState<string>("all");

  // Fetch metrics dynamically from your live API gateway router path
  const { data: report, isLoading, error } = useQuery<MacroReportPayload>({
    queryKey: [`/api/reports/macro/${tierType}`, identifier],
    queryFn: async () => {
      const url = `/api/reports/macro/${tierType}${identifier !== "all" ? `?identifier=${encodeURIComponent(identifier)}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to process analytical matrix data payload.");
      }
      return res.json();
    }
  });

  // Prepare data streams cleanly for chart mapping engines
  const chartData = report?.thresholdCleared && report?.pillars
    ? Object.keys(report.pillars).map((key) => ({
        pillar: report.pillars[key].name.split(" & ")[0], 
        "Leader Self-Perception": report.pillars[key].leaderSelfAvg,
        "Stakeholder Reality": report.pillars[key].stakeholderAvg,
        "Blindspot Delta": report.pillars[key].blindspotDelta,
        "Cohesion Disruption (Variance)": report.pillars[key].cohesionVariance,
      }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* 🧭 ADMINISTRATIVE SELECTION & ACTION ROUTER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between pb-4 border-b gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-7 w-7 text-indigo-600" />
            SyncShift™ Systemic Alignment Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analyze delta variance metrics, perception blindspots, and structural alignment loops.
          </p>
        </div>

        {/* CONTROLS CLUSTER */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={tierType} onValueChange={(val: any) => { setTierType(val); setIdentifier("all"); }}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Select Tier Matrix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="organisation">🏢 Organisation Wide</SelectItem>
              <SelectItem value="function">📐 Functional Context</SelectItem>
              <SelectItem value="team">👥 Team Cohort</SelectItem>
            </SelectContent>
          </Select>

          {tierType !== "organisation" && (
            <Select value={identifier} onValueChange={setIdentifier}>
              <SelectTrigger className="w-[200px] bg-white shadow-sm border-slate-200">
                <SelectValue placeholder="Choose Filter Label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">View All Entries</SelectItem>
                {tierType === "function" ? (
                  <>
                    <SelectItem value="Operations">Operations Department</SelectItem>
                    <SelectItem value="Sales">Sales & Business Development</SelectItem>
                    <SelectItem value="Finance">Finance & Governance</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Senior Leadership">Senior Leadership Team (SLT)</SelectItem>
                    <SelectItem value="Project Alpha">Project Alpha Core Execution Team</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}

          {/* 🖨️ EXECUTIVE BRIEF DOWNLOAD BUTTON */}
          <button
            onClick={() => {
              const url = `/api/reports/macro/${tierType}/download${identifier !== "all" ? `?identifier=${encodeURIComponent(identifier)}` : ""}`;
              // Force direct session attachment streaming inside a safe secondary window context
              const token = localStorage.getItem("token");
              fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.blob())
                .then(blob => {
                  const blobUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = `SyncShift_${tierType}_Executive_Brief.html`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }).catch(err => console.error("Download fail:", err));
            }}
            disabled={!report?.thresholdCleared}
            className="bg-slate-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Executive Brief
          </button>
        </div>
      </div>

      {/* ⚠️ HIGH TRUST ANONYMITY SAFETY GATE GUARDRAILS */}
      {report && !report.thresholdCleared && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-950">High-Trust Statistical Suppression Active</AlertTitle>
          <AlertDescription className="text-amber-800 mt-1">
            This aggregation bounds contain metrics from only <strong>{report.leaderCount}</strong> active leader profiles. 
            Industry-standard psychometric trust rules require a minimum cohort size of <strong>5 distinct leaders</strong> 
            to prevent score mapping vector extrapolation. Data metrics will populate automatically when the cohort clears the boundary.
          </AlertDescription>
        </Alert>
      )}

      {report?.thresholdCleared && (
        <>
          {/* 📊 MACRO LEVEL OPERATIONAL METRIC SCORECARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-150 bg-white">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Leaders Measured</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{report.leaderCount}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-150 bg-white">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collected Stakeholder Loops</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{report.totalResponsesCollected}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Layers className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-150 bg-white">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evaluation Context Scope</p>
                  <p className="text-md font-bold text-slate-700 mt-2 truncate max-w-[160px]">{report.tierName}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Landmark className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-150 bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">System Core State</p>
                  <p className="text-xl font-bold mt-1 flex items-center gap-1 text-emerald-300">
                    <TrendingUp className="h-5 w-5 animate-pulse" /> Balanced Flow
                  </p>
                </div>
                <div className="p-3 bg-white/10 text-white rounded-xl"><ArrowUpRight className="h-6 w-6" /></div>
              </CardContent>
            </Card>
          </div>

          {/* ⚡ THE SYSTEMIC DELTA MAP INFOGRAPHICS MATRIX */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN A & B: PERCEPTION BLINDSPOT INTERLEAVED COMPONENT CARD */}
            <Card className="lg:col-span-2 shadow-sm border-slate-150 bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">Perception Alignment Map (Intent vs. Impact)</CardTitle>
                <CardDescription>
                  Compares collective leader self-ratings against empirical stakeholder operational assessment tracking.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="pillar" tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
                    <YAxis domain={[1, 7]} tick={{ fill: '#64748b', fontSize: 12 }} stroke="#cbd5e1" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Bar dataKey="Leader Self-Perception" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Stakeholder Reality" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* COLUMN C: COHESION INTEGRITY RADAR INDEX */}
            <Card className="shadow-sm border-slate-150 bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">Cohesion Signature Profile</CardTitle>
                <CardDescription>
                  Tracks metrics variance limits across parameters. Lower values mark tight operational uniformity.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col justify-between h-[400px]">
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" radius="75%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="pillar" tick={{ fill: '#475569', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 2]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar name="Cohesion Deviation" dataKey="Cohesion Disruption (Variance)" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.25} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs bg-slate-50 border p-3 rounded-lg text-slate-600 leading-relaxed flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>Interpretation Rule:</strong> Spikes extending toward outer rings indicate localized execution fragmentation within the corporate structure hierarchy.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SYSTEMIC FRICTION PROFILE DATA BLOCK */}
          {tierType === "organisation" && report.functionalFrictionIndex && report.functionalFrictionIndex.length > 0 && (
            <Card className="shadow-sm border-slate-150 bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">Cross-Functional Interfacial Friction Matrix</CardTitle>
                <CardDescription>
                  Measures total structural drift boundaries between operational segments.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.functionalFrictionIndex.map((item, idx) => {
                    const severityPercent = Math.min((item.frictionDelta / 2.5) * 100, 100);
                    const isHighRisk = item.frictionDelta >= 1.2;

                    return (
                      <div key={idx} className="p-4 border rounded-xl bg-slate-50 shadow-inner space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            {item.deptA} <span className="text-slate-400 font-normal">↔</span> {item.deptB}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shadow-sm ${isHighRisk ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-200/80 text-slate-700'}`}>
                            Delta Variance: {item.frictionDelta}
                          </span>
                        </div>
                        <Progress value={severityPercent} className={`h-2 shadow-sm bg-slate-200 ${isHighRisk ? '[&>div]:bg-rose-500' : '[&>div]:bg-indigo-600'}`} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
