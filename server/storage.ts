import { 
  users, organizations, surveys, surveyCycles, surveyInvitations, surveyResponses, reports, auditLog,
  type User, type InsertUser, type Organization, type InsertOrganization, 
  type Survey, type InsertSurvey, type SurveyCycle, type InsertSurveyCycle,
  type SurveyInvitation, type InsertSurveyInvitation, type SurveyResponse, type InsertSurveyResponse,
  type Report, type InsertReport, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Organization methods
  getOrganizations(): Promise<Organization[]>;
  createOrganization(insertOrg: InsertOrganization): Promise<Organization>;

  // Survey methods
  createSurvey(insertSurvey: InsertSurvey): Promise<Survey>;
  getSurveysByOrganization(orgId: number): Promise<Survey[]>;
  getSurveyByType(surveyType: string): Promise<Survey | undefined>;

  // Survey cycle methods
  createSurveyCycle(insertCycle: InsertSurveyCycle): Promise<SurveyCycle>;
  getSurveyCycle(id: number): Promise<SurveyCycle | undefined>;
  getSurveyCycleByInviteCode(inviteCode: string): Promise<SurveyCycle | undefined>;
  updateSurveyCycleStats(cycleId: number): Promise<void>;
  updateCycleInviteCode(cycleId: number, inviteCode: string): Promise<void>;

  // Survey invitation methods
  createSurveyInvitation(insertInvitation: InsertSurveyInvitation): Promise<SurveyInvitation>;
  getSurveyInvitationByToken(token: string): Promise<SurveyInvitation | undefined>;
  updateInvitationStatus(id: number, status: string, completedAt?: Date): Promise<void>;

  // Survey response methods
  createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse>;
  getResponsesByCycle(cycleId: number): Promise<SurveyResponse[]>;

  // Report methods
  createReport(insertReport: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getPendingReports(): Promise<Report[]>;
  updateReportStatus(id: number, status: string, userId: number): Promise<void>;

  // Dashboard methods
  getDashboardStats(): Promise<any>;
  getRecentActivity(limit: number): Promise<AuditLog[]>;

  // Progress tracking methods
  getCycleProgress(cycleId: number): Promise<{
    totalInvites: number;
    completedInvites: number;
    pendingInvites: number;
    completionPercentage: number;
    invitations: Array<{
      id: number;
      email: string;
      status: string;
      sentAt: Date | null;
      completedAt: Date | null;
    }>;
  }>;
  getActiveCyclesWithProgress(): Promise<Array<{
    cycle: SurveyCycle;
    leaderName: string;
    surveyTitle: string;
    totalInvites: number;
    completedInvites: number;
    completionPercentage: number;
  }>>;

  // Audit methods
  logActivity(insertAudit: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.isActive, true));
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(insertOrg)
      .returning();
    return org;
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const [survey] = await db
      .insert(surveys)
      .values(insertSurvey)
      .returning();
    return survey;
  }

  async getSurveysByOrganization(orgId: number): Promise<Survey[]> {
    return await db.select().from(surveys).where(eq(surveys.organizationId, orgId));
  }

  async getSurveyByType(surveyType: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.surveyType, surveyType));
    return survey || undefined;
  }

  async createSurveyCycle(insertCycle: InsertSurveyCycle): Promise<SurveyCycle> {
    const [cycle] = await db
      .insert(surveyCycles)
      .values(insertCycle)
      .returning();
    return cycle;
  }

  async getSurveyCycle(id: number): Promise<SurveyCycle | undefined> {
    const [cycle] = await db.select().from(surveyCycles).where(eq(surveyCycles.id, id));
    return cycle || undefined;
  }

  async getSurveyCycleByInviteCode(inviteCode: string): Promise<SurveyCycle | undefined> {
    const [cycle] = await db.select().from(surveyCycles).where(eq(surveyCycles.inviteCode, inviteCode));
    return cycle || undefined;
  }

  async updateSurveyCycleStats(cycleId: number): Promise<void> {
    const [inviteCount] = await db.select({ count: count() }).from(surveyInvitations).where(eq(surveyInvitations.cycleId, cycleId));
    const [responseCount] = await db.select({ count: count() }).from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));
    
    await db.update(surveyCycles)
      .set({
        totalInvites: inviteCount.count,
        totalResponses: responseCount.count
      })
      .where(eq(surveyCycles.id, cycleId));
  }

  async updateCycleInviteCode(cycleId: number, inviteCode: string): Promise<void> {
    await db.update(surveyCycles)
      .set({ inviteCode })
      .where(eq(surveyCycles.id, cycleId));
  }

  async createSurveyInvitation(insertInvitation: InsertSurveyInvitation): Promise<SurveyInvitation> {
    const [invitation] = await db
      .insert(surveyInvitations)
      .values(insertInvitation)
      .returning();
    return invitation;
  }

  async getSurveyInvitationByToken(token: string): Promise<SurveyInvitation | undefined> {
    const [invitation] = await db.select().from(surveyInvitations).where(eq(surveyInvitations.inviteToken, token));
    return invitation || undefined;
  }

  async updateInvitationStatus(id: number, status: string, completedAt?: Date): Promise<void> {
    await db.update(surveyInvitations)
      .set({ status, completedAt })
      .where(eq(surveyInvitations.id, id));
  }

  async createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db
      .insert(surveyResponses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async getResponsesByCycle(cycleId: number): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getPendingReports(): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.status, 'pending'));
  }

  async updateReportStatus(id: number, status: string, userId: number): Promise<void> {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = userId;
    } else if (status === 'released') {
      updateData.releasedAt = new Date();
      updateData.releasedBy = userId;
    }
    
    await db.update(reports)
      .set(updateData)
      .where(eq(reports.id, id));
  }

  async getDashboardStats(): Promise<any> {
    const [activeOrgs] = await db.select({ count: count() }).from(organizations).where(eq(organizations.isActive, true));
    const [activeSurveys] = await db.select({ count: count() }).from(surveyCycles).where(eq(surveyCycles.status, 'active'));
    const [pendingReports] = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'pending'));
    const [totalParticipants] = await db.select({ count: count() }).from(users).where(eq(users.role, 'participant'));

    return {
      activeOrganizations: activeOrgs.count,
      activeSurveys: activeSurveys.count,
      pendingReports: pendingReports.count,
      totalParticipants: totalParticipants.count
    };
  }

  async getRecentActivity(limit: number): Promise<AuditLog[]> {
    return await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
  }

  async logActivity(insertAudit: InsertAuditLog): Promise<AuditLog> {
    const [activity] = await db
      .insert(auditLog)
      .values(insertAudit)
      .returning();
    return activity;
  }

  async getCycleProgress(cycleId: number): Promise<{
    totalInvites: number;
    completedInvites: number;
    pendingInvites: number;
    completionPercentage: number;
    invitations: Array<{
      id: number;
      email: string;
      status: string;
      sentAt: Date | null;
      completedAt: Date | null;
    }>;
  }> {
    const invitations = await db.select().from(surveyInvitations)
      .where(eq(surveyInvitations.cycleId, cycleId));
    
    const totalInvites = invitations.length;
    const completedInvites = invitations.filter(inv => inv.status === 'completed').length;
    const pendingInvites = totalInvites - completedInvites;
    const completionPercentage = totalInvites > 0 ? Math.round((completedInvites / totalInvites) * 100) : 0;

    return {
      totalInvites,
      completedInvites,
      pendingInvites,
      completionPercentage,
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        status: inv.status || 'pending',
        sentAt: inv.sentAt,
        completedAt: inv.completedAt
      }))
    };
  }

  async getActiveCyclesWithProgress(): Promise<Array<{
    cycle: SurveyCycle;
    leaderName: string;
    surveyTitle: string;
    totalInvites: number;
    completedInvites: number;
    completionPercentage: number;
  }>> {
    const cycles = await db.select().from(surveyCycles)
      .where(eq(surveyCycles.status, 'active'));
    
    const results = await Promise.all(cycles.map(async (cycle) => {
      const progress = await this.getCycleProgress(cycle.id);
      
      // Get leader name
      let leaderName = 'Unknown';
      if (cycle.leaderId) {
        const leader = await this.getUser(cycle.leaderId);
        if (leader) {
          leaderName = `${leader.firstName} ${leader.lastName}`;
        }
      }
      
      // Get survey title
      let surveyTitle = 'Unknown Survey';
      if (cycle.surveyId) {
        const [survey] = await db.select().from(surveys).where(eq(surveys.id, cycle.surveyId));
        if (survey) {
          surveyTitle = survey.title;
        }
      }
      
      return {
        cycle,
        leaderName,
        surveyTitle,
        totalInvites: progress.totalInvites,
        completedInvites: progress.completedInvites,
        completionPercentage: progress.completionPercentage
      };
    }));
    
    return results;
  }
}

export const storage = new DatabaseStorage();