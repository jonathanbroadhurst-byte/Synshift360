import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { 
  ShieldAlert, Users, Layers, Landmark, HelpCircle, Zap, Download 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

interface MacroReportPayload {
  tierType: "organisation" | "leadership" | "function" | "team";
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

const tierOptions: Array<{ value: string; label: string; usesIdentifier: boolean }> = [
  { value: "organisation", label: "🏢 Organisation Wide", usesIdentifier: false },
  { value: "leadership", label: "🎯 Leadership Group", usesIdentifier: true },
  { value: "function", label: "📐 Functional Context", usesIdentifier: true },
  { value: "team", label: "👥 Team Cohort", usesIdentifier: true },
];

export default function MacroReportsDashboard() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';
  const [tierType, setTierType] = useState<string>("organisation");
  const [identifier, setIdentifier] = useState<string>("all");
  const [orgId, setOrgId] = useState<string>("");

  // Owner/super_admin picks the target client organization; org-bound admins are locked to their own.
  const { data: organizations } = useQuery<any[]>({ queryKey: ['/api/organizations'] });

  // Dynamic team/function/leadership-group options for the selected org
  const activeOrgId = isOwner ? orgId : (user?.organizationId?.toString() || '');
  const { data: groupings } = useQuery<any>({
    queryKey: [`/api/organizations/${activeOrgId}/groupings`],
    enabled: !!activeOrgId,
  });

  const applyTier = (t: string) => { setTierType(t); setIdentifier('all'); };
  const effectiveOrgId = activeOrgId;

  // Fetch metrics dynamically from your live API gateway router path
  const { data: report, isLoading, error } = useQuery<MacroReportPayload>({
    queryKey: [`/api/reports/macro/${tierType}`, identifier, effectiveOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('orgId', effectiveOrgId);
      if (identifier !== 'all') params.set('identifier', identifier);
      const url = `/api/reports/macro/${tierType}?${params.toString()}`;
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

  // 📟 LIVE SYSTEM CORE STATE — computed from the actual dimension deltas in this report
  function computeCoreState(r?: MacroReportPayload): { label: string; tone: 'green' | 'amber' | 'rose'; note: string } {
    if (!r?.thresholdCleared || !r.pillars) return { label: 'Awaiting Data', tone: 'amber', note: 'No cleared cohort yet to detect systemic state.' };
    const deltas = Object.values(r.pillars).map((p) => Math.abs(p.blindspotDelta ?? 0));
    if (deltas.length === 0) return { label: 'Awaiting Data', tone: 'amber', note: 'No aligned dimensions to score yet.' };
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avgDelta < 0.5) return { label: 'Balanced Flow', tone: 'green', note: `Self-vs-stakeholder deltas average a tight ${avgDelta.toFixed(2)} across dimensions.` };
    if (avgDelta < 1.0) return { label: 'Minor Drift', tone: 'amber', note: `Perception deltas average ${avgDelta.toFixed(2)} — early misalignment signals.` };
    if (avgDelta < 1.8) return { label: 'Disturbed Flow', tone: 'rose', note: `Average delta of ${avgDelta.toFixed(2)} indicates structural misalignment.` };
    return { label: 'Severe Misalignment', tone: 'rose', note: `Average delta of ${avgDelta.toFixed(2)} — significant leader-vs-stakeholder divergence.` };
  }
  const core = computeCoreState(report);
  const coreTone = {
    green: { text: 'text-emerald-300', chip: 'bg-emerald-500/20 text-emerald-100', icon: '✓' },
    amber: { text: 'text-amber-300', chip: 'bg-amber-500/20 text-amber-100', icon: '↗' },
    rose: { text: 'text-rose-300', chip: 'bg-rose-500/20 text-rose-100', icon: '✕' },
  }[core.tone];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 max-w-7xl mx-auto space-y-6 w-full">
      
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
          {/* Org selector (owner/super_admin can target any client org) */}
          {isOwner && (
            <Select value={orgId} onValueChange={(val: any) => { setOrgId(val); setIdentifier('all'); }}>
              <SelectTrigger className="w-[200px] bg-white shadow-sm border-slate-200">
                <SelectValue placeholder={organizations?.length ? "Choose Organization" : "No orgs"} />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isOwner && (
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              Scoped to: <span className="font-semibold text-slate-700">{organizations?.find(o => o.id === user?.organizationId)?.name || 'your org'}</span>
            </div>
          )}

          <Select value={tierType} onValueChange={applyTier}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm border-slate-200">
              <SelectValue placeholder="Select Tier Matrix" />
            </SelectTrigger>
            <SelectContent>
              {tierOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
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
                  (groupings?.functions?.length ? groupings.functions : ["Operations", "Sales", "Finance"]).map((f: string) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))
                ) : (
                  (groupings?.teams?.length ? groupings.teams : ["Senior Leadership", "Project Alpha"]).map((t: string) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {/* 🖨️ EXECUTIVE BRIEF DOWNLOAD BUTTON */}
          <button
            onClick={() => {
              const params = new URLSearchParams();
              params.set('orgId', effectiveOrgId);
              if (identifier !== 'all') params.set('identifier', identifier);
              const url = `/api/reports/macro/${tierType}/download?${params.toString()}`;
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

      {/* ⚠️ NO ORG SELECTED (owner) */}
      {isOwner && !activeOrgId && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-semibold text-blue-950">Select an organization to begin</AlertTitle>
          <AlertDescription className="text-blue-800 mt-1">
            Choose a client organization from the dropdown above, then pick a reporting scope (organisation-wide, leadership group, function, or team).
          </AlertDescription>
        </Alert>
      )}

      {!isOwner && !user?.organizationId && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 mt-1">
            Your account is not bound to an organization. Contact the platform owner to assign you before generating reports.
          </AlertDescription>
        </Alert>
      )}

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

            <Card className={`shadow-sm bg-gradient-to-br ${core.tone === 'rose' ? 'from-rose-900 to-slate-900' : core.tone === 'amber' ? 'from-amber-900 to-slate-900' : 'from-indigo-900 to-slate-900'} text-white`}>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">System Core State</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${coreTone.text} ${coreTone.chip}`}>
                    {coreTone.icon} {core.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/70 leading-relaxed">{core.note}</p>
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
      </main>
    </div>
  );
}
