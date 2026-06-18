import React, { useState } from "react";

interface Question {
  id: number;
  domainName: "composure" | "social_awareness" | "connection";
  questionText: string;
}

// 🎯 THE EXACT MASTER 20 EXECUTIVE DIAGNOSTIC STATEMENTS
const MASTER_QUESTIONS: Question[] = [
  { id: 1, domainName: "composure", questionText: "I maintain physical and situational composure when unexpected operational disruptions occur." },
  { id: 2, domainName: "composure", questionText: "I pause and process my internal state before reacting to critical or frustrating professional feedback." },
  { id: 3, domainName: "composure", questionText: "I can shift my physiological tension or stress levels down intentionally during high-stakes moments." },
  { id: 4, domainName: "composure", questionText: "I handle shifting deadlines and volatile strategic direction without projecting anxiety onto others." },
  { id: 5, domainName: "social_awareness", questionText: "I actively pause before offering advice to ask if someone wants a solution or just an ear." },
  { id: 6, domainName: "social_awareness", questionText: "I notice subtle changes in team energy levels, posture, or hesitation during virtual and physical alignments." },
  { id: 7, domainName: "social_awareness", questionText: "I look for the unspoken motivations or underlying anxieties behind a stakeholder's resistance to change." },
  { id: 8, domainName: "social_awareness", questionText: "I tune out active devices and distractions to offer absolute attention when a colleague speaks to me." },
  { id: 9, domainName: "connection", questionText: "I explicitly acknowledge other people's perspectives even when they directly conflict with my own goals." },
  { id: 10, domainName: "connection", questionText: "I proactively have transparent conversations regarding relational gaps or friction before they escalate." },
  { id: 11, domainName: "connection", questionText: "I intentionally call out and validate the invisible operational work done by peers and direct supports." },
  { id: 12, domainName: "connection", questionText: "I share my own professional mistakes and lessons learned openly to model psychological safety." },
  { id: 13, domainName: "composure", questionText: "I recognize my personal somatic indicators of burnout (tightness, irritability) before they affect my choice of words." },
  { id: 14, domainName: "composure", questionText: "I step away or take temporary processing buffers when a work conversation becomes emotionally volatile." },
  { id: 15, domainName: "composure", questionText: "I protect structured thinking windows in my calendar from being eroded by non-critical issues." },
  { id: 16, domainName: "composure", questionText: "I explicitly state what I can and cannot commit to rather than accepting over-allocations silently." },
  { id: 17, domainName: "social_awareness", questionText: "I frame feedback around behavioral impacts and shared outcomes rather than personal criticisms." },
  { id: 18, domainName: "social_awareness", questionText: "I encourage quieter team members to speak up in group settings and ensure their input isn't cut off." },
  { id: 19, domainName: "connection", questionText: "I check in on colleagues as human beings during periods of intense organizational stress, not just project metrics." },
  { id: 20, domainName: "connection", questionText: "I seek out collaborative input from areas outside my immediate domain to test the validity of my assumptions." }
];

export default function EQSurvey() {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [commitments, setCommitments] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Contact, 2: Inventory, 3: Profile & Playbook, 4: Success
  const [validationError, setValidationError] = useState(false);

  const [metrics, setMetrics] = useState<{
    composure: number;
    social_awareness: number;
    connection: number;
    strengthName: string;
    strengthDesc: string;
    growthName: string;
    growthDesc: string;
    recommendation: string;
  } | null>(null);

  const handleScoreChange = (qId: number, val: number) => {
    setScores((prev) => ({ ...prev, [qId]: val }));
  };

  // Math Aggregator with Deep Content Injection
  const runDiagnosticMath = () => {
    const unanswered = MASTER_QUESTIONS.filter((q) => scores[q.id] === undefined);
    if (unanswered.length > 0) {
      setValidationError(true);
      const firstUnanswered = document.getElementById(`q-block-${unanswered[0].id}`);
      if (firstUnanswered) firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setValidationError(false);

    const sums = { composure: 0, social_awareness: 0, connection: 0 };
    const counts = { composure: 0, social_awareness: 0, connection: 0 };

    MASTER_QUESTIONS.forEach((q) => {
      sums[q.domainName] += scores[q.id];
      counts[q.domainName] += 1;
    });

    const compAvg = parseFloat((sums.composure / counts.composure).toFixed(1));
    const socialAvg = parseFloat((sums.social_awareness / counts.social_awareness).toFixed(1));
    const connAvg = parseFloat((sums.connection / counts.connection).toFixed(1));

    const meta = {
      composure: {
        name: "Situational Composure & Self-Regulation",
        desc: "Exhibits strong physiological anchors, avoiding knee-jerk reactivity during high-stress operational delays.",
        growth: "Focus on identifying physiological stress signals before speaking to avoid projecting tension.",
        rec: "Implement a explicit 3-second strategic processing pause before replying to volatile project updates."
      },
      social_awareness: {
        name: "Systemic Social Awareness & Empathy",
        desc: "Demonstrates high contextual awareness, accurately tracking team energetic shifts and silent resistance rows.",
        growth: "Needs active calibration on listening parameters to ensure team objectives aren't over-ridden by fast pacing.",
        rec: "Dedicate the opening 5 minutes of strategic alignment tables purely to stakeholder perspective listening protocols."
      },
      connection: {
        name: "Relational Connection & Psychological Safety",
        desc: "Excellence in cultivating structural trust frameworks, modeling transparency, and reducing operational friction.",
        growth: "Enhance boundaries to protect cognitive focus frames from structural overflow or erosion.",
        rec: "Design an explicit weekly bounding audit to filter non-critical team requests into structured batches."
      }
    };

    const sorted = [
      { key: "composure" as const, val: compAvg },
      { key: "social_awareness" as const, val: socialAvg },
      { key: "connection" as const, val: connAvg }
    ].sort((a, b) => b.val - a.val);

    setMetrics({
      composure: compAvg,
      social_awareness: socialAvg,
      connection: connAvg,
      strengthName: meta[sorted[0].key].name,
      strengthDesc: meta[sorted[0].key].desc,
      growthName: meta[sorted[1].key === sorted[2].key ? sorted[2].key : sorted[2].key].name,
      growthDesc: meta[sorted[2].key].growth,
      recommendation: meta[sorted[2].key].rec
    });

    setStep(3);
  };

  const submitFinalLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);

    try {
      await fetch("/api/eq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: fullName,
          leadEmail: email,
          responses: Object.entries(scores).map(([k, v]) => ({ questionId: parseInt(k), scoreValue: v })),
          commitments: Object.entries(commitments).map(([k, v]) => ({ domainName: k, commitmentText: v }))
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-2 font-sans text-gray-900">
      
      {/* STEP 1: LEAD CAPTURE */}
      {step === 1 && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-base font-semibold text-center text-gray-600 mb-6">Enter details to unlock your evaluation engine</h2>
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">Full Name</label>
            <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">Email Address</label>
            <input type="email" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button disabled={!fullName || !email} onClick={() => setStep(2)} className="w-full bg-[#0B1120] hover:bg-gray-800 text-white p-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50">
            Begin Assessment →
          </button>
        </div>
      )}

      {/* STEP 2: INVENTORY STATEMENTS */}
      {step === 2 && (
        <div className="space-y-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 font-medium sticky top-2 z-50 shadow-md">
              ⚠️ Attention required: Highlighted questions must be evaluated to process your diagnostic data.
            </div>
          )}

          {MASTER_QUESTIONS.map((q, idx) => {
            const isUnanswered = validationError && scores[q.id] === undefined;
            return (
              <div key={q.id} id={`q-block-${q.id}`} className={`p-5 rounded-xl border transition-all ${isUnanswered ? 'bg-red-50/70 border-red-300 ring-2 ring-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex gap-2 items-start mb-3">
                  <span className="text-xs font-bold text-gray-400 bg-gray-200/60 w-5 h-5 flex items-center justify-center rounded-full mt-0.5 shrink-0">{idx + 1}</span>
                  <p className="text-sm font-semibold leading-relaxed text-gray-800">{q.questionText}</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                      <input type="radio" name={`q-${q.id}`} checked={scores[q.id] === num} onChange={() => handleScoreChange(q.id, num)} className="accent-orange-500" />
                      <span>{num === 1 ? "Never" : num === 2 ? "Seldom" : num === 3 ? "Sometimes" : num === 4 ? "Usually" : "Always"} ({num})</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(1)} className="bg-white border border-gray-300 text-gray-600 px-6 py-3 rounded-lg text-sm font-semibold">Back</button>
            <button onClick={runDiagnosticMath} className="flex-1 bg-[#0B1120] hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-lg">Generate Core Metrics →</button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTS ENGINE FIRST ➔ PLAYBOOK PLACED LAST */}
      {step === 3 && metrics && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Your Emotional Intelligence Matrix</h3>
            
            <div className="space-y-4 mb-6">
              {[
                { label: "Situational Composure", score: metrics.composure, color: "bg-blue-500" },
                { label: "Systemic Social Awareness", score: metrics.social_awareness, color: "bg-orange-500" },
                { label: "Relational Connection", score: metrics.connection, color: "bg-emerald-500" }
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-gray-700">
                    <span>{bar.label}</span>
                    <span>{bar.score} / 5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className={`${bar.color} h-full transition-all duration-1000`} style={{ width: `${(bar.score / 5) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">🌟 Identified Catalyst Strength</h4>
                <p className="text-sm font-semibold text-blue-900 mb-0.5">{metrics.strengthName}</p>
                <p className="text-xs text-blue-700 leading-relaxed">{metrics.strengthDesc}</p>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">🎯 Primary Growth Horizon</h4>
                <p className="text-sm font-semibold text-amber-900 mb-0.5">{metrics.growthName}</p>
                <p className="text-xs text-amber-700 leading-relaxed">{metrics.growthDesc}</p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">💡 Strategic Coaching Recommendation</h4>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">{metrics.recommendation}</p>
              </div>
            </div>
          </div>

          {/* PLAYBOOK PLACED LAST AS AN OUTCOME OF MATURED ANALYSIS */}
          <form onSubmit={submitFinalLead} className="bg-gray-900 text-white p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h3 className="text-base font-bold mb-1 text-orange-400">Lock In Your Action Playbook</h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">Formulate your intentional micro-experiment commitment based on the recommendations above.</p>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-4">
              <h4 className="text-xs font-bold text-gray-200 mb-2">🧩 Intentional Micro-Experiment Design</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">Commit to testing the structural recommendation within your workflows over the next 14 business days.</p>
              <textarea required className="w-full h-20 p-3 bg-gray-900 text-white text-xs border border-white/20 rounded-lg focus:border-orange-400 outline-none resize-none" placeholder="e.g., I will leverage an explicit 3-second delay structure during my upcoming engineering review check-ins on Thursday..." value={commitments["social_awareness"] || ""} onChange={(e) => handleCommitmentChange("social_awareness", e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="bg-transparent border border-white/20 text-gray-300 px-5 py-2.5 rounded-lg text-xs font-semibold">Recalibrate Answers</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-orange-400 to-amber-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md">Complete Registration & Save Plan</button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: SUCCESS LAYOUT */}
      {step === 4 && (
        <div className="text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">✓</div>
          <h2 className="text-lg font-bold mb-1">Playbook Locked In Successfully</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">Thank you. Your assessment scores and actionable playbook adjustments have been securely integrated into your professional SyncShift profile ledger.</p>
        </div>
      )}

    </div>
  );
}
