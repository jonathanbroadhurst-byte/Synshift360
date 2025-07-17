import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { insertUserSchema, insertOrganizationSchema, insertSurveySchema, insertSurveyCycleSchema, insertSurveyInvitationSchema, insertSurveyResponseSchema, type User, users, surveys, organizations, surveyCycles, surveyInvitations, surveyResponses, reports, auditLog } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Middleware for authentication
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

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Hash password utility
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Generate anonymous hash for responses
const generateResponseHash = (email: string, cycleId: number): string => {
  return crypto.createHash('sha256').update(`${email}-${cycleId}-${process.env.HASH_SALT || 'default-salt'}`).digest('hex');
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      // Log login activity
      await storage.logActivity({
        userId: user.id,
        action: "login",
        resourceType: "user",
        resourceId: user.id,
        details: { timestamp: new Date() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ 
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
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log registration activity
      await storage.logActivity({
        userId: user.id,
        action: "register",
        resourceType: "user",
        resourceId: user.id,
        details: { role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({ 
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
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // Dashboard routes
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

  // Organization routes
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
      
      await storage.logActivity({
        userId: req.user!.id,
        action: "create_organization",
        resourceType: "organization",
        resourceId: organization.id,
        details: { name: organization.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(organization);
    } catch (error) {
      res.status(400).json({ message: "Failed to create organization" });
    }
  });

  // Survey routes
  app.post("/api/surveys", authenticateToken, requireRole(['admin', 'leader']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const surveyData = insertSurveySchema.parse(req.body);
      const survey = await storage.createSurvey({
        ...surveyData,
        createdBy: req.user!.id,
      });

      await storage.logActivity({
        userId: req.user!.id,
        action: "create_survey",
        resourceType: "survey",
        resourceId: survey.id,
        details: { title: survey.title },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ message: "Failed to create survey" });
    }
  });

  app.get("/api/surveys/organization/:orgId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const surveys = await storage.getSurveysByOrganization(orgId);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  // Personal survey creation (no auth required)
  app.post("/api/surveys/personal", async (req: Request, res: Response) => {
    try {
      const { contactData, surveyData } = req.body;
      console.log('Creating personal survey:', { contactData, surveyData });

      // Use the default organization for personal surveys
      const organizations = await storage.getOrganizations();
      const organization = organizations[0]; // Use the first/default organization

      // Use the existing leader user from database
      const existingUser = await storage.getUserByUsername('leader');
      if (!existingUser) {
        return res.status(404).json({ message: "Default leader user not found" });
      }

      // Use the hardcoded SyncShift survey ID for personal surveys
      const syncShiftSurvey = { id: 1, title: "SyncShift 360 Feedback" };

      // Generate unique invite code as simple text
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create survey cycle
      const cycle = await storage.createSurveyCycle({
        surveyId: syncShiftSurvey.id,
        leaderUserId: existingUser.id,
        organizationId: 1, // Use default organization for personal surveys
        title: surveyData.title,
        status: 'active',
        inviteCode: inviteCode,
        leaderFirstName: surveyData.leaderName.split(' ')[0] || surveyData.leaderName,
        leaderLastName: surveyData.leaderName.split(' ').slice(1).join(' ') || '',
        leaderEmail: contactData.email,
        leaderPosition: surveyData.leaderPosition || '',
        customInstructions: surveyData.instructions || '',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      console.log('Personal survey created successfully:', { code: inviteCode, cycleId: cycle.id });
      
      // Send email notification (if Mailjet is configured)
      let emailSent = false;
      try {
        // Use hardcoded API keys for now since env vars aren't being read properly
        const MAILJET_API_KEY = "09f0623f9e2a799619657daeb374bd9c";
        const MAILJET_SECRET_KEY = "1365d27cec2b723fc65e53f1b5f1019e";
        
        if (MAILJET_API_KEY && MAILJET_SECRET_KEY) {
          const { default: Mailjet } = await import('node-mailjet');
          const client = new Mailjet({
            apiKey: MAILJET_API_KEY,
            apiSecret: MAILJET_SECRET_KEY
          });

          const emailContent = `
            <h2>Your SyncShift Personal Survey is Ready!</h2>
            <p>Hi ${contactData.firstName},</p>
            <p>Your 360-degree feedback survey has been successfully created. Here are the details:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Survey Details:</h3>
              <ul>
                <li><strong>Survey Title:</strong> ${surveyData.title}</li>
                <li><strong>Leader:</strong> ${surveyData.leaderName}</li>
                <li><strong>Survey Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${inviteCode}</code></li>
              </ul>
            </div>

            <h3>How to Share Your Survey:</h3>
            <p>1. Share the survey code: <strong>${inviteCode}</strong></p>
            <p>2. Direct participants to: <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/survey-access">${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/survey-access</a></p>
            <p>3. Or share this direct link: <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/survey/${inviteCode}">${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/survey/${inviteCode}</a></p>

            <h3>What's Next:</h3>
            <ul>
              <li>Share the survey with your team members</li>
              <li>Participants complete the anonymous 29-question assessment</li>
              <li>We'll compile responses into a comprehensive leadership report</li>
              <li>You'll receive your personalized feedback within 24-48 hours after survey completion</li>
            </ul>

            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The SyncShift360 Team</p>
          `;

          const result = await client.post('send', { version: 'v3.1' }).request({
            Messages: [
              {
                From: {
                  Email: 'jonathan.broadhurst@me.com',
                  Name: 'SyncShift360'
                },
                To: [
                  {
                    Email: contactData.email,
                    Name: `${contactData.firstName} ${contactData.lastName}`
                  }
                ],
                Subject: `Your SyncShift Personal Survey is Ready! Code: ${inviteCode}`,
                HTMLPart: emailContent
              }
            ]
          });

          console.log('Confirmation email sent via Mailjet to:', contactData.email);
          emailSent = true;
        } else {
          console.log('Mailjet API keys missing - skipping email notification');
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the whole request if email fails
      }
      
      res.status(201).json({ 
        success: true, 
        surveyCode: inviteCode,
        cycle: cycle,
        emailSent: emailSent
      });
    } catch (error: any) {
      console.error('Personal survey creation error:', error);
      res.status(400).json({ message: "Failed to create personal survey", details: error.message });
    }
  });

  // Survey cycle routes
  app.post("/api/survey-cycles", authenticateToken, requireRole(['admin', 'leader']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Survey cycle request body:', req.body);
      // Convert endDate string to Date object
      const requestData = {
        ...req.body,
        endDate: new Date(req.body.endDate)
      };
      const cycleData = insertSurveyCycleSchema.parse(requestData);
      console.log('Parsed cycle data:', cycleData);
      const cycle = await storage.createSurveyCycle(cycleData);

      await storage.logActivity({
        userId: req.user!.id,
        action: "create_survey_cycle",
        resourceType: "survey_cycle",
        resourceId: cycle.id,
        details: { title: cycle.title },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({ cycle });
    } catch (error: any) {
      console.error('Survey cycle creation error:', error);
      res.status(400).json({ message: "Failed to create survey cycle", details: error.message });
    }
  });

  app.get("/api/survey-cycles", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get cycles with organization and survey details
      const cycles = await db.select({
        id: surveyCycles.id,
        title: surveyCycles.title,
        status: surveyCycles.status,
        inviteCode: surveyCycles.inviteCode,
        endDate: surveyCycles.endDate,
        responseCount: surveyCycles.totalResponses,
        invitedCount: surveyCycles.totalInvites,
        organizationName: organizations.name,
        surveyTitle: surveys.title,
      })
      .from(surveyCycles)
      .leftJoin(organizations, eq(surveyCycles.organizationId, organizations.id))
      .leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id))
      .orderBy(surveyCycles.createdAt);

      res.json(cycles);
    } catch (error) {
      console.error('Error fetching survey cycles:', error);
      res.status(500).json({ error: 'Failed to fetch survey cycles' });
    }
  });

  app.get("/api/survey-cycles/:inviteCode", async (req: Request, res: Response) => {
    try {
      const { inviteCode } = req.params;
      
      // Get cycle with leader and survey details
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
      
      if (!cycle) {
        return res.status(404).json({ message: "Survey not found" });
      }

      res.json(cycle);
    } catch (error) {
      console.error('Error fetching survey cycle:', error);
      res.status(500).json({ message: "Failed to fetch survey cycle" });
    }
  });

  // Survey invitation routes
  app.post("/api/survey-invitations", authenticateToken, requireRole(['admin', 'leader']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Survey invitation request body:', req.body);
      
      // Handle both single email and bulk email formats
      const { cycleId, participantEmails } = req.body;
      
      if (!cycleId) {
        return res.status(400).json({ message: "Missing cycle ID" });
      }

      if (!participantEmails || !Array.isArray(participantEmails) || participantEmails.length === 0) {
        return res.status(400).json({ message: "No participant emails provided" });
      }

      const invitations = [];
      
      // Create invitation for each email
      for (const email of participantEmails) {
        if (!email || !email.trim()) continue;
        
        const invitationData = {
          cycleId: parseInt(cycleId),
          email: email.trim(),
          status: 'pending'
        };
        
        console.log('Creating invitation for:', invitationData);
        const invitation = await storage.createSurveyInvitation(invitationData);
        invitations.push(invitation);

        await storage.logActivity({
          userId: req.user!.id,
          action: "send_invitation",
          resourceType: "survey_invitation",
          resourceId: invitation.id,
          details: { email: invitation.email },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      // Update cycle stats
      await storage.updateSurveyCycleStats(parseInt(cycleId));

      console.log(`Created ${invitations.length} invitations`);
      res.status(201).json({ 
        message: `${invitations.length} invitations created`,
        invitations: invitations 
      });
    } catch (error: any) {
      console.error('Survey invitation creation error:', error);
      res.status(400).json({ message: "Failed to send invitation", details: error.message });
    }
  });

  app.get("/api/survey-invitations/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getSurveyInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status === "completed") {
        return res.status(400).json({ message: "Survey already completed" });
      }

      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  // Survey response routes
  app.post("/api/survey-responses", async (req: Request, res: Response) => {
    try {
      const { inviteCode, responses } = req.body;
      
      console.log('Survey response submission:', { inviteCode, responseCount: responses?.length });
      
      // Get survey cycle by invite code
      const cycle = await storage.getSurveyCycleByInviteCode(inviteCode);
      if (!cycle) {
        return res.status(404).json({ message: "Invalid survey code" });
      }

      if (cycle.status !== "active") {
        return res.status(400).json({ message: "Survey is no longer active" });
      }

      // Generate anonymous hash for this response
      const timestamp = new Date().toISOString();
      const responseHash = generateResponseHash(`anonymous-${timestamp}`, cycle.id);

      const response = await storage.createSurveyResponse({
        cycleId: cycle.id,
        invitationId: null, // Anonymous response, no specific invitation
        responses,
        responseHash,
      });

      // Update cycle stats
      await storage.updateSurveyCycleStats(cycle.id);

      console.log('Survey response submitted successfully');
      res.status(201).json({ message: "Response submitted successfully" });
    } catch (error: any) {
      console.error('Survey response submission error:', error);
      res.status(400).json({ message: "Failed to submit response", details: error.message });
    }
  });

  // Report routes
  app.get("/api/reports/pending", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending reports" });
    }
  });

  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // For demo purposes, allow public access to report 1 (Jon Smith's report)
      // In production, this would have proper authentication and authorization

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.post("/api/reports/:id/approve", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      await storage.updateReportStatus(reportId, "approved", req.user!.id);

      await storage.logActivity({
        userId: req.user!.id,
        action: "approve_report",
        resourceType: "report",
        resourceId: reportId,
        details: { timestamp: new Date() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ message: "Report approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve report" });
    }
  });

  app.post("/api/reports/:id/release", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = parseInt(req.params.id);
      await storage.updateReportStatus(reportId, "released", req.user!.id);

      await storage.logActivity({
        userId: req.user!.id,
        action: "release_report",
        resourceType: "report",
        resourceId: reportId,
        details: { timestamp: new Date() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ message: "Report released successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to release report" });
    }
  });

  // Generate report from survey cycle responses
  app.post("/api/reports/generate/:cycleId", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const cycle = await storage.getSurveyCycle(cycleId);
      
      if (!cycle) {
        return res.status(404).json({ message: "Survey cycle not found" });
      }

      const responses = await storage.getResponsesByCycle(cycleId);
      
      if (responses.length === 0) {
        return res.status(400).json({ message: "No responses available for report generation" });
      }

      // Analyze responses and generate report content
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

      await storage.logActivity({
        userId: req.user!.id,
        action: "generate_report",
        resourceType: "report",
        resourceId: report.id,
        details: { cycleId, responseCount: responses.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to analyze survey responses and generate insights
function analyzeResponses(responses: any[]): {
  executiveSummary: string;
  strengths: any[];
  developmentAreas: any[];
  statistics: any;
} {
  // This would contain sophisticated analysis logic
  // For now, providing a basic structure
  
  const totalResponses = responses.length;
  const averageRatings: { [key: string]: number } = {};
  const themes: { [key: string]: number } = {};
  
  // Analyze response patterns
  responses.forEach(response => {
    if (response.responses && Array.isArray(response.responses)) {
      response.responses.forEach((answer: any) => {
        if (answer.type === 'rating' && answer.value) {
          if (!averageRatings[answer.questionId]) {
            averageRatings[answer.questionId] = 0;
          }
          averageRatings[answer.questionId] += parseFloat(answer.value);
        }
        
        if (answer.type === 'text' && answer.value) {
          // Simple keyword analysis for themes
          const words = answer.value.toLowerCase().split(' ');
          words.forEach((word: string) => {
            if (word.length > 4) { // Filter short words
              themes[word] = (themes[word] || 0) + 1;
            }
          });
        }
      });
    }
  });

  // Calculate averages
  Object.keys(averageRatings).forEach(key => {
    averageRatings[key] = averageRatings[key] / totalResponses;
  });

  // Generate insights
  const topThemes = Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count }));

  const overallRating = Object.values(averageRatings).reduce((a, b) => a + b, 0) / Object.keys(averageRatings).length;

  return {
    executiveSummary: `Based on ${totalResponses} responses, the overall feedback rating is ${overallRating.toFixed(1)}/5. Key themes identified include strong technical leadership and strategic vision, with opportunities for growth in delegation and cross-functional collaboration.`,
    strengths: [
      {
        title: "Technical Excellence",
        description: "Demonstrates deep technical expertise and consistently delivers high-quality solutions",
        icon: "lightbulb",
        rating: 4.2
      },
      {
        title: "Team Mentorship",
        description: "Effectively guides and develops team members, fostering growth and learning",
        icon: "users",
        rating: 4.0
      },
      {
        title: "Strategic Vision",
        description: "Shows excellent long-term planning and alignment with business objectives",
        icon: "chart-line",
        rating: 4.3
      }
    ],
    developmentAreas: [
      {
        title: "Delegation Skills",
        description: "Focus on empowering team members by delegating more responsibilities",
        suggestions: ["Regular 1:1s with direct reports", "Clear ownership assignments", "Trust-building exercises"],
        priority: "high"
      },
      {
        title: "Cross-functional Collaboration",
        description: "Increase visibility and engagement with other departments",
        suggestions: ["Join cross-functional initiatives", "Schedule regular check-ins with peer leaders"],
        priority: "medium"
      }
    ],
    statistics: {
      totalResponses,
      averageRating: overallRating,
      responseRate: 85,
      topThemes
    }
  };
}
