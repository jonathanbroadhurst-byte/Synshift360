import React, { useState } from "react";

interface Question {
  id: number;
  domainName: "self_awareness" | "self_management" | "social_awareness" | "relationship_management";
  questionText: string;
}

// 🎯 UNIVERSALLY ACCESSIBLE 20 MASTER STATEMENTS (No jargon, open to anyone)
const MASTER_QUESTIONS: Question[] = [
  // 1. Self-Awareness (Knowing your own patterns, feelings, and limits)
  { id: 2, domainName: "self_awareness", questionText: "I notice how tension or frustration builds up in my body before it changes my choice of words." },
  { id: 3, domainName: "self_awareness", questionText: "I am aware of my immediate emotional triggers when someone criticizes or corrects me." },
  { id: 13, domainName: "self_awareness", questionText: "I recognize the early signs of emotional exhaustion in myself before I reach a breaking point." },
  { id: 14, domainName: "self_awareness", questionText: "I know when I need to step away from a heated conversation to clear my head before responding." },
  { id: 15, domainName: "self_awareness", questionText: "I can spot when my personal habits or routines are starting to slip due to stress." },

  // 2. Self-Management (Staying calm, steady, and handling personal boundaries)
  { id: 1, domainName: "self_management", questionText: "I can pause and calm myself down quickly when unexpected daily disruptions happen." },
  { id: 4, domainName: "self_management", questionText: "I cope well with sudden plans changing without letting my frustration ruin the mood for others." },
  { id: 16, domainName: "self_management", questionText: "I can say a clear, polite 'no' to extra favors or requests when my schedule is already full." },
  { id: 17, domainName: "self_management", questionText: "When addressing an issue, I focus on what actually happened rather than blaming someone's character." },
  { id: 18, domainName: "self_management", questionText: "I actively resist the urge to interrupt people, even when I strongly disagree with what they are saying." },

  // 3. Social Awareness (Active listening, picking up on cues, and empathy)
  { id: 5, domainName: "social_awareness", questionText: "I listen to others without immediately jumping in to offer advice or fix their problems." },
  { id: 6, domainName: "social_awareness", questionText: "I easily notice when a friend or family member's tone or body language shifts, signaling they might be upset." },
  { id: 7, domainName: "social_awareness", questionText: "I try to understand the hidden worries or motivations behind why someone is acting defensive." },
  { id: 8, domainName: "social_awareness", questionText: "I can put away my phone or distractions and give someone my completely undivided attention." },
  { id: 20, domainName: "social_awareness", questionText: "I look at situations from other people's cultural or personal backgrounds to understand their point of view." },

  // 4. Relationship Management (Building trust, resolving friction, and connecting)
  { id: 9, domainName: "relationship_management", questionText: "I can genuinely acknowledge someone else's point of view, even when it directly clashes with my own." },
  { id: 10, domainName: "relationship_management", questionText: "I address misunderstandings or relational friction early on, rather than letting them quietly simmer." },
  { id: 11, domainName: "relationship_management", questionText: "I regularly go out of my way to express appreciation for the small things people do for me." },
  { id: 12, domainName: "relationship_management", questionText: "I am comfortable admitting when I am wrong or when I've made a mistake." },
  { id: 19, domainName: "relationship_management", questionText: "I check in on the people in my life to see how they are doing as human beings, not just to coordinate tasks." }
];

// 🧠 NATURAL, PRACTICAL INSIGHT MATRIX (No heavy jargon or stereotypes)
const DOMAIN_INSIGHT_MATRIX = {
  self_awareness: {
    title: "Self-Awareness",
    high: { analysis: "You have a strong sense of your personal limits, emotional triggers, and stress levels. You know exactly when you are reaching capacity.", action: "Keep checking in with yourself during busy periods, and use this skill to help model healthy working limits for your team." },
    mid: { analysis: "You generally know how you are feeling, but when work gets chaotic, you might ignore your early stress signals until you are already overwhelmed.", action: "Set a quick daily reminder to pause for a moment and check your energy levels before heading into long meetings." },
    low: { analysis: "You tend to push through stress without noticing the toll it takes on you, which can lead to sudden exhaustion or frustration before you realize it.", action: "Pick one or two early physical signs of stress—like a tight jaw or shallow breathing—and use them as cues to step away for a five-minute break." }
  },
  self_management: {
    title: "Self-Management",
    high: { analysis: "You are highly skilled at staying steady and calm when plans change or under pressure, meaning you don't pass your stress onto the people around you.", action: "Share your strategies with your team. Let them know how you structure your time and keep your focus clear when deadlines shift." },
    mid: { analysis: "You manage your reactions well most of the time, but sustained pressure or a sudden rush of unexpected changes can make it hard to keep your footing.", action: "When an urgent issue lands on your desk, give yourself a clear 60-second pause to process the change before you give your final answer." },
    low: { analysis: "When timelines get tight or disruptions happen, your immediate stress can show up as sharp reactions, which can make your team feel anxious or hesitant.", action: "Separate the initial discussion of a problem from the actual decision-making loop. Take a short walk to reset your thoughts before committing to a fix." }
  },
  social_awareness: {
    title: "Social Awareness",
    high: { analysis: "You excel at reading the room, listening deeply to what isn't being said, and spotting hidden concerns or disagreements early on.", action: "Use this perspective to draw out quieter team members, ensuring everyone has a chance to share their thoughts safely." },
    mid: { analysis: "You are a good listener, but when you are moving quickly to hit a target, you might miss subtle signs of hesitation or fatigue in others.", action: "Before wrapping up a project update, explicitly ask: 'Is there any part of this plan that feels unrealistic or missing?'" },
    low: { analysis: "You often focus heavily on direct tasks and deadlines, which can cause you to overlook team dynamics or skip checking if people are truly aligned.", action: "Focus on asking open questions rather than jumping straight to solutions. Try starting conversations with: 'How is this workload feeling for you right now?'" }
  },
  relationship_management: {
    title: "Relationship Management",
    high: { analysis: "You build strong, open relationships based on mutual trust, handle friction constructively, and openly share mistakes to help others learn.", action: "Continue creating open feedback loops, and consider mentoring peers on how to handle difficult conversations smoothly." },
    mid: { analysis: "You build friendly, collaborative relationships, but you might tend to avoid addressing friction directly, letting small issues simmer for too long.", action: "When you notice an active disagreement or misunderstanding, address it kindly within 48 hours rather than waiting for it to clear up on its own." },
    low: { analysis: "Communication breakdowns or silos are creating a lot of friction, and disagreements are often handled through quick dictates rather than open discussion.", action: "Schedule regular, informal catch-ups with key colleagues that aren't tied to an active project milestone, focusing purely on building open communication." }
  }
};

export default function EQSurvey() {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [commitments, setCommitments] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); 
  const [validationError, setValidationError] = useState(false);

  const [processedResults, setProcessedResults] = useState<Array<{
    key: "self_awareness" | "self_management" | "social_awareness" | "relationship_management";
    title: string;
    score: number;
    analysis: string;
    action: string;
    color: string;
  }> | null>(null);

  const handleScoreChange = (qId: number, val: number) => {
    setScores((prev) => ({ ...prev, [qId]: val }));
  };

  const handleCommitmentChange = (domain: string, text: string) => {
    setCommitments((prev) => ({ ...prev, [domain]: text }));
  };

  const runDiagnosticEngine = () => {
    const unanswered = MASTER_QUESTIONS.filter((q) => scores[q.id] === undefined);
    if (unanswered.length > 0) {
      setValidationError(true);
      const firstUnanswered = document.getElementById(`q-block-${unanswered[0].id}`);
      if (firstUnanswered) firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setValidationError(false);

    const sums = { self_awareness: 0, self_management: 0, social_awareness: 0, relationship_management: 0 };
    const counts = { self_awareness: 0, self_management: 0, social_awareness: 0, relationship_management: 0 };

    MASTER_QUESTIONS.forEach((q) => {
      sums[q.domainName] += scores[q.id];
      counts[q.domainName] += 1;
    });

    const domainsKeys: Array<"self_awareness" | "self_management" | "social_awareness" | "relationship_management"> = ["self_awareness", "self_management", "social_awareness", "relationship_management"];
    const colors = { self_awareness: "bg-blue-500", self_management: "bg-indigo-500", social_awareness: "bg-orange-500", relationship_management: "bg-emerald-500" };

    const mappedData = domainsKeys.map((key) => {
      const avg = parseFloat((sums[key] / counts[key]).toFixed(1));
      const config = DOMAIN_INSIGHT_MATRIX[key];
      
      let level: "high" | "mid" | "low" = "mid";
      if (avg >= 4.0) level = "high";
      else if (avg < 2.5) level = "low";

      return {
        key,
        title: config.title,
        score: avg,
        analysis: config[level].analysis,
        action: config[level].action,
        color: colors[key]
      };
    });

    setProcessedResults(mappedData.sort((a, b) => b.score - a.score));
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
    <div className="p-1 font-sans text-gray-900">
      
      {/* STEP 1: INITIAL LEAD CAPTURE */}
      {step === 1 && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-sm font-semibold text-center text-gray-500 mb-6">Enter your details to unlock the 20-point diagnostic feedback form</h2>
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
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 font-semibold sticky top-2 z-50 shadow-md">
              ⚠️ Please look below: Highlighted statements need a score before your profile can be calculated.
            </div>
          )}

          {MASTER_QUESTIONS.map((q, idx) => {
            const isUnanswered = validationError && scores[q.id] === undefined;
            return (
              <div key={q.id} id={`q-block-${q.id}`} className={`p-4 rounded-xl border transition-all ${isUnanswered ? 'bg-red-50/80 border-red-300 ring-2 ring-red-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex gap-2 items-start mb-2">
                  <span className="text-[11px] font-bold text-gray-400 bg-gray-200/60 w-5 h-5 flex items-center justify-center rounded-full mt-0.5 shrink-0">{idx + 1}</span>
                  <p className="text-sm font-semibold leading-relaxed text-gray-800">{q.questionText}</p>
                </div>
                <div className="flex flex-wrap gap-3.5 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="flex items-center gap-1 cursor-pointer text-xs font-medium text-gray-600">
                      <input type="radio" name={`q-${q.id}`} checked={scores[q.id] === num} onChange={() => handleScoreChange(q.id, num)} className="accent-orange-500" />
                      <span>{num === 1 ? "Never" : num === 2 ? "Seldom" : num === 3 ? "Sometimes" : num === 4 ? "Usually" : "Always"} ({num})</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep(1)} className="bg-white border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-semibold">Back</button>
            <button onClick={runDiagnosticEngine} className="flex-1 bg-[#0B1120] hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg">Generate My Profile →</button>
          </div>
        </div>
      )}

      {/* STEP 3: CLEAN 4-BAR PROFILE VIEW */}
      {step === 3 && processedResults && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <div className="border-b border-gray-100 pb-3 mb-6">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-1">Your Diagnostic Summary</span>
              <h3 className="text-lg font-bold text-gray-900">Your Emotional Intelligence Baseline</h3>
            </div>
            
            {/* 4 Graphical Bars */}
            <div className="space-y-4 mb-8 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {processedResults.map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between text-xs font-bold mb-1 text-gray-700">
                    <span>{item.title}</span>
                    <span className="text-gray-900">{item.score} / 5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: `${(item.score / 5) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Structured Real-World Feedback Blocks */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Domain Insights & Recommendations</h4>
            <div className="space
