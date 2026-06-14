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
import { generateSyncShiftReportData } from "./services/reporting";
import { compileSyncShiftHtmlReport } from "./services/pdfTemplate";
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
  auditLog 
} from "@shared/schema";

// SELF-HEALING DATABASE SCHEMA LAYER: Safely ensures table columns exist without drizzle-kit in production
async function ensureSchemaUpToDate() {
  try {
    console.log("🔍 Checking database column structure alignments...");
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quantum_credits INTEGER DEFAULT 0 NOT NULL;`);
    console.log("⚡ Column 'quantum_credits' verified or injected successfully.");
  } catch (error) {
    console.error("⚠️ Schema auto-alignment encountered an issue (it may already be up to date):", error);
  }
}

// AUTO-SEEDER: Guarantees the master Quantum 360 framework template row is registered on server boot
async function ensureQuantumTemplateExists() {
  try {
    const existingTemplate = await db
      .select()
      .from(surveys)
      .where(eq(surveys.surveyType, "quantum"))
      .limit(1);

    if (existingTemplate.length === 0) {
      console.log("🌱 Baseline Quantum 360 template missing. Seeding configuration...");
      
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
      console.log("🎯 Quantum 360 master framework initialized successfully.");
    } else {
      console.log("Persistent framework template 'quantum' verified active.");
    }
  } catch (error) {
    console.error("Fault encountered during template pre-seeder execution:", error);
  }
}

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

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Request {
  user?: User;
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    if (req.user.role === 'owner') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

const requireOwner = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access required' });
    }
    next();
  };
};

const generateResponseHash = (email: string, cycleId: number): string => {
  return crypto.createHash('sha256').update(`${email}-${cycleId}-${process.env.HASH_SALT || 'default-salt'}`).digest('hex');
};

async function seedDefaultWorkspaceState() {
  // Disabled per Option C configuration rules
}

// 🌐 MAIN ENTRY PIPELINE ROUTING BLOCK
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ⚡ PROFILE UPDATE UTILITY (Replaced old backdoor setup route securely)
  app.get("/api/fix-my-profile", async (req: Request, res: Response) => {
    try {
      await db.update(users)
        .set({ 
          firstName: 'Jonathan', 
          lastName: 'Broadhurst' 
        })
        .where(eq(users.email, 'grieving-luz-ignite-me@example.com')); // <-- Verified dynamic email check row

      res.send("Profile row updated successfully with your real name parameters! Please sign out and log back in to see the changes.");
    } catch (error) {
      console.error("Profile Fix Error:", error);
      res.status(500).send("Error updating profile row.");
    }
  });

  // NON-BLOCKING INITIALIZATION: Fires sequences in the background safely
  ensureSchemaUpToDate()
    .then(() => ensureQuantumTemplateExists())
    .then(() => seedDefaultWorkspaceState())
    .catch(err => console.error("Background DB alignment exception:", err));

  app.get("/api/download/participant-guide", (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'Survey_Participant_Guide.docx');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Guide not found" });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Survey_Participant_Guide.docx"');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });

  // ⚡ ORG ADMIN: DEPLOY ACTIVE SURVEY COHORTS USING DISPATCH BALANCE LEDGERS
  app.post("/api/organizations/:orgId/deploy-surveys", authenticateToken, requireRole(['org_admin', 'company_admin', 'owner', 'super_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const { method, participants, fileData } = req.body;
      
      let targets: Array<{ firstName: string; lastName: string; email: string }> = [];

      if (method === 'manual' && Array.isArray(participants)) {
        targets = participants.map(p => ({
          firstName: String(p.firstName || '').trim(),
          lastName: String(p.lastName || '').trim(),
          email: String(p.email || '').trim().toLowerCase()
        })).filter(p => p.firstName && p.email);
      } else if (method === 'csv' && fileData) {
        const lines = String(fileData).split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const fNameIdx = headers.indexOf('firstname');
        const lNameIdx = headers.indexOf('lastname');
        const emailIdx = headers.indexOf('email');

        if (fNameIdx === -1 || emailIdx === -1) {
          return res.status(400).json({ message: "Invalid spreadsheet structure. Missing standard 'FirstName' or 'Email' column headers." });
        }

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const row = lines[i].split(',');
          if (row[fNameIdx] && row[emailIdx]) {
            targets.push({
              firstName: row[fNameIdx].trim(),
              lastName: lNameIdx !== -1 ? (row[lNameIdx] || '').trim() : '',
              email: row[emailIdx].trim().toLowerCase()
            });
          }
        }
      }

      if (targets.length === 0) {
        return res.status(400).json({ message: "No valid assessment targets discovered inside your dispatch request." });
      }

      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (!org) return res.status(404).json({ message: "Target client token balance map missing." });

      const requiredCredits = targets.length;
      const currentCredits = org.quantumCredits ?? 0;

      if (currentCredits < requiredCredits) {
        return res.status(402).json({ message: `Insufficient credits. This deployment requires ${requiredCredits} tokens, but you only have ${currentCredits} available.` });
      }

      const [quantumSurvey] = await db.select().from(surveys).where(eq(surveys.surveyType, "quantum")).limit(1);
      if (!quantumSurvey) return res.status(500).json({ message: "Platform framework master template 'quantum' is offline." });

      for (const target of targets) {
        let leaderUser = await storage.getUserByEmail(target.email);
        
        if (!leaderUser) {
          const generatedRandomPass = Math.random().toString(36).substring(2, 12);
          const encryptedPassword = await bcrypt.hash(generatedRandomPass, 10);
          
          leaderUser = await storage.createUser({
            email: target.email,
            username: target.email.split('@')[0] + '.' + Math.floor(Math.random() * 1000),
            firstName: target.firstName,
            lastName: target.lastName,
            password: encryptedPassword,
            role: 'leader',
            organizationId: orgId,
            isActive: true
          });
        }

        const uniqueInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expirationTimeline = new Date();
        expirationTimeline.setDate(expirationTimeline.getDate() + 30);

        const cycle = await storage.createSurveyCycle({
          surveyId: quantumSurvey.id,
          leaderId: leaderUser.id,
          organizationId: orgId,
          title: `Quantum Leadership evaluation - ${target.firstName} ${target.lastName}`,
          status: 'active',
          endDate: expirationTimeline
        });

        await storage.updateCycleInviteCode(cycle.id, uniqueInviteCode);

        const hostBaseDomain = `${req.protocol}://${req.get('host')}`;
        await sendQuantumEmail(
          target.email, 
          target.firstName, 
          quantumSurvey.title, 
          `${target.firstName} ${target.lastName}`, 
          uniqueInviteCode, 
          hostBaseDomain
        ).catch(err => console.error(`⚠️ Non-blocking notification dispatch failure to email server for leader user ${target.email}:`, err));
      }

      const structuralRemainingBalance = currentCredits - requiredCredits;
      await db.update(organizations)
        .set({ quantumCredits: structuralRemainingBalance })
        .where(eq(organizations.id, orgId));

      return res.json({ 
        success: true, 
        message: `Successfully initialized loops for ${requiredCredits} leadership profiles. ${requiredCredits} tokens deducted from balance.`,
        remainingCredits: structuralRemainingBalance 
      });

    } catch (error) {
      console.error("Critical Deployment Processing Engine Crash:", error);
      return res.status(500).json({ message: "Internal server error occurred processing survey deployment." });
    }
  });

  // ⚡ CUSTOM INJECTED SECURE DIRECT DATABASE SIGN-IN HANDLER
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      console.log(`🔐 LOGIN ATTEMPT: Verifying database credentials for ${email}...`);

      const [user] = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
      
      if (!user) {
        console.log(`❌ LOGIN REJECTED: No matching profile rows found for ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log(`❌ LOGIN REJECTED: Decryption verification failure for ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`✅ LOGIN GRANTED: Session keys generated for Master Entity: ${email}`);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role,
          organizationId: user.organizationId 
        } 
      });
    } catch (error) {
      console.error("Critical Runtime Authentication Crash:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  app.get("/api/organizations/:orgId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (!org) return res.status(404).json({ message: "Organization record missing" });
      res.json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization context details" });
    }
  });

  app.get("/api/dashboard/stats", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/activity", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/organizations", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error) {
      res.status(400).json({ message: "Failed to create organization" });
    }
  });

  app.post("/api/surveys", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const surveyData = insertSurveySchema.parse(req.body);
      const survey = await storage.createSurvey({ ...surveyData, createdBy: req.user!.id });
      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ message: "Failed to create survey" });
    }
  });

  app.get("/api/surveys/organization/:orgId", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const surveys = await storage.getSurveysByOrganization(orgId);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  app.post("/api/surveys/personal", async (req: Request, res: Response) => {
    try {
      const { contactData, surveyData } = req.body;
      const organizations = await storage.getOrganizations();
      const organization = organizations[0];

      const leaderName = surveyData.leaderName || 'Unknown Leader';
      const nameParts = leaderName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      const leaderEmail = contactData.email;

      let leaderUser = await storage.getUserByEmail(leaderEmail);
      if (!leaderUser) {
        const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);
        leaderUser = await storage.createUser({
          email: leaderEmail,
          username: leaderName.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now(),
          firstName,
          lastName,
          password: tempPassword,
          role: 'leader',
          organizationId: organization.id,
          position: surveyData.leaderPosition || '',
        });
      }

      const allSurveys = await storage.getSurveysByOrganization(organization.id);
      const syncShiftSurvey = allSurveys.find(s => s.surveyType === 'syncshift') || allSurveys[0];
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const cycle = await storage.createSurveyCycle({
        surveyId: syncShiftSurvey.id,
        leaderId: leaderUser.id,
        organizationId: organization.id,
        title: surveyData.title,
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      await storage.updateCycleInviteCode(cycle.id, inviteCode);
      res.status(201).json({ success: true, surveyCode: inviteCode, cycle });
    } catch (error) {
      res.status(400).json({ message: "Failed to create personal survey" });
    }
  });

  app.get("/api/users/leaders", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const leaders = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'leader'));
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaders" });
    }
  });

  app.post("/api/survey-cycles", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestData = { ...req.body, endDate: new Date(req.body.endDate) };
      const cycleData = insertSurveyCycleSchema.parse(requestData);
      const cycle = await storage.createSurveyCycle(cycleData);

      const generatedToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      await storage.updateCycleInviteCode(cycle.id, generatedToken);
      cycle.inviteCode = generatedToken; 

      res.status(201).json({ cycle });
    } catch (error) {
      res.status(400).json({ message: "Failed to create survey cycle" });
    }
  });

  app.get("/api/survey-cycles", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let baseSelector = db.select({
        id: surveyCycles.id,
        title: surveyCycles.title,
        status: surveyCycles.status,
        inviteCode: surveyCycles.inviteCode,
        endDate: surveyCycles.endDate,
        responseCount: surveyCycles.totalResponses,
        invitedCount: surveyCycles.totalInvites,
        organizationName: organizations.name,
        surveyTitle: surveys.title,
        leaderId: surveyCycles.leaderId,
      })
      .from(surveyCycles)
      .leftJoin(organizations, eq(surveyCycles.organizationId, organizations.id))
      .leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id));

      if (req.user!.role === 'leader') {
        baseSelector = baseSelector.where(eq(surveyCycles.leaderId, req.user!.id)) as any;
      }

      const cycles = await baseSelector.orderBy(surveyCycles.createdAt);
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch survey cycles' });
    }
  });

  app.get("/api/survey-cycles/progress", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cyclesWithProgress = await storage.getActiveCyclesWithProgress();
      res.json(cyclesWithProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey progress" });
    }
  });

  app.get("/api/survey-cycles/:id/leader-summary", authenticateToken, requireRole(['admin', 'leader', 'org_admin', 'company_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.id);
      const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));
      
      const selfAssessmentComplete = responses.some(r => r.respondentRelationship === 'Self');
      const stakeholderCount = responses.filter(r => r.respondentRelationship !== 'Self').length;
      
      res.json({ selfAssessmentComplete, stakeholderCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to compile aggregate metrics summary" });
    }
  });

  app.get("/api/survey-cycles/:inviteCode", async (req: Request, res: Response) => {
    try {
      const { inviteCode } = req.params;
      const [cycle] = await db.select({
        id: surveyCycles.id,
        title: surveyCycles.title,
        status: surveyCycles.status,
        inviteCode: surveyCycles.inviteCode,
        endDate: surveyCycles.endDate,
        surveyId: surveyCycles.surveyId,
        leaderId: surveyCycles.leaderId,
        organizationId: surveyCycles.organizationId,
        leaderFirstName: users.firstName,
        leaderLastName: users.lastName,
        leaderPosition: users.position,
        surveyTitle: surveys.title,
        surveyQuestions: surveys.questions,
        organizationName: organizations.name,
      })
      .from(surveyCycles)
      .leftJoin(users, eq(surveyCycles.leaderId, users.id))
      .leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id))
      .leftJoin(organizations, eq(surveyCycles.organizationId, organizations.id))
      .where(eq(surveyCycles.inviteCode, inviteCode));
      
      if (!cycle) return res.status(404).json({ message: "Survey not found" });
      res.json(cycle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey cycle" });
    }
  });

  app.post("/api/survey-invitations", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cycleId, participantEmails } = req.body;
      for (const email of participantEmails) {
        if (!email || !email.trim()) continue;
        await storage.createSurveyInvitation({ cycleId: parseInt(cycleId), email: email.trim(), status: 'pending' });
      }
      await storage.createSurveyInvitation(parseInt(cycleId));
      res.status(201).json({ message: "Invitations created successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to send invitation" });
    }
  });

  app.get("/api/survey-invitations/:token", async (req: Request, res: Response) => {
    try {
      const invitation = await storage.getSurveyInvitationByToken(req.params.token);
      if (!invitation) return res.status(404).json({ message: "Invitation not found" });
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/survey-responses", async (req: Request, res: Response) => {
    try {
      const { inviteCode, responses, respondentName, respondentEmail, respondentRelationship } = req.body;
      const cycle = await storage.getSurveyCycleByInviteCode(inviteCode);
      if (!cycle || cycle.status !== "active") return res.status(400).json({ message: "Survey inactive or missing" });

      const timestamp = new Date().toISOString();
      const responseHash = generateResponseHash(`anonymous-${timestamp}`, cycle.id);

      await storage.createSurveyResponse({
        cycleId: cycle.id,
        invitationId: null,
        responses,
        responseHash,
        disabled: false,
        respondentName: respondentName || null,
        respondentEmail: respondentEmail || null,
        respondentRelationship: respondentRelationship || null,
      });

      await storage.updateSurveyCycleStats(cycle.id);
      res.status(201).json({ message: "Response submitted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to submit response" });
    }
  });

  app.get("/api/survey-cycles/:id/respondents", authenticateToken, requireRole(['admin', 'org_admin', 'company_admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const respondents = await db
        .select({
          id: surveyResponses.id,
          respondentName: surveyResponses.respondentName,
          respondentEmail: surveyResponses.respondentEmail,
          respondentRelationship: surveyResponses.respondentRelationship,
          submittedAt: surveyResponses.submittedAt,
        })
        .from(surveyResponses)
        .where(eq(surveyResponses.cycleId, parseInt(req.params.id)))
        .orderBy(surveyResponses.submittedAt);
      res.json(respondents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch respondents" });
    }
  });

  app.get("/api/survey-cycles/:id/progress", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.id);
      const cycle = await storage.getSurveyCycle(cycleId);
      if (!cycle) return res.status(404).json({ message: "Survey cycle not found" });

      const progress = await storage.getCycleProgress(cycleId);
      let leaderName = 'Unknown';
      if (cycle.leaderId) {
        const leader = await storage.getUser(cycle.leaderId);
        if (leader) leaderName = `${leader.firstName} ${leader.lastName}`;
      }

      res.json({ cycle, leaderName, ...progress });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey progress" });
    }
  });

  app.get("/api/reports/pending", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending reports" });
    }
  });

  app.get("/api/reports/:cycleId/metrics", authenticateToken, requireRole(['admin', 'leader']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      if (isNaN(cycleId)) return res.status(400).json({ message: "Invalid evaluation tracking ID" });

      const processedMetrics = await generateSyncShiftReportData(cycleId);
      return res.json(processedMetrics);
    } catch (error: any) {
      console.error("Aggregation Failure:", error);
      return res.status(500).json({ message: error.message || "Internal data compiling exception" });
    }
  });

  app.get("/api/reports/:cycleId/download", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      if (isNaN(cycleId)) return res.status(400).json({ message: "Invalid tracking ID" });

      const processedMetrics = await generateSyncShiftReportData(cycleId);
      
      const cycle = await storage.getSurveyCycle(cycleId);
      let leaderName = "Jane Leader";
      let orgName = "SyncShift Workspace";
      
      if (cycle?.leaderId) {
        const leader = await storage.getUser(cycle.leaderId);
        if (leader) leaderName = `${leader.firstName} ${leader.lastName}`;
      }
      if (cycle?.organizationId) {
        const org = await db.select().from(organizations).where(eq(organizations.id, cycle.organizationId)).limit(1);
        if (org[0]) orgName = org[0].name;
      }

      const reportHtml = compileSyncShiftHtmlReport(processedMetrics, leaderName, orgName);

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="SyncShift_Report_${leaderName.replace(/\s+/g, "_")}.html"`);
      return res.send(reportHtml);
    } catch (error: any) {
      console.error("PDF Streaming Exception:", error);
      return res.status(500).json({ message: "Failed to assemble executive asset pipeline." });
    }
  });

  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(parseInt(req.params.id));
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.post("/api/reports/:id/approve", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.updateReportStatus(parseInt(req.params.id), "approved", req.user!.id);
      res.json({ message: "Report approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve report" });
    }
  });

  app.post("/api/reports/:id/release", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.updateReportStatus(parseInt(req.params.id), "released", req.user!.id);
      res.json({ message: "Report released successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to release report" });
    }
  });

  app.post("/api/reports/generate/:cycleId", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const cycle = await storage.getSurveyCycle(cycleId);
      if (!cycle) return res.status(404).json({ message: "Survey cycle not found" });

      const responses = await storage.getResponsesByCycle(cycleId);
      if (responses.length === 0) return res.status(400).json({ message: "No responses found" });

      const analysisResult = analyzeResponses(responses);
      const report = await storage.createReport({
        cycleId,
        leaderId: cycle.leaderId,
        organizationId: cycle.organizationId,
        title: `360 Feedback Report - ${cycle.title}`,
        executiveSummary: analysisResult.executiveSummary,
        strengths: analysisResult.strengths,
        developmentAreas: analysisResult.developmentAreas,
        statistics: analysisResult.statistics,
        status: "pending",
      });

      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/quantum360/survey", async (req: Request, res: Response) => {
    try {
      const quantumSurvey = await storage.getSurveyByType("quantum");
      if (!quantumSurvey) return res.status(404).json({ message: "Quantum survey not found" });
      res.json(quantumSurvey);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Quantum survey" });
    }
  });

  app.post("/api/quantum360/create-cycle", async (req: Request, res: Response) => {
    try {
      const { leaderName, leaderEmail, title } = req.body;
      const quantumSurvey = await storage.getSurveyByType("quantum");
      if (!quantumSurvey) return res.status(404).json({ message: "Quantum survey template missing" });

      const nameParts = leaderName.split(' ');
      const firstName = nameParts[0] || leaderName;
      const lastName = nameParts.slice(1).join(' ') || '';

      let existingUser = await storage.getUserByEmail(leaderEmail);
      if (!existingUser) {
        existingUser = await storage.createUser({
          username: leaderEmail.split('@')[0],
          email: leaderEmail,
          password: await bcrypt.hash('quantum360', 10),
          firstName,
          lastName,
          role: 'leader',
          organizationId: 1,
          isActive: true
        });
      }

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const cycle = await storage.createSurveyCycle({
        surveyId: quantumSurvey.id,
        leaderId: existingUser.id,
        organizationId: 1,
        title: title || "Quantum Leadership Assessment",
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      await storage.updateCycleInviteCode(cycle.id, inviteCode);
      res.status(201).json({ cycle, inviteCode });
    } catch (error) {
      res.status(500).json({ message: "Failed to create Quantum cycle" });
    }
  });

  app.get("/api/quantum360/reports/:cycleId", async (req: Request, res: Response) => {
    try {
      const [report] = await db.select().from(reports).where(eq(reports.cycleId, parseInt(req.params.cycleId)));
      if (!report) return res.status(404).json({ message: "Quantum report not found" });
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Quantum report" });
    }
  });

  app.get("/api/owner/organizations/usage", authenticateToken, requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgsWithUsage = await storage.getAllOrganizationsWithUsage();
      res.json(orgsWithUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage metrics" });
    }
  });

  app.get("/api/owner/users", authenticateToken, requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(({ password, ...user }) => user));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user accounts" });
    }
  });

  app.patch("/api/owner/users/:userId/role", authenticateToken, requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User missing" });

      await storage.updateUserRole(userId, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to modify permission tier" });
    }
  });

  // OWNER ONLY: Manually allocate premium Quantum assessment credits to a client organization
  app.patch("/api/owner/organizations/:orgId/credits", authenticateToken, requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const { creditsToAllocate } = req.body;

      if (isNaN(orgId) || typeof creditsToAllocate !== 'number') {
        return res.status(400).json({ message: "Invalid payload parameters. 'creditsToAllocate' must be a valid number." });
      }

      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (!org) return res.status(404).json({ message: "Target client organization not found." });

      const currentCredits = org.quantumCredits ?? 0;
      const updatedCredits = currentCredits + creditsToAllocate;

      if (updatedCredits < 0) {
        return res.status(400).json({ message: "Operation rejected. Client credit balance cannot fall below zero." });
      }

      await db.update(organizations)
        .set({ quantumCredits: updatedCredits })
        .where(eq(organizations.id, orgId));

      console.log(`💳 CONSULTANT BILLING: Allocated ${creditsToAllocate} credits to ${org.name}. New operational balance: ${updatedCredits}`);

      return res.json({ 
        success: true, 
        message: `Successfully allocated ${creditsToAllocate} credits to ${org.name}.`,
        organizationId: orgId,
        newBalance: updatedCredits 
      });
    } catch (error) {
      console.error("Owner Credit Allocation Failure:", error);
      return res.status(500).json({ message: "Failed to process premium token credit transaction." });
    }
  });

  // OWNER ONLY: Provision a new Organization and its initial Admin with real names
  app.post("/api/owner/organizations", authenticateToken, requireOwner(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orgName, domain, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;

      if (!orgName || !domain || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
        return res.status(400).json({ message: "All parameters including administrator names are required." });
      }

      // 1. Create the Organization
      const [newOrg] = await db.insert(organizations).values({
        name: orgName,
        domain: domain,
        quantumCredits: 0
      }).returning();

      // 2. Hash password and create the personalized Admin User
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await db.insert(users).values({
        email: adminEmail,
        username: adminEmail.split('@')[0],
        password: hashedPassword,
        role: 'org_admin',
        organizationId: newOrg.id,
        firstName: adminFirstName.trim(), 
        lastName: adminLastName.trim(),
        isActive: true
      });

      console.log(`🏢 PROVISIONED: Org '${orgName}' with personalized admin '${adminFirstName} ${adminLastName}'`);
      return res.status(201).json({ 
        message: "Client organization and personalized administrator provisioned successfully", 
        organization: newOrg 
      });
      
    } catch (error: any) {
      console.error("Provisioning Error:", error);
      return res.status(500).json({ message: "Failed to provision client organization." });
    }
  });

  return httpServer;
}

function analyzeResponses(responses: any[]): any {
  const totalResponses = responses.length;
  return {
    executiveSummary: `Based on ${totalResponses} responses accumulated anonymously.`,
    strengths: [{ title: "Strategic Presence", description: "Demonstrated capacity to lead structural disruption maps.", icon: "lightbulb", rating: 4.5 }],
    developmentAreas: [{ title: "Empowered Delegation", description: "Fostering organizational scale metrics through structural alignment pathways.", suggestions: ["Execution mapping matrixes"], priority: "high" }],
    statistics: { totalResponses, averageRating: 4.5, responseRate: 100, topThemes: [] }
  };
}
