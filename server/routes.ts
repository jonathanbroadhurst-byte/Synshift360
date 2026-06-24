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
// 🛡️ SECURITY TOKEN MIDDWARE GATE
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
    if (req.user.role === 'owner') return next();
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
  };
};

const requireOwner = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'owner') return res.status(403).json({ message: 'Owner access required' });
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
    .then(() => ensureEQQuestionsExist())
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
    try {
      const { fullName, email, metrics, commitment } = req.body;
      const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Sanitize input to clean text frames going into the PDF compiler string
      const secureFullName = String(fullName || "Participant").replace(/[<>]/g, "");
      const secureEmail = String(email || "").replace(/[<>]/g, "");
      const secureCommitment = String(commitment || "No active routine step written down yet.")
        .replace(/[<>]/g, "")
        .replace(/\n/g, "<br/>");

      let scoreRowsHtml = "";
      if (Array.isArray(metrics)) {
        for (const m of metrics) {
          const percentage = (m.score / 5) * 100;
          let barColor = '#3b82f6';
          if (m.key === 'self_management') barColor = '#6366f1';
          if (m.key === 'social_awareness') barColor = '#f97316';
          if (m.key === 'relationship_management') barColor = '#10b981';

          scoreRowsHtml += `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 10pt; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 4px; color: #1e293b;">
                <span>${m.title}</span> 
                <span>${m.score} / 5.0</span>
              </div>
              <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; border-radius: 4px; width: ${percentage}%; background-color: ${barColor};"></div>
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
              <div style="font-size: 10pt; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${badgeText} &bull; ${m.title}</div>
              <p style="font-size: 9.5pt; color: #334155; margin: 0; line-height: 1.5;">${m.analysis}</p>
              <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.04); margin-top: 10px;">
                <span style="font-size: 8pt; font-weight: 700; color: #f97316; text-transform: uppercase; display: block; margin-bottom: 2px;">Practical Action</span>
                <p style="font-size: 9.5pt; color: #0f172a; margin: 0; font-weight: 500; line-height: 1.4;">${m.action}</p>
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
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; }
    .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
    .brand { font-size: 13pt; font-weight: 800; color: #0b1120; text-transform: uppercase; letter-spacing: 0.5px; }
    .brand span { color: #f97316; }
    .title { font-size: 20pt; font-weight: 800; color: #0b1120; margin: 5px 0; letter-spacing: -0.5px; }
    .meta { font-size: 9.5pt; color: #475569; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 8px; }
    .heading { font-size: 12pt; font-weight: 700; color: #0b1120; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; border-left: 4px solid #f97316; padding-left: 8px; letter-spacing: 0.5px; }
    .playbook { background: #0b1120; color: #ffffff; padding: 18px; border-radius: 12px; margin-top: 25px; page-break-inside: avoid; }
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

      const pdfResponse = await fetch("https://api.pdfcrowd.com/convert/24.04/html/to/pdf/", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from("J0n_Br04d:ef461a481b5d437a880e92880de5bade").toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "text=" + encodeURIComponent(reportHtml)
      });

      if (!pdfResponse.ok) {
        const errText = await pdfResponse.text();
        throw new Error(`Pdfcrowd rejection: ${pdfResponse.status} - ${errText}`);
      }

      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=\"SyncShift_EQ_Profile_" + secureFullName.replace(/\s+/g, '_') + ".pdf\"");
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("Server compilation engine fault:", error);
      return res.status(500).json({ message: "Failed to compile PDF document copy." });
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

  app.get("/api/survey-cycles/:inviteCode", async (req: Request, res: Response) => {
    const [cycle] = await db.select({ id: surveyCycles.id, title: surveyCycles.title, status: surveyCycles.status, inviteCode: surveyCycles.inviteCode, endDate: surveyCycles.endDate, surveyId: surveyCycles.surveyId, leaderId: surveyCycles.leaderId, organizationId: surveyCycles.organizationId, leaderFirstName: users.firstName, leaderLastName: users.lastName, leaderPosition: users.position, surveyTitle: surveys.title, surveyQuestions: surveys.questions, organizationName: organizations.name }).from(surveyCycles).leftJoin(users, eq(surveyCycles.leaderId, users.id)).leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id)).leftJoin(organizations, eq(surveyCycles.organizationId, organizations.id)).where(eq(surveyCycles.inviteCode, req.params.inviteCode));
    return res.json(cycle);
  });

  app.post("/api/survey-responses", async (req: Request, res: Response) => {
    const cycle = await storage.getSurveyCycleByInviteCode(req.body.inviteCode);
    if (!cycle || cycle.status !== "active") return res.status(400).json({ message: "Survey inactive" });
    await storage.createSurveyResponse({ cycleId: cycle.id, invitationId: null, responses: req.body.responses, responseHash: generateResponseHash("anonymous-" + Date.now(), cycle.id), disabled: false, respondentName: req.body.respondentName || null, respondentEmail: req.body.respondentEmail || null, respondentRelationship: req.body.respondentRelationship || null });
    await storage.updateSurveyCycleStats(cycle.id);
    return res.status(201).json({ message: "Submitted successfully" });
  });

  app.get("/api/quantum360/survey", async (req: Request, res: Response) => {
    return res.json(await storage.getSurveyByType("quantum"));
  });

  app.post("/api/quantum360/create-cycle", async (req: Request, res: Response) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cycle = await storage.createSurveyCycle({ surveyId: 2, leaderId: 1, organizationId: 1, title: req.body.title || "Quantum Assessment", status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    await storage.updateCycleInviteCode(cycle.id, inviteCode);
    return res.status(201).json({ cycle, inviteCode });
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
  app.use(authenticateToken);

  (async () => {
    try {
      await db.update(users).set({ firstName: 'Jonathan', lastName: 'Broadhurst' }).where(eq(users.role, 'org_admin'));
    } catch (patchError) {
      console.error("Live-patch alignment delay:", patchError);
    }
  })();

  app.get("/api/fix-my-profile", async (req, res) => {
    return res.send("Live-patch active via boot core script layer.");
  });

  app.get("/api/auth/me", async (req: AuthenticatedRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  app.get("/api/organizations/:orgId", async (req: AuthenticatedRequest, res: Response) => {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, parseInt(req.params.orgId))).limit(1);
    return res.json(org);
  });

  app.get("/api/dashboard/stats", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getDashboardStats());
  });

  app.get("/api/reports/macro/:tierType", requireRole(['admin', 'org_admin', 'company_admin', 'owner']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await generateMacroTierReport(req.user!.organizationId!, req.params.tierType as any, req.query.identifier as string));
  });

  app.get("/api/reports/macro/:tierType/download", requireRole(['admin', 'org_admin', 'company_admin', 'owner']), async (req: AuthenticatedRequest, res: Response) => {
    const report = await generateMacroTierReport(req.user!.organizationId!, req.params.tierType as any, req.query.identifier as string);
    res.setHeader("Content-Type", "text/html");
    return res.send(compileMacroHtmlReport(report, "SyncShift Client"));
  });

  app.get("/api/dashboard/activity", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getRecentActivity(parseInt(req.query.limit as string) || 10));
  });

  app.get("/api/organizations", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getOrganizations());
  });

  app.post("/api/organizations", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.status(201).json(await storage.createOrganization(insertOrganizationSchema.parse(req.body)));
  });

  app.post("/api/surveys", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.status(201).json(await storage.createSurvey({ ...insertSurveySchema.parse(req.body), createdBy: req.user!.id }));
  });

  app.get("/api/surveys/organization/:orgId", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getSurveysByOrganization(parseInt(req.params.orgId)));
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

  app.get("/api/users/leaders", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'leader')));
  });

  app.post("/api/survey-cycles", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.createSurveyCycle(insertSurveyCycleSchema.parse({ ...req.body, endDate: new Date(req.body.endDate) }));
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    await storage.updateCycleInviteCode(cycle.id, token);
    cycle.inviteCode = token;
    return res.status(201).json({ cycle });
  });

  app.get("/api/survey-cycles", async (req: AuthenticatedRequest, res: Response) => {
    let selector = db.select({ id: surveyCycles.id, title: surveyCycles.title, status: surveyCycles.status, inviteCode: surveyCycles.inviteCode, endDate: surveyCycles.endDate, responseCount: surveyCycles.totalResponses, invitedCount: surveyCycles.totalInvites, organizationName: organizations.name, surveyTitle: surveys.title, leaderId: surveyCycles.leaderId }).from(surveyCycles).leftJoin(organizations, eq(surveyCycles.organizationId, organizations.id)).leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id));
    if (req.user && req.user.role === 'leader') selector = selector.where(eq(surveyCycles.leaderId, req.user.id)) as any;
    return res.json(await selector.orderBy(surveyCycles.createdAt));
  });

  app.get("/api/survey-cycles/progress", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getActiveCyclesWithProgress());
  });

  app.get("/api/survey-cycles/:id/leader-summary", requireRole(['admin', 'leader', 'org_admin', 'company_admin']), async (req: AuthenticatedRequest, res: Response) => {
    const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, parseInt(req.params.id)));
    return res.json({ selfAssessmentComplete: responses.some(r => r.respondentRelationship === 'Self'), stakeholderCount: responses.filter(r => r.respondentRelationship !== 'Self').length });
  });

  app.post("/api/survey-invitations", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    for (const email of req.body.participantEmails) {
      if (email?.trim()) await storage.createSurveyInvitation({ cycleId: parseInt(req.body.cycleId), email: email.trim(), status: 'pending' });
    }
    return res.status(201).json({ message: "Invitations created successfully" });
  });

  app.get("/api/survey-invitations/:token", async (req: Request, res: Response) => {
    return res.json(await storage.getSurveyInvitationByToken(req.params.token));
  });

  app.get("/api/survey-cycles/:id/respondents", requireRole(['admin', 'org_admin', 'company_admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await db.select({ id: surveyResponses.id, respondentName: surveyResponses.respondentName, respondentEmail: surveyResponses.respondentEmail, respondentRelationship: surveyResponses.respondentRelationship, submittedAt: surveyResponses.submittedAt }).from(surveyResponses).where(eq(surveyResponses.cycleId, parseInt(req.params.id))).orderBy(surveyResponses.submittedAt));
  });

  app.get("/api/survey-cycles/:id/progress", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.getSurveyCycle(parseInt(req.params.id));
    const progress = await storage.getCycleProgress(cycle.id);
    return res.json({ cycle, leaderName: "SyncShift Target", ...progress });
  });

  app.get("/api/reports/pending", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await storage.getPendingReports());
  });

  app.get("/api/reports/:cycleId/metrics", requireRole(['admin', 'leader']), async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await generateSyncShiftReportData(parseInt(req.params.cycleId)));
  });

  app.get("/api/reports/:cycleId/download", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const processedMetrics = await generateSyncShiftReportData(cycleId);
      const reportHtml = compileSyncShiftHtmlReport(processedMetrics, "Jonathan Broadhurst", "SyncShift");
      const pdfResponse = await fetch("https://api.pdfcrowd.com/convert/24.04/html/to/pdf/", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from("J0n_Br04d:ef461a481b5d437a880e92880de5bade").toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "text=" + encodeURIComponent(reportHtml)
      });
      if (!pdfResponse.ok) {
        const errText = await pdfResponse.text();
        throw new Error(`Pdfcrowd rejection: ${pdfResponse.status} - ${errText}`);
      }
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=\"SyncShift_360_Report_Cycle_" + cycleId + ".pdf\"");
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("360 PDF engine processing fault:", error);
      return res.status(500).json({ message: "Failed to compile 360 PDF document." });
    }
  });

  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    return res.json(await storage.getReport(parseInt(req.params.id)));
  });

  app.post("/api/reports/:id/approve", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    await storage.updateReportStatus(parseInt(req.params.id), "approved", req.user!.id);
    return res.json({ message: "Approved successfully" });
  });

  app.post("/api/reports/:id/release", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    await storage.updateReportStatus(parseInt(req.params.id), "released", req.user!.id);
    return res.json({ message: "Released successfully" });
  });

  app.post("/api/reports/generate/:cycleId", requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    const cycle = await storage.getSurveyCycle(parseInt(req.params.cycleId));
    return res.status(201).json(await storage.createReport({ cycleId: cycle.id, leaderId: cycle.leaderId, organizationId: cycle.organizationId, title: "Report - " + cycle.title, executiveSummary: "Compiled Analysis", strengths: [], developmentAreas: [], statistics: {}, status: "pending" }));
  });

  app.post("/api/organizations/:orgId/deploy-surveys", requireRole(['org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
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
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      const currentCredits = org.quantumCredits ?? 0;
      if (currentCredits < targets.length) return res.status(402).json({ message: "Insufficient credits." });
      const [quantumSurvey] = await db.select().from(surveys).where(eq(surveys.surveyType, "quantum")).limit(1);

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
          surveyId: quantumSurvey.id,
          leaderId: leaderUser.id,
          organizationId: orgId,
          title: "Quantum Leadership evaluation - " + target.firstName + " " + target.lastName,
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await storage.updateCycleInviteCode(cycle.id, uniqueInviteCode);
        const hostBaseDomain = req.protocol + "://" + req.get('host');
        await sendQuantumEmail(target.email, target.firstName, quantumSurvey.title, target.firstName + " " + target.lastName, uniqueInviteCode, hostBaseDomain);
      }
      await db.update(organizations).set({ quantumCredits: currentCredits - targets.length }).where(eq(organizations.id, orgId));
      return res.json({ success: true, remainingCredits: currentCredits - targets.length });
    } catch (error) {
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

  app.patch("/api/owner/organizations/:orgId/credits", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const orgId = parseInt(req.params.orgId);
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const updatedCredits = (org.quantumCredits ?? 0) + req.body.creditsToAllocate;
    await db.update(organizations).set({ quantumCredits: updatedCredits }).where(eq(organizations.id, orgId));
    return res.json({ success: true, newBalance: updatedCredits });
  });

  app.post("/api/owner/organizations", requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    const [newOrg] = await db.insert(organizations).values({ name: req.body.orgName, domain: req.body.domain, quantumCredits: 0 }).returning();
    await db.insert(users).values({ email: req.body.adminEmail, username: req.body.adminEmail.split('@')[0], password: await bcrypt.hash(req.body.adminPassword, 10), role: 'org_admin', organizationId: newOrg.id, firstName: req.body.adminFirstName.trim(), lastName: req.body.adminLastName.trim(), isActive: true });
    return res.status(201).json({ message: "Client provisioned successfully", organization: newOrg });
  });

  return httpServer;
}
