import { db } from "./db";
import { users, organizations, surveys } from "@shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create sample organization
    const [organization] = await db.insert(organizations).values({
      name: "Demo Organization",
      domain: "demo.com",
      isActive: true,
    }).returning();

    console.log("Created organization:", organization.name);

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      email: "admin@demo.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      role: "admin",
      organizationId: organization.id,
    }).returning();

    console.log("Created admin user:", adminUser.email);

    // Create sample leader
    const leaderPassword = await bcrypt.hash("leader123", 10);
    const [leaderUser] = await db.insert(users).values({
      email: "leader@demo.com",
      username: "leader",
      firstName: "Jane",
      lastName: "Leader",
      password: leaderPassword,
      role: "leader",
      organizationId: organization.id,
    }).returning();

    console.log("Created leader user:", leaderUser.email);

    // Create SyncShift 360 Survey based on provided questionnaire
    const syncShiftQuestions = [
      // Leadership (Direction & Sense-Making)
      {
        id: "1",
        text: "Clearly communicates a compelling vision that connects day-to-day work to bigger goals.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "2",
        text: "Helps people make sense of change and what it means for them.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "3",
        text: "Adjusts strategy and direction when needed and explains why.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "4",
        text: "Influences and gains buy-in through trust and credibility.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "5",
        text: "Communicates clearly and listens actively.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Infrastructure (Systems & Delivery)
      {
        id: "6",
        text: "Holds self and others accountable for results.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "7",
        text: "Regularly reviews workflows to remove friction and blockers.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "8",
        text: "Delegates tasks appropriately, building ownership and trust.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "9",
        text: "Prioritises and simplifies systems to help people do their best work.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Motives (Purpose & Authenticity)
      {
        id: "10",
        text: "Acts consistently with clear values and integrity.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "11",
        text: "Demonstrates self-awareness and openness to feedback.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "12",
        text: "Builds psychological safety for people to share ideas and concerns.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "13",
        text: "Stays calm and solution-focused during challenges.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Capabilities (Skills & Agility)
      {
        id: "14",
        text: "Tackles problems with curiosity and sound judgement.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "15",
        text: "Seeks out learning opportunities and encourages growth in others.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "16",
        text: "Coaches and supports people to build skills and confidence.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "17",
        text: "Shows adaptability when plans change.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Culture (Team & Norms)
      {
        id: "18",
        text: "Builds trust and openness within the team.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "19",
        text: "Encourages diverse perspectives and collaboration.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "20",
        text: "Gives and seeks feedback regularly to improve performance.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "21",
        text: "Acts in ways that strengthen a healthy culture.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Personal Brand (Impact & Reputation)
      {
        id: "22",
        text: "Communicates with clarity and presence.",
        type: "rating",
        category: "Personal Brand",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "23",
        text: "Builds strong working relationships across levels.",
        type: "rating",
        category: "Personal Brand",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "24",
        text: "Follows through on commitments and builds trust.",
        type: "rating",
        category: "Personal Brand",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Alignment (Outcome)
      {
        id: "25",
        text: "Regularly checks for areas where people, systems, and purpose may be out of sync.",
        type: "rating",
        category: "Alignment",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "26",
        text: "Takes action to realign when friction is identified.",
        type: "rating",
        category: "Alignment",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      // Open Text Questions
      {
        id: "27",
        text: "What are this leader's greatest strengths?",
        type: "text",
        category: "Open Questions"
      },
      {
        id: "28",
        text: "Where could they make a small shift to create better alignment and flow?",
        type: "text",
        category: "Open Questions"
      },
      {
        id: "29",
        text: "Any other feedback you'd like to share?",
        type: "text",
        category: "Open Questions"
      }
    ];

    const [survey] = await db.insert(surveys).values({
      title: "SyncShift Organisation Alignment",
      description: "SyncShift explains how high performance emerges from the alignment of personal and organisational enablers. Key Features: Simple online diagnostic, Visual insights, Actionable recommendations, Clear pathways to high performance.",
      organizationId: organization.id,
      createdBy: adminUser.id,
      questions: syncShiftQuestions,
      isActive: true,
    }).returning();

    console.log("Created SyncShift 360 Survey:", survey.title);

    console.log("\nDatabase seeding completed successfully!");
    console.log("\nTest Accounts:");
    console.log("Admin: admin@demo.com / admin123");
    console.log("Leader: leader@demo.com / leader123");
    
    return {
      organization,
      adminUser,
      leaderUser,
      survey
    };

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
seedDatabase().then(() => {
  console.log("Seeding completed");
  process.exit(0);
}).catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});