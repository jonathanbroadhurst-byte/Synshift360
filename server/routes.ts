import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import * as mailjetEmail from "./mailjet";
import * as resendEmail from "./resend";
import { generateSyncShiftReportData, generateMacroTierReport } from "./services/reporting";
import { compileSyncShiftHtmlReport } from "./services/pdfTemplate";
import { compileMacroHtmlReport } from "./services/macroPdfTemplate"; 
import { 
  insertUserSchema, 
  insertOrganizationSchema, 
  insertSurveySchema, 
  insertSurveyCycleSchema, 
  insertSurveyInvitationSchema, 
  insertSurveyResponseSchema, 
  type User, 
  users, 
  surveys, 
  organizations, 
  surveyCycles, 
  surveyInvitations, 
  surveyResponses, 
  reports, 
  auditLog,
  eqQuestions,
  eqResponses,
  eqCommitments 
} from "@shared/schema";

// =========================================================================
// 🛠️ SELF-HEALING DATABASE SCHEMA LAYER
// =========================================================================
async function ensureSchemaUpToDate() {
  try {
    console.log("🔍 Checking database column structure alignments...");
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quantum_credits INTEGER DEFAULT 0 NOT NULL;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name TEXT;`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS eq_questions (
        id SERIAL PRIMARY KEY,
        domain_name TEXT NOT NULL,
        question_text TEXT NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS eq_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        score_value INTEGER NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS eq_commitments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        domain_name TEXT NOT NULL,
        commitment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`ALTER TABLE eq_responses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await db.execute(sql`ALTER TABLE eq_responses ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await db.execute(sql`ALTER TABLE eq_commitments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;`);

    // Per-survey credit pricing + independent per-org/per-survey credit wallets
    await db.execute(sql`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS credit_price INTEGER DEFAULT 1;`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_credit_balances (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        survey_type TEXT NOT NULL,
        credits INTEGER DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, survey_type)
      );
    `);
    console.log("⚡ Column structures and EQ tables verified or injected successfully into PostgreSQL cells.");
  } catch (error) {
    console.error("⚠️ Schema auto-alignment encountered an issue:", error);
  }
}

// =========================================================================
// 🌱 SEEDER OPERATIONS
// =========================================================================
async function ensureQuantumTemplateExists() {
  try {
    const existingTemplate = await db.select().from(surveys).where(eq(surveys.surveyType, "quantum")).limit(1);
    if (existingTemplate.length === 0) {
      await db.insert(surveys).values({
        title: "Quantum Leadership Calibration 360",
        surveyType: "quantum", 
        isActive: true,
        questions: [
          { id: 1, pillar: "Direction", text: "Articulates long-range vision amid high volatility.", scale: 10 },
          { id: 2, pillar: "Systems", text: "Optimizes infrastructure loops for execution flow.", scale: 10 },
          { id: 3, pillar: "Purpose", text: "Aligns structural choices with shared core intentions.", scale: 10 },
          { id: 4, pillar: "Skills", text: "Demonstrates strategic dexterity under changing demands.", scale: 10 },
          { id: 5, pillar: "Team", text: "Cultivates structural safety and relational trust parameters.", scale: 10 },
          { id: 6, pillar: "Impact", text: "Translates leadership behaviors into measurable corporate momentum.", scale: 10 }
        ]
      });
    }
  } catch (error) {
    console.error("Fault encountered during template pre-seeder execution:", error);
  }
}

// ⭐ THE FULL 27-QUESTION SYNCSHIFT ORGANISATION ALIGNMENT TEMPLATE
// Mirrors the question set the ignite-me test data actually used (IDs 1-26 rating + 27-29 text)
async function ensureSyncShiftTemplateExists() {
  try {
    const [existing] = await db.select().from(surveys).where(eq(surveys.surveyType, "syncshift")).limit(1);
    if (existing) return;
    await db.insert(surveys).values({
      title: "SyncShift Organisation Alignment",
      surveyType: "syncshift",
      isActive: true,
      scaleMax: 7,
      creditPrice: 1,
      questions: [
        { id: 1, type: "rating", category: "Leadership", text: "Communicates a clear vision and direction for the team/organization", scale: 7 },
        { id: 2, type: "rating", category: "Leadership", text: "Makes sense of complex situations and provides clarity", scale: 7 },
        { id: 3, type: "rating", category: "Leadership", text: "Demonstrates strategic thinking and planning", scale: 7 },
        { id: 4, type: "rating", category: "Leadership", text: "Inspires confidence and trust in their leadership", scale: 7 },
        { id: 5, type: "rating", category: "Leadership", text: "Effectively leads through change and uncertainty", scale: 7 },
        { id: 6, type: "rating", category: "Infrastructure", text: "Builds and maintains effective systems and processes", scale: 7 },
        { id: 7, type: "rating", category: "Infrastructure", text: "Ensures consistent delivery of results", scale: 7 },
        { id: 8, type: "rating", category: "Infrastructure", text: "Creates structure that enables team effectiveness", scale: 7 },
        { id: 9, type: "rating", category: "Infrastructure", text: "Manages resources and priorities effectively", scale: 7 },
        { id: 10, type: "rating", category: "Motives", text: "Demonstrates authentic leadership style", scale: 7 },
        { id: 11, type: "rating", category: "Motives", text: "Shows genuine care for team members and stakeholders", scale: 7 },
        { id: 12, type: "rating", category: "Motives", text: "Acts with integrity and ethical principles", scale: 7 },
        { id: 13, type: "rating", category: "Motives", text: "Drives purpose and meaning in work", scale: 7 },
        { id: 14, type: "rating", category: "Capabilities", text: "Demonstrates relevant technical/functional expertise", scale: 7 },
        { id: 15, type: "rating", category: "Capabilities", text: "Adapts quickly to new situations and challenges", scale: 7 },
        { id: 16, type: "rating", category: "Capabilities", text: "Continuously learns and develops new skills", scale: 7 },
        { id: 17, type: "rating", category: "Capabilities", text: "Applies sound judgment in decision-making", scale: 7 },
        { id: 18, type: "rating", category: "Culture", text: "Builds strong, collaborative relationships", scale: 7 },
        { id: 19, type: "rating", category: "Culture", text: "Creates an inclusive and psychologically safe environment", scale: 7 },
        { id: 20, type: "rating", category: "Culture", text: "Develops and mentors team members effectively", scale: 7 },
        { id: 21, type: "rating", category: "Culture", text: "Promotes positive team dynamics and culture", scale: 7 },
        { id: 22, type: "rating", category: "Personal Brand", text: "Has a strong professional reputation", scale: 7 },
        { id: 23, type: "rating", category: "Personal Brand", text: "Communicates effectively across all levels", scale: 7 },
        { id: 24, type: "rating", category: "Personal Brand", text: "Creates positive impact and influence", scale: 7 },
        { id: 25, type: "rating", category: "Alignment", text: "Aligns actions with organizational goals and values", scale: 7 },
        { id: 26, type: "rating", category: "Alignment", text: "Delivers outcomes that meet stakeholder expectations", scale: 7 },
        { id: 27, type: "text", text: "What are this leader's greatest strengths?" },
        { id: 28, type: "text", text: "What are some small shifts this leader could make to create better alignment with team/organizational goals?" },
        { id: 29, type: "text", text: "Any additional feedback or comments?" }
      ]
    });
    await db.execute(sql`UPDATE surveys SET credit_price = 1 WHERE survey_type = 'syncshift';`);
    console.log("⭐ SyncShift Organisation Alignment (27-question) template seeded.");
  } catch (error) {
    console.error("Fault during SyncShift template seeder:", error);
  }
}

// 🧠 EQ 360 TEMPLATE — deployable emotional-intelligence 360 via the same credit + reporting flow
async function ensureEQ360TemplateExists() {
  try {
    const [existing] = await db.select().from(surveys).where(eq(surveys.surveyType, "eq360")).limit(1);
    if (existing) return;
    console.log("🧠 Seeding EQ 360 template...");
    const eqQ = await db.select().from(eqQuestions).orderBy(eqQuestions.id);
    const questions = eqQ.map((q, idx) => ({
      id: idx + 1,
      type: "rating",
      category: q.domainName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      text: q.questionText,
      scale: 5,
    }));
    await db.insert(surveys).values({
      title: "EQ 360 Leadership Assessment",
      surveyType: "eq360",
      isActive: true,
      scaleMax: 5,
      creditPrice: 1,
      questions,
    });
    await db.execute(sql`UPDATE surveys SET credit_price = 1 WHERE survey_type = 'eq360';`);
    console.log("🧠 EQ 360 template seeded (" + questions.length + " questions).");
  } catch (error) {
    console.error("Fault during EQ 360 template seeder:", error);
  }
}

async function ensureEQQuestionsExist() {
  try {
    console.log("🌱 Cleaning old test parameters and seeding Master Universal 20 EQ Questions...");
    await db.execute(sql`TRUNCATE TABLE eq_questions RESTART IDENTITY CASCADE;`);
    const baselineQuestions = [
      { domainName: "self_awareness", questionText: "I notice how tension or frustration builds up in my body before it changes my choice of words." },
      { domainName: "self_awareness", questionText: "I am aware of my immediate emotional triggers when someone criticizes or corrects me." },
      { domainName: "self_awareness", questionText: "I recognize the early signs of emotional exhaustion in myself before I reach a breaking point." },
      { domainName: "self_awareness", questionText: "I know when I need to step away from a heated conversation to clear my head before responding." },
      { domainName: "self_awareness", questionText: "I can spot when my personal habits or routines are starting to slip due to stress." },
      { domainName: "self_management", questionText: "I can pause and calm myself down quickly when unexpected daily disruptions happen." },
      { domainName: "self_management", questionText: "I cope well with sudden plans changing without letting my frustration ruin the mood for others." },
      { domainName: "self_management", questionText: "I can say a clear, polite 'no' to extra favors or requests when my schedule is already full." },
      { domainName: "self_management", questionText: "When addressing an issue, I focus on what actually happened rather than blaming someone's character." },
      { domainName: "self_management", questionText: "I actively resist the urge to interrupt people, even when I strongly disagree with what they are saying." },
      { domainName: "social_awareness", questionText: "I listen to others without immediately jumping in to offer advice or fix their problems." },
      { domainName: "social_awareness", questionText: "I easily notice when a friend or family member's tone or body language shifts, signaling they might be upset." },
      { domainName: "social_awareness", questionText: "I try to understand the hidden worries or motivations behind why someone is acting defensive." },
      { domainName: "social_awareness", questionText: "I can put away my phone or distractions and give someone my completely undivided attention." },
      { domainName: "social_awareness", questionText: "I look at situations from other people's cultural or personal backgrounds to understand their point of view." },
      { domainName: "relationship_management", questionText: "I can genuinely acknowledge someone else's point of view, even when it directly clashes with my own." },
      { domainName: "relationship_management", questionText: "I address misunderstandings or relational friction early on, rather than letting them quietly simmer." },
      { domainName: "relationship_management", questionText: "I regularly go out of my way to express appreciation for the small things people do for me." },
      { domainName: "relationship_management", questionText: "I am comfortable admitting when I am wrong or when I've made a mistake." },
      { domainName: "relationship_management", questionText: "I check in on the people in my life to see how they are doing as human beings, not just to coordinate tasks." }
    ];
    for (const q of baselineQuestions) {
      await db.insert(eqQuestions).values(q);
    }
    console.log("🎯 Master EQ 20 Matrix populated successfully into database cells.");
  } catch (error) {
    console.error("⚠️ EQ Seeder background exception:", error);
  }
}

// =========================================================================
// 🛡️ NATIVE COMPILATION ENGINE (BYPASSES EXTERNAL PDF SERVICE)
// =========================================================================
async function convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
  // Returns HTML as a native Buffer directly, bypassing external API dependencies
  return Buffer.from(htmlContent, "utf-8");
}

// =========================================================================
// 📧 UTILITY COMM SYSTEM HANDLES
// =========================================================================
async function sendSurveyEmail(toEmail: string, firstName: string, surveyTitle: string, leaderName: string, code: string, baseUrl: string): Promise<boolean> {
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    return mailjetEmail.sendSurveyConfirmationEmail(toEmail, firstName, surveyTitle, leaderName, code, baseUrl);
  }
  return resendEmail.sendSurveyConfirmationEmail(toEmail, firstName, surveyTitle, leaderName, code, baseUrl);
}

async function sendQuantumEmail(toEmail: string, firstName: string, surveyTitle: string, leaderName: string, code: string, baseUrl: string): Promise<boolean> {
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    return mailjetEmail.sendQuantumSurveyConfirmationEmail(toEmail, firstName, surveyTitle, leaderName, code, baseUrl);
  }
  return resendEmail.sendQuantumSurveyConfirmationEmail(toEmail, firstName, surveyTitle, leaderName, code, baseUrl);
}

// =========================================================================
// 🛡️ SECURITY TOKEN MIDDLEWARE GATE
// =========================================================================
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Request {
  user?: User;
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(403).json({ message: 'Insufficient permissions' });
    
    // 🎯 Allows both 'owner' and 'super_admin' to bypass tenant role guards globally
    if (req.user.role === 'owner' || req.user.role === 'super_admin') return next();
    
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
  };
};

const requireOwner = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== 'owner' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Owner access required' });
    }
    next();
  };
};

const generateResponseHash = (email: string, cycleId: number): string => {
  return crypto.createHash('sha256').update(`${email}-${cycleId}-${process.env.HASH_SALT || 'default-salt'}`).digest('hex');
};

// =========================================================================
// 🚀 MASTER EXPRESS ROUTE ENGINES
// =========================================================================
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  ensureSchemaUpToDate()
    .then(() => ensureQuantumTemplateExists())
    .then(() => ensureSyncShiftTemplateExists())
    .then(() => ensureEQQuestionsExist())
    .then(() => ensureEQ360TemplateExists())
    .catch(err => console.error("Background DB alignment exception:", err));

  // -------------------------------------------------------------------------
  // 🔓 STAGE 1: ANONYMOUS PUBLIC LANES (PLACED EXPRESSLY BEFORE GATE CONTROLS)
  // -------------------------------------------------------------------------

  app.get("/api/eq/questions", async (_req, res) => {
    try {
      const questions = await db.select().from(eqQuestions).orderBy(eqQuestions.id);
      return res.json(questions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to load EQ questions." });
    }
  });

  app.post("/api/eq/submit", async (req, res) => {
    try {
      const { leadName, leadEmail, responses, commitments } = req.body;
      let targetOrgId = 1;
      const existingOrgs = await db.select().from(organizations).limit(1);
      
      if (existingOrgs.length > 0) {
        targetOrgId = existingOrgs[0].id;
      } else {
        const [newDefaultOrg] = await db.insert(organizations).values({
          name: "SyncShift Public Lead Pool",
          domain: "syncshift.com",
          quantumCredits: 9999
        }).returning();
        targetOrgId = newDefaultOrg.id;
      }

      let user = await storage.getUserByEmail(leadEmail);
      if (!user) {
        user = await storage.createUser({
          email: leadEmail,
          username: leadEmail.split('@')[0] + '.' + Math.floor(Math.random() * 1000),
          firstName: leadName.split(' ')[0] || leadName,
          lastName: leadName.split(' ').slice(1).join(' ') || 'Lead',
          password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          role: 'leader',
          organizationId: targetOrgId, 
          isActive: true
        });
      }

      for (const resp of responses) {
        await db.insert(eqResponses).values({
          userId: user.id,
          questionId: resp.questionId,
          scoreValue: resp.scoreValue,
        });
      }

      for (const comm of commitments) {
        await db.insert(eqCommitments).values({
          userId: user.id,
          domainName: comm.domainName,
          commitmentText: comm.commitmentText,
        });
      }
      return res.json({ message: "Assessment saved successfully." });
    } catch (error) {
      console.error("Submission failed:", error);
      return res.status(500).json({ message: "Failed to save results." });
    }
  });

  app.post("/api/eq/download", async (req, res) => {
    const reqId: string = (req.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID();
    res.setHeader("x-request-id", reqId);

    try {
      const { fullName, email, metrics, commitment } = req.body;
      const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      const secureFullName = String(fullName || "Participant").replace(/[<>]/g, "");
      const secureEmail = String(email || "").replace(/[<>]/g, "");
      const secureCommitment = String(commitment || "No active routine step written down yet.")
        .replace(/[<>]/g, "")
        .replace(/\n/g, "<br/>");

      let scoreRowsHtml = "";
      if (Array.isArray(metrics)) {
        for (const m of metrics) {
          let rawScore = typeof m.score === 'number' ? m.score : parseFloat(String(m.score || 0));
          if (isNaN(rawScore)) rawScore = 0.0;
          
          const percentage = Math.min(Math.max((rawScore / 5) * 100, 0), 100);
          
          let barColor = '#3b82f6';
          if (m.key === 'self_management') barColor = '#6366f1';
          if (m.key === 'social_awareness') barColor = '#f97316';
          if (m.key === 'relationship_management') barColor = '#10b981';

          scoreRowsHtml += `
            <div style="margin-bottom: 16px; clear: both; overflow: hidden;">
              <div style="font-size: 10pt; font-weight: 700; margin-bottom: 4px; color: #1e293b;">
                <span style="float: left;">${m.title || 'Domain'}</span>
                <span style="float: right;">${rawScore.toFixed(1)} / 5.0</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; clear: both; margin-top: 4px;">
                <div style="height: 8px; border-radius: 4px; width: ${percentage}%; background-color: ${barColor};"></div>
              </div>
            </div>
          `;
        }
      }

      let insightsRowsHtml = "";
      if (Array.isArray(metrics)) {
        metrics.forEach((m: any, idx: number) => {
          let cardStyle = '';
          let badgeText = '⚡ Balanced Element';
          if (idx === 0) { cardStyle = 'background: #f0fdf4; border-color: #bbf7d0; color: #166534;'; badgeText = '🏆 Strongest Element'; }
          else if (idx === 3) { cardStyle = 'background: #eff6ff; border-color: #bfdbfe; color: #1e40af;'; badgeText = '🎯 Main Growth Horizon'; }

          insightsRowsHtml += `
            <div style="padding: 16px; border-radius: 10px; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; ${cardStyle}">
              <div style="font-size: 10pt; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${badgeText} &bull; ${m.title || 'Domain'}</div>
              <p style="font-size: 9.5pt; color: #334155; margin: 0; line-height: 1.5;">${m.analysis || ''}</p>
              <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 10px;">
                <span style="font-size: 8pt; font-weight: 700; color: #f97316; text-transform: uppercase; display: block; margin-bottom: 2px;">Practical Action</span>
                <p style="font-size: 9.5pt; color: #0f172a; margin: 0; font-weight: 500; line-height: 1.4;">${m.action || ''}</p>
              </div>
            </div>
          `;
        });
      }

      const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SyncShift Intelligence Profile - ${secureFullName}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
    .brand { font-size: 13pt; font-weight: 800; color: #0b1120; text-transform: uppercase; letter-spacing: 0.5px; }
    .brand span { color: #f97316; }
    .title { font-size: 20pt; font-weight: 800; color: #0b1120; margin: 5px 0; letter-spacing: -0.5px; }
    .meta { font-size: 9.5pt; color: #475569; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 8px; }
    .heading { font-size: 12pt; font-weight: 700; color: #0b1120; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; border-left: 4px solid #f97316; padding-left: 8px; letter-spacing: 0.2px; }
    .playbook { background: #0b1120; color: #ffffff; padding: 18px; border-radius: 12px; margin-top: 25px; }
    .playbook-title { font-size: 11pt; font-weight: 700; color: #f97316; text-transform: uppercase; margin: 0 0 4px 0; }
    .quote { font-style: italic; font-size: 10pt; color: #f1f5f9; border-left: 3px solid #f97316; padding-left: 10px; margin: 8px 0 0 0; }
    .footer { font-size: 8.5pt; color: #64748b; text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">⚡ Sync<span>Shift</span></div>
    <div class="title">Personal Intelligence Blueprint</div>
    <div class="meta">
      <strong>Name:</strong> ${secureFullName} &nbsp;|&nbsp; <strong>Email:</strong> ${secureEmail} &nbsp;|&nbsp; <strong>Date Generated:</strong> ${dateStr}
    </div>
  </div>
  <div class="heading">Diagnostic Summary</div>
  ${scoreRowsHtml}
  <div class="heading">Domain Insights & Recommendations</div>
  ${insightsRowsHtml}
  <div class="playbook">
    <div class="playbook-title">My 14-Day Micro-Experiment</div>
    <p style="color: #94a3b8; font-size: 9pt; margin: 0 0 6px 0;">Your personal routine commitment:</p>
    <p class="quote">"${secureCommitment}"</p>
  </div>
  <div class="footer">
    SyncShift Intelligence Matrix &bull; Follow-up care loop updates initiate in 14 days.
  </div>
</body>
</html>
      `.trim();

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="SyncShift_EQ_Profile_${secureFullName.replace(/\s+/g, '_')}.html"`);
      return res.send(reportHtml);

    } catch (error) {
      console.error("HTML file compilation download fault:", error);
      return res.status(500).json({ error: "Failed to compile offline document report bundle." });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const [user] = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
      if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, organizationId: user.organizationId } });
    } catch (error) {
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Public logout endpoint (never returns 401)
  app.post("/api/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(() => {});
    }
    return res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/survey-cycles/:inviteCode", async (req: Request, res: Response) => {
    const [cycle] = await db.select({ id: surveyCycles.id, title: surveyCycles.title, status: surveyCycles.status, inviteCode: surveyCycles.inviteCode, endDate: surveyCycles.endDate, surveyId: surveyCycles.surveyId }).from(surveyCycles).where(eq(surveyCycles.inviteCode, req.params.inviteCode)).limit(1);
    return res.json(cycle);
  });

  app.post("/api/survey-responses", async (req: Request, res: Response) => {
    try {
      const { inviteCode, responses, relationship, respondentRelationship } = req.body;
      const cycle = await storage.getSurveyCycleByInviteCode(inviteCode);
      if (!cycle || cycle.status !== "active") return res.status(400).json({ message: "Survey inactive" });

      const finalRelationship = relationship || respondentRelationship || 'Stakeholder';

      await storage.createSurveyResponse({ 
        cycleId: cycle.id, 
        invitationId: null, 
        responses: responses, 
        respondentRelationship: finalRelationship, 
        responseHash: generateResponseHash("anonymous-" + Date.now(), cycle.id), 
        disabled: false 
      });

      await storage.updateSurveyCycleStats(cycle.id);
      return res.status(201).json({ message: "Submitted successfully" });
    } catch (error) {
      console.error("Error saving survey response:", error);
      return res.status(500).json({ message: "Submission failed" });
    }
  });

  app.get("/api/quantum360/survey", async (req: Request, res: Response) => {
    return res.json(await storage.getSurveyByType("quantum"));
  });

  app.get("/api/quantum360/reports/:cycleId", async (req: Request, res: Response) => {
    const [report] = await db.select().from(reports).where(eq(reports.cycleId, parseInt(req.params.cycleId)));
    return res.json(report);
  });

  app.get("/api/download/participant-guide", (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'Survey_Participant_Guide.docx');
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Guide not found" });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Survey_Participant_Guide.docx"');
    return fs.createReadStream(filePath).pipe(res);
  });

  // -------------------------------------------------------------------------
  // 🔒 STAGE 2: THE ENFORCEMENT VALVE (ALL LOGGED-IN ACTIONS START HERE)
  // -------------------------------------------------------------------------
  app.use("/api", authenticateToken);

  app.get("/api/auth/me", async (req: AuthenticatedRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  app.post("/api/quantum360/create-cycle", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const targetOrgId = req.user?.organizationId || req.body.organizationId || 1;
      const targetLeaderId = req.user?.id || 1;

      const cycle = await storage.createSurveyCycle({ 
        surveyId: 2, 
        leaderId: targetLeaderId, 
        organizationId: targetOrgId, 
        title: req.body.title || "Quantum Assessment", 
        status: 'active', 
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      });

      await storage.updateCycleInviteCode(cycle.id, inviteCode);
      return res.status(201).json({ cycle, inviteCode });
    } catch (error) {
      console.error("Error creating quantum cycle:", error);
      return res.status(500).json({ message: "Failed to create quantum cycle" });
    }
  });

  app.get("/api/organizations/:orgId", async (req: AuthenticatedRequest, res: Response) => {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, parseInt(req.params.orgId))).limit(1);
    return res.json(org);
  });

  // Updated Admin Permissions across all dashboard routes
  app.get("/api/dashboard/stats", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getDashboardStats());
  });

  app.get("/api/reports/macro/:tierType", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    // Owner/super_admin may target any org via ?orgId=; org-bound admins are locked to their own org.
    const requestedOrgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : null;
    const isOwner = req.user!.role === 'owner' || req.user!.role === 'super_admin';
    if (isOwner && !requestedOrgId) {
      return res.status(400).json({ message: "An organization (orgId) is required to generate a scope report." });
    }
    const orgId = isOwner ? requestedOrgId! : req.user!.organizationId!;
    try {
      return res.json(await generateMacroTierReport(orgId, req.params.tierType as any, req.query.identifier as string));
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to generate macro report." });
    }
  });

  app.get("/api/reports/macro/:tierType/download", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestedOrgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : null;
      const isOwner = req.user!.role === 'owner' || req.user!.role === 'super_admin';
      if (isOwner && !requestedOrgId) {
        return res.status(400).json({ message: "An organization (orgId) is required to generate a scope report." });
      }
      const orgId = isOwner ? requestedOrgId! : req.user!.organizationId!;
      const report = await generateMacroTierReport(orgId, req.params.tierType as any, req.query.identifier as string);
      const reportHtml = compileMacroHtmlReport(report, "SyncShift Client");

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="SyncShift_Macro_Report_${req.params.tierType}.html"`);

      return res.send(reportHtml);
    } catch (error: any) {
      console.error("Macro report compilation failed:", error);
      return res.status(400).json({ message: error?.message || "Failed to compile macro report." });
    }
  });

  // Distinct teams / functions (departments) across leaders in an org, for report-scope selectors
  app.get("/api/organizations/:orgId/groupings", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const orgId = parseInt(req.params.orgId);
    const orgUsers = await db.select({ teamName: users.teamName, department: users.department }).from(users).where(eq(users.organizationId, orgId));
    const teams = Array.from(new Set(orgUsers.map(u => u.teamName).filter(Boolean) as string[]));
    const functions = Array.from(new Set(orgUsers.map(u => u.department).filter(Boolean) as string[]));
    return res.json({ teams, functions });
  });

  app.get("/api/dashboard/activity", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getRecentActivity(parseInt(req.query.limit as string) || 10));
  });

  app.get("/api/organizations", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getOrganizations());
  });

  app.post("/api/organizations", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.status(201).json(await storage.createOrganization(insertOrganizationSchema.parse(req.body)));
  });

  app.post("/api/surveys", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.status(201).json(await storage.createSurvey({ ...insertSurveySchema.parse(req.body), createdBy: req.user!.id }));
  });

  app.get("/api/surveys/organization/:orgId", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getSurveysByOrganization(parseInt(req.params.orgId)));
  });

  // Owner-facing: all surveys across every org, each tagged with its org name (for cross-org browsing/sorting)
  app.get("/api/surveys/all", requireRole(['owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const allSurveys = await storage.getAllSurveys();
    const allOrgs = await storage.getOrganizations();
    const orgById = new Map(allOrgs.map(o => [o.id, o.name]));
    return res.json(allSurveys.map((s: any) => ({ ...s, organizationName: orgById.get(s.organizationId) || '—', questionCount: Array.isArray(s.questions) ? s.questions.length : JSON.parse(s.questions || '[]').length })));
  });

  app.post("/api/surveys/personal", async (req: Request, res: Response) => {
    try {
      const { surveyData } = req.body;
      const orgs = await storage.getOrganizations();
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const cycle = await storage.createSurveyCycle({ surveyId: 1, leaderId: 1, organizationId: orgs[0].id, title: surveyData.title, status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      await storage.updateCycleInviteCode(cycle.id, inviteCode);
      return res.status(201).json({ success: true, surveyCode: inviteCode, cycle });
    } catch (error) {
      return res.status(400).json({ message: "Personal survey failure" });
    }
  });

  app.get("/api/users/leaders", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'leader')));
  });

  app.post("/api/survey-cycles", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.createSurveyCycle(insertSurveyCycleSchema.parse({ ...req.body, endDate: new Date(req.body.endDate) }));
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    await storage.updateCycleInviteCode(cycle.id, token);
    cycle.inviteCode = token;
    return res.status(201).json({ cycle });
  });

  // Single clean implementation of /api/survey-cycles
  app.get("/api/survey-cycles", async (req: AuthenticatedRequest, res: Response) => {
    try {
      let selector = db.select({ 
        id: surveyCycles.id, 
        title: surveyCycles.title, 
        status: surveyCycles.status, 
        inviteCode: surveyCycles.inviteCode, 
        endDate: surveyCycles.endDate, 
        organizationId: surveyCycles.organizationId,
        leaderId: surveyCycles.leaderId,
        responseCount: sql<number>`count(${surveyResponses.id})::int`
      })
      .from(surveyCycles)
      .leftJoin(surveyResponses, eq(surveyResponses.cycleId, surveyCycles.id))
      .groupBy(surveyCycles.id);

      // 🎯 Guardrail 3: Owners and Super Admins bypass tenant filtering globally
      if (req.user?.role === 'owner' || req.user?.role === 'super_admin') {
        // Global view - no WHERE clause applied
      } 
      // 🏢 Org Admins & Company Admins: Filter by Organization ID if bound
      else if (req.user?.organizationId) {
        selector = selector.where(eq(surveyCycles.organizationId, req.user.organizationId)) as any;
      } 
      // 👤 Standalone Leaders: Filter by Leader User ID
      else if (req.user?.id) {
        selector = selector.where(eq(surveyCycles.leaderId, req.user.id)) as any;
      }

      const cycles = await selector.orderBy(surveyCycles.createdAt);
      return res.json(cycles || []);
    } catch (error) {
      console.error("Error fetching survey cycles:", error);
      return res.status(500).json({ message: "Failed to fetch survey cycles" });
    }
  });

  app.get("/api/survey-cycles/progress", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getActiveCyclesWithProgress());
  });

  app.get("/api/survey-cycles/:id/leader-summary", requireRole(['admin', 'leader', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, parseInt(req.params.id)));
    return res.json({ selfAssessmentComplete: responses.some(r => r.respondentRelationship === 'Self'), stakeholderCount: responses.filter(r => r.respondentRelationship !== 'Self').length });
  });

  app.post("/api/survey-invitations", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    for (const email of req.body.participantEmails) {
      if (email?.trim()) await storage.createSurveyInvitation({ cycleId: parseInt(req.body.cycleId), email: email.trim(), status: 'pending' });
    }
    return res.status(201).json({ message: "Invitations created successfully" });
  });

  app.get("/api/survey-invitations/:token", async (req: Request, res: Response) => {
    return res.json(await storage.getSurveyInvitationByToken(req.params.token));
  });

  app.get("/api/survey-cycles/:id/respondents", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await db.select({ id: surveyResponses.id, respondentName: surveyResponses.respondentName, respondentEmail: surveyResponses.respondentEmail, respondentRelationship: surveyResponses.respondentRelationship }).from(surveyResponses).where(eq(surveyResponses.cycleId, parseInt(req.params.id))));
  });

  app.get("/api/survey-cycles/:id/progress", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.getSurveyCycle(parseInt(req.params.id));
    const progress = await storage.getCycleProgress(cycle.id);
    return res.json({ cycle, leaderName: "SyncShift Target", ...progress });
  });

  app.get("/api/reports/pending", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getPendingReports());
  });

  app.get("/api/reports/:cycleId/metrics", requireRole(['admin', 'leader', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await generateSyncShiftReportData(parseInt(req.params.cycleId)));
  });

  app.get("/api/reports/:cycleId/download", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const processedMetrics = await generateSyncShiftReportData(cycleId);
      
      const cycle = await storage.getSurveyCycle(cycleId);
      if (!cycle) {
        return res.status(404).json({ message: "Survey cycle not found" });
      }
      
      const leader = await storage.getUser(cycle.leaderId);
      const leaderName = leader ? `${leader.firstName} ${leader.lastName}` : "SyncShift Target Profile";
      
      const reportHtml = compileSyncShiftHtmlReport(processedMetrics, leaderName, "SyncShift Evaluation Matrix");
      
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="SyncShift_360_Report_Cycle_${cycleId}.html"`);
      
      return res.send(reportHtml);
    } catch (error) {
      console.error("360 HTML document asset compilation failed:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "Failed to compile offline HTML report asset." });
    }
  });
  
  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    return res.json(await storage.getReport(parseInt(req.params.id)));
  });

  app.post("/api/reports/:id/approve", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    await storage.updateReportStatus(parseInt(req.params.id), "approved", req.user!.id);
    return res.json({ message: "Approved successfully" });
  });

  app.post("/api/reports/:id/release", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    await storage.updateReportStatus(parseInt(req.params.id), "released", req.user!.id);
    return res.json({ message: "Released successfully" });
  });

  app.post("/api/reports/generate/:cycleId", requireRole(['admin', 'org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.getSurveyCycle(parseInt(req.params.cycleId));
    return res.status(201).json(await storage.createReport({ cycleId: cycle.id, leaderId: cycle.leaderId, organizationId: cycle.organizationId, title: "Report - " + cycle.title, executiveSummary: "", status: 'pending' }));
  });

  app.post("/api/organizations/:orgId/deploy-surveys", requireRole(['org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      // surveyType selects which questionnaire to deploy (defaults to the full SyncShift survey)
      const surveyType = (req.body.surveyType as string) || 'syncshift';
      const { method, participants } = req.body;
      let targets: Array<{ firstName: string; lastName: string; email: string }> = [];
      if (method === 'manual' && Array.isArray(participants)) {
        targets = participants.map(p => ({
          firstName: String(p.firstName || '').trim(),
          lastName: String(p.lastName || '').trim(),
          email: String(p.email || '').trim().toLowerCase()
        })).filter(p => p.firstName && p.email);
      }
      if (targets.length === 0) return res.status(400).json({ message: "No valid targets discovered." });
      const [surveyRow] = await db.select().from(surveys).where(eq(surveys.surveyType, surveyType)).limit(1);
      if (!surveyRow) return res.status(404).json({ message: `No survey template of type '${surveyType}' exists.` });
      const price = surveyRow.creditPrice ?? 1;
      const needed = targets.length * price;
      const balance = await storage.getSurveyCredit(orgId, surveyType);
      if (balance < needed) return res.status(402).json({ message: `Insufficient ${surveyType} credits. Need ${needed}, balance ${balance}.` });

      for (const target of targets) {
        let leaderUser = await storage.getUserByEmail(target.email);
        if (!leaderUser) {
          leaderUser = await storage.createUser({
            email: target.email,
            username: target.email.split('@')[0] + '.' + Math.floor(Math.random() * 1000),
            firstName: target.firstName,
            lastName: target.lastName,
            password: await bcrypt.hash(Math.random().toString(36).substring(2, 12), 10),
            role: 'leader',
            organizationId: orgId,
            isActive: true
          });
        }
        const uniqueInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const cycle = await storage.createSurveyCycle({
          surveyId: surveyRow.id,
          leaderId: leaderUser.id,
          organizationId: orgId,
          title: (surveyType === 'quantum' ? "Quantum Leadership evaluation - " : surveyType === 'eq360' ? "EQ 360 evaluation - " : "SyncShift Organisation evaluation - ") + target.firstName + " " + target.lastName,
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await storage.updateCycleInviteCode(cycle.id, uniqueInviteCode);
        const hostBaseDomain = req.protocol + "://" + req.get('host');
        try {
          if (surveyType === 'quantum') {
            await sendQuantumEmail(target.email, target.firstName, surveyRow.title, target.firstName + " " + target.lastName, uniqueInviteCode, hostBaseDomain);
          } else {
            await sendSurveyEmail(target.email, target.firstName, surveyRow.title, target.firstName + " " + target.lastName, uniqueInviteCode, hostBaseDomain);
          }
        } catch (e) { console.error("Email send failed for deployed survey:", e); }
      }
      const remaining = await storage.deductSurveyCredits(orgId, surveyType, needed);
      return res.json({ success: true, remainingCredits: remaining, surveyType, deployed: targets.length });
    } catch (error) {
      console.error("Deployment error:", error);
      return res.status(500).json({ message: "Deployment crash." });
    }
  });

  app.get("/api/owner/organizations/usage", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getAllOrganizationsWithUsage());
  });

  app.get("/api/owner/users", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const allUsers = await storage.getAllUsers();
    return res.json(allUsers.map(({ password, ...user }) => user));
  });

  app.patch("/api/owner/users/:userId/role", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    await storage.updateUserRole(parseInt(req.params.userId), req.body.role);
    return res.json({ message: "Role updated successfully" });
  });

  // Assign a user both a role AND their bound organization (e.g. make someone org_admin of Emenex)
  app.post("/api/owner/users/:userId/assign", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const { role, organizationId } = req.body as { role?: string; organizationId?: number };
    if (!role || !organizationId) {
      return res.status(400).json({ message: "Both 'role' and 'organizationId' are required." });
    }
    const allowedRoles = ['org_admin', 'company_admin', 'leader', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role '${role}'. Allowed: ${allowedRoles.join(', ')}` });
    }
    // Validate org exists
    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    if (!org) return res.status(404).json({ message: "Organization not found." });

    await storage.assignUserRoleOrg(userId, role, organizationId);
    return res.json({ message: `${role} assigned to organization #${organizationId}.` });
  });

  // Create a fresh org_admin account bound to an EXISTING organization (e.g. Emenex)
  app.post("/api/owner/organizations/:orgId/admins", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const orgId = parseInt(req.params.orgId);
    const { email, password, firstName, lastName } = req.body as { email?: string; password?: string; firstName?: string; lastName?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) return res.status(404).json({ message: "Organization not found." });

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return res.status(409).json({ message: "A user with that email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await storage.createAdminForOrg(orgId, { email, password: hashed, firstName, lastName });
    return res.status(201).json({ message: `Admin created for ${org.name}.`, user: { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId } });
  });

  // Update an existing admin's profile (name / email) on an org — e.g. when the admin role passes to a new person
  app.patch("/api/owner/organizations/:orgId/admins/:userId", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const { firstName, lastName, email } = req.body as { firstName?: string; lastName?: string; email?: string };
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (email && email !== user.email) {
      const [existing] = await db.select().from(users).where(and(eq(users.email, email), sql`${users.id} != ${userId}`)).limit(1);
      if (existing) return res.status(409).json({ message: "That email is already taken by another user." });
    }
    const updated = await storage.updateUserProfile(userId, { firstName, lastName, email });
    return res.json({
      message: "Admin details updated.",
      admin: { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email },
    });
  });

  // Reset an admin's password (they forgot it)
  app.post("/api/owner/organizations/:orgId/admins/:userId/reset-password", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const newPassword = (req.body as { password?: string })?.password;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found." });
    const hashed = await bcrypt.hash(newPassword, 10);
    await storage.resetUserPassword(userId, hashed);
    return res.json({ message: `Password reset for ${user.email}. Pass the new password to them securely.` });
  });

  // Update an organisation's name / domain (owner-only)
  app.patch("/api/owner/organizations/:orgId", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const orgId = parseInt(req.params.orgId);
    const { name, domain } = req.body as { name?: string; domain?: string };
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) return res.status(404).json({ message: "Organization not found." });
    if (domain !== undefined && domain !== null && domain !== '') {
      const normalized = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
      const [existing] = await db.select().from(organizations).where(and(eq(organizations.domain, normalized), sql`${organizations.id} != ${orgId}`)).limit(1);
      if (existing) return res.status(409).json({ message: "Another organization already uses that domain." });
      await db.update(organizations).set({ name: name?.trim() || org.name, domain: normalized }).where(eq(organizations.id, orgId));
    } else if (name !== undefined) {
      await db.update(organizations).set({ name: name.trim() }).where(eq(organizations.id, orgId));
    } else {
      return res.status(400).json({ message: "Provide a name and/or domain to update." });
    }
    const [updated] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    return res.json({ message: "Organization updated.", organization: updated });
  });

  app.patch("/api/owner/organizations/:orgId/credits", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const orgId = parseInt(req.params.orgId);
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) return res.status(404).json({ message: "Organization not found." });
    // Allocate to a specific survey type (default 'syncshift') — independent wallets per questionnaire.
    const surveyType = (req.body.surveyType as string) || 'syncshift';
    const newBalance = await storage.addSurveyCredits(orgId, surveyType, req.body.creditsToAllocate);
    return res.json({ success: true, newBalance, surveyType });
  });

  app.post("/api/owner/organizations", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const [newOrg] = await db.insert(organizations).values({ name: req.body.orgName, domain: req.body.domain, quantumCredits: 0 }).returning();
    await db.insert(users).values({ email: req.body.adminEmail, username: req.body.adminEmail.split('@')[0], password: await bcrypt.hash(req.body.adminPassword, 10), role: 'org_admin', organizationId: newOrg.id, firstName: 'Admin', lastName: 'User', isActive: true });
    return res.status(201).json({ message: "Client provisioned successfully", organization: newOrg });
  });

  return httpServer;
}
