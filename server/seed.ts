import { db } from "./db";
import { users, organizations, surveys } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    console.log("Clearing old test data safely via cascade...");
    await db.execute(sql`TRUNCATE TABLE survey_cycles, surveys, users, organizations CASCADE;`);

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

    // Create SyncShift 360 Survey based on updated behavior-focused framework
    const syncShiftQuestions = [
      // LAYER 1: MOTIVES (Purpose & Authenticity)
      {
        id: "1",
        text: "This leader stays true to our core organizational values even when faced with high-pressure situations or difficult trade-offs.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "2",
        text: "This leader actively encourages others to challenge their assumptions and is genuinely open to changing their mind when presented with better evidence.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "3",
        text: "This leader creates an environment where people feel safe to speak the truth, admit mistakes, or voice dissenting opinions without fear of negative consequences.",
        type: "rating",
        category: "Motives",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 2: THINKING (Cognitive Bandwidth)
      {
        id: "4",
        text: "This leader focuses on helping the team think through solutions rather than immediately stepping in to dictate exactly how tasks should be executed.",
        type: "rating",
        category: "Thinking",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "5",
        text: "When problems arise, this leader looks at why the process or system broke down, rather than immediately searching for an individual to blame.",
        type: "rating",
        category: "Thinking",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 3: CAPABILITIES (Agility & Innovation)
      {
        id: "6",
        text: "This leader approaches ambiguous or unfamiliar challenges with genuine curiosity, seeking out hidden patterns before jumping to conclusions.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "7",
        text: "This leader models a strong commitment to learning and helps team members continuously update their skills to match changing demands.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "8",
        text: "This leader demonstrates high agility, showing a willingness to quickly drop outdated strategies when conditions change.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "9",
        text: "This leader effectively integrates new digital tools and automated technologies to help the team work smarter and make better data-informed decisions.",
        type: "rating",
        category: "Capabilities",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 4: CULTURE (Trust & Coherence)
      {
        id: "10",
        text: "This leader actively works to build deep trust within the team, serving as a reliable and stabilizing presence.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "11",
        text: "This leader intentionally draws out different viewpoints from everyone in the room, ensuring quiet or alternative perspectives are genuinely heard before decisions are finalized.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "12",
        text: "This leader creates fast, constructive feedback loops, ensuring praise and course corrections are shared openly and in real-time.",
        type: "rating",
        category: "Culture",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 5: INFRASTRUCTURE (Systems & Flow)
      {
        id: "13",
        text: "This leader sets clear expectations for performance and ensures everyone takes personal ownership of their collective output.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "14",
        text: "This leader actively removes unnecessary administrative steps, redundant meetings, or procedural hurdles that block the team from getting work done.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "15",
        text: "This leader empowers people to move fast and make decisions within their roles, avoiding the need for constant check-ins or multiple layers of approval.",
        type: "rating",
        category: "Infrastructure",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 6: LEADERSHIP (Sense-Making & Pattern Reading)
      {
        id: "16",
        text: "When unexpected changes or disruptions occur outside our organization, this leader quickly explains what those changes mean for our day-to-day priorities.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "17",
        text: "Instead of pretending to have all the answers, this leader asks thought-provoking questions that help the team solve complex challenges together.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "18",
        text: "This leader helps us clearly see how our team’s daily efforts directly impact and rely on other parts of the business.",
        type: "rating",
        category: "Leadership",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // LAYER 7: SIGNATURE CONTRIBUTION (Outcomes & Alignment)
      {
        id: "19",
        text: "This leader communicates with authentic presence and builds highly effective partnerships across different areas of the organization.",
        type: "rating",
        category: "Signature Contribution",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "20",
        text: "This leader ensures our team’s daily efforts are perfectly aligned with our true purpose, quickly identifying and correcting areas where work is being duplicated or wasted.",
        type: "rating",
        category: "Signature Contribution",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },
      {
        id: "21",
        text: "When operational friction or dropped handoffs occur between teams, this leader steps in immediately to rebuild collaboration and smooth out the transition points.",
        type: "rating",
        category: "Signature Contribution",
        scale: { min: 1, max: 7, labels: { 1: "Strongly Disagree", 7: "Strongly Agree" } }
      },

      // OPEN-TEXT ALIGNMENT PROMPTS
      {
        id: "22",
        text: "What are this leader's greatest strengths in creating clarity, stability, and trust for the team?",
        type: "text",
        category: "Open Questions"
      },
      {
        id: "23",
        text: "Where could this leader make a small behavioral shift to reduce system friction or better protect the team's mental bandwidth?",
        type: "text",
        category: "Open Questions"
      },
      {
        id: "24",
        text: "Any other feedback or observations you would like to share regarding this leader's alignment?",
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
    
    return { organization, adminUser, leaderUser, survey };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
