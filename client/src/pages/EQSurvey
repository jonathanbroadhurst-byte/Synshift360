import React, { useState, useEffect } from "react";

interface Question {
  id: number;
  domainName: string;
  questionText: string;
}

export default function EQSurvey() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [commitments, setCommitments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Lead Capture State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // Step 1: Contact Info, Step 2: Survey

  useEffect(() => {
    fetch("/api/eq/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error("Error loading questions", err));
  }, []);

  const handleScoreChange = (questionId: number, value: number) => {
    setScores((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCommitmentChange = (domain: string, text: string) => {
    setCommitments((prev) => ({ ...prev, [domain]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedResponses = Object.entries(scores).map(([qId, val]) => ({
      questionId: parseInt(qId),
      scoreValue: val,
    }));

    const formattedCommitments = Object.entries(commitments).map(([domain, text]) => ({
      domainName: domain,
      commitmentText: text,
    }));

    try {
      const response = await fetch("/api/eq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Pass the captured lead contact details down to the server context
          leadName: fullName,
          leadEmail: email,
          responses: formattedResponses,
          commitments: formattedCommitments,
        }),
      });

      if (response.ok) setSubmitted(true);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "40px", maxWidth: "600px", margin: "40px auto", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "24px", color: "#111" }}>Thank you, {fullName}! 🎉</h2>
        <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.6" }}>Your personalized EQ Playbook has been securely generated and saved to your profile. We will check in via <strong>{email}</strong> in 14 days to see how your real-world micro-experiments are progressing!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", color: "#111" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Emotional Intelligence (EQ) Blueprint</h1>
        <p style={{ color: "#666", fontSize: "16px" }}>Explore your professional habits, composure loops, and situational connection parameters.</p>
      </div>

      {step === 1 ? (
        /* --- STEP 1: LEAD CAPTURE ENTRY FORM --- */
        <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px", textAlign: "center" }}>Enter your details to unlock the inventory</h2>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Full Name</label>
            <input 
              type="text" 
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
              placeholder="e.g. Alex Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email Address</label>
            <input 
              type="email" 
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
              placeholder="e.g. alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            disabled={!fullName || !email}
            onClick={() => setStep(2)}
            style={{ width: "100%", background: "#000", color: "#fff", padding: "12px", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer", fontWeight: "bold", opacity: (!fullName || !email) ? 0.5 : 1 }}
          >
            Begin Assessment →
          </button>
        </div>
      ) : (
        /* --- STEP 2: THE LIVE ASSESSMENT MATRIX --- */
        <form onSubmit={handleSubmit}>
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "20px", background: "#f9f9f9", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
              <p style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 12px 0" }}>{q.questionText}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={num}
                      checked={scores[q.id] === num}
                      onChange={() => handleScoreChange(q.id, num)}
                      required
                    />
                    {num === 1 && "Never (1)"}
                    {num === 2 && "Seldom (2)"}
                    {num === 3 && "Sometimes (3)"}
                    {num === 4 && "Usually (4)"}
                    {num === 5 && "Always (5)"}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* --- COMMITMENTS / ACTION PLAN SECTION --- */}
          <h2 style={{ marginTop: "40px", borderBottom: "2px solid #eaeaea", paddingBottom: "10px" }}>Your Action Playbook</h2>
          
          <div style={{ marginBottom: "25px", background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>🧩 Social Awareness Focus</h3>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.5" }}>The next time someone shares a frustration with you, pause before offering advice and ask: <strong>"Do you need me to help you find a solution, or do you just need me to listen?"</strong></p>
            <textarea
              style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
              placeholder="Type your specific plan here... (e.g., I will practice this phrase during my team alignment check-in on Thursday.)"
              value={commitments["social_awareness"] || ""}
              onChange={(e) => handleCommitmentChange("social_awareness", e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
            <button type="button" onClick={() => setStep(1)} style={{ background: "#fff", color: "#666", padding: "12px 24px", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer" }}>
              Back
            </button>
            <button type="submit" style={{ background: "#000", color: "#fff", padding: "12px 24px", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer", fontWeight: "bold", flex: 1 }}>
              Save My Playbook
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
