import { db } from "./db";
import { surveys } from "@shared/schema";

const quantumQuestions = {
  "Cognitive Agility": [
    "Thinks things through before reacting.",
    "Adjusts thinking when things change.",
    "Stays open-minded and avoids jumping to conclusions."
  ],
  "Trust Intelligence": [
    "Communicates honestly and keeps promises.",
    "Treats people fairly.",
    "Creates an environment where people feel safe to speak up."
  ],
  "Systems Awareness": [
    "Considers how decisions affect others.",
    "Connects the dots across teams or functions.",
    "Identifies problems early."
  ],
  "Adaptive Communication": [
    "Explains things clearly.",
    "Listens actively.",
    "Stays calm during difficult conversations."
  ],
  "Emotional Regulation & Resilience": [
    "Stays steady under pressure.",
    "Manages emotional reactions well.",
    "Recovers quickly from setbacks."
  ],
  "Ethical Anchoring": [
    "Acts with integrity.",
    "Speaks up when something feels wrong.",
    "Maintains healthy boundaries."
  ],
  "Coherence Leadership": [
    "Provides clear direction.",
    "Acts consistently.",
    "Helps the team stay aligned."
  ],
  "Change Navigation": [
    "Stays positive during change.",
    "Helps others adapt.",
    "Adjusts quickly when priorities shift."
  ],
  "Creative Problem Solving & Innovation": [
    "Looks for new ways to solve problems.",
    "Encourages others to share ideas.",
    "Challenges unhelpful old habits."
  ],
  "Human Energy Stewardship": [
    "Manages workload in a healthy way.",
    "Notices when others feel overwhelmed.",
    "Helps the team focus on what matters."
  ]
};

const maturityCategories = {
  "Reactive": { min: 1, max: 3, description: "Reactive leadership - responds to immediate challenges" },
  "Transitional": { min: 4, max: 6, description: "Transitional leadership - building new capabilities" },
  "Adaptive": { min: 7, max: 8, description: "Adaptive leadership - proactive and flexible" },
  "Quantum": { min: 9, max: 10, description: "Quantum leadership - transformative and visionary" }
};

async function seedQuantumSurvey() {
  try {
    console.log("Seeding Quantum Leadership Calibration 360 survey...");

    // Format questions for database
    const formattedQuestions = Object.entries(quantumQuestions).map(([competency, questions]) => ({
      competency,
      questions: questions.map((text, index) => ({
        id: `${competency.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
        text,
        type: 'rating',
        scaleMin: 1,
        scaleMax: 10
      }))
    }));

    await db.insert(surveys).values({
      title: "Quantum Leadership Calibration 360",
      description: "A comprehensive leadership assessment tool measuring 10 core competencies across 4 maturity levels (Reactive, Transitional, Adaptive, Quantum).",
      surveyType: "quantum",
      scaleMin: 1,
      scaleMax: 10,
      questions: formattedQuestions,
      maturityCategories: maturityCategories,
      organizationId: 1,
      createdBy: 1,
      isActive: true
    });

    console.log("✅ Quantum survey seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding Quantum survey:", error);
    throw error;
  }
}

seedQuantumSurvey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
