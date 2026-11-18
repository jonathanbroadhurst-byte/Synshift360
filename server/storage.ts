import { 
  users, organizations, surveys, surveyCycles, surveyInvitations, surveyResponses, reports, auditLog, surveyCreditBalances,
  type User, type InsertUser, type Organization, type InsertOrganization, 
  type Survey, type InsertSurvey, type SurveyCycle, type InsertSurveyCycle,
  type SurveyInvitation, type InsertSurveyInvitation, type SurveyResponse, type InsertSurveyResponse,
  type Report, type InsertReport, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(insertOrg: InsertOrganization): Promise<Organization>;
  createSurvey(insertSurvey: InsertSurvey): Promise<Survey>;
  getSurveysByOrganization(orgId: number): Promise<Survey[]>;
  getAllSurveys(): Promise<Survey[]>;
  getSurveyByType(surveyType: string): Promise<Survey | undefined>;
  createSurveyCycle(insertCycle: InsertSurveyCycle): Promise<SurveyCycle>;
  getSurveyCycle(id: number): Promise<SurveyCycle | undefined>;
  getSurveyCycleByInviteCode(inviteCode: string): Promise<SurveyCycle | undefined>;
  updateSurveyCycleStats(cycleId: number): Promise<void>;
  updateCycleInviteCode(cycleId: number, inviteCode: string): Promise<void>;
  createSurveyInvitation(insertInvitation: InsertSurveyInvitation): Promise<SurveyInvitation>;
  getSurveyInvitationByToken(token: string): Promise<SurveyInvitation | undefined>;
  updateInvitationStatus(id: number, status: string, completedAt?: Date): Promise<void>;
  createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse>;
  getResponsesByCycle(cycleId: number): Promise<SurveyResponse[]>;
  createReport(insertReport: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getPendingReports(): Promise<Report[]>;
  updateReportStatus(id: number, status: string, userId: number): Promise<void>;
  getDashboardStats(): Promise<any>;
  getRecentActivity(limit: number): Promise<AuditLog[]>;
  getCycleProgress(cycleId: number): Promise<any>;
  getActiveCyclesWithProgress(): Promise<any>;
  getAllOrganizationsWithUsage(): Promise<Array<{
    organization: Organization;
    activeSurveys: number;
    totalParticipants: number;
    completedResponses: number;
    pendingResponses: number;
  }>>;
  getOrganizationAdmins(orgId: number): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<void>;
  assignUserRoleOrg(userId: number, role: string, organizationId: number): Promise<void>;
  createAdminForOrg(orgId: number, data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserProfile(userId: number, data: { firstName?: string; lastName?: string; email?: string }): Promise<User>;
  resetUserPassword(userId: number, hashedPassword: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getSurveyCreditBalances(orgId: number): Promise<Array<{ surveyType: string; credits: number }>>;
  getSurveyCredit(orgId: number, surveyType: string): Promise<number>;
  addSurveyCredits(orgId: number, surveyType: string, amount: number): Promise<number>;
  deductSurveyCredits(orgId: number, surveyType: string, amount: number): Promise<number>;
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const [survey] = await db.insert(surveys).values(insertSurvey).returning();
    return survey;
  }

  async getSurveysByOrganization(orgId: number): Promise<Survey[]> {
    return await db.select().from(surveys).where(eq(surveys.organizationId, orgId));
  }

  async getAllSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys);
  }

  async getSurveyByType(surveyType: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.surveyType, surveyType));
    return survey || undefined;
  }

  async createSurveyCycle(insertCycle: InsertSurveyCycle): Promise<SurveyCycle> {
    const [cycle] = await db.insert(surveyCycles).values(insertCycle).returning();
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
    await db.update(surveyCycles).set({ totalInvites: inviteCount.count, totalResponses: responseCount.count }).where(eq(surveyCycles.id, cycleId));
  }

  async updateCycleInviteCode(cycleId: number, inviteCode: string): Promise<void> {
    await db.update(surveyCycles).set({ inviteCode }).where(eq(surveyCycles.id, cycleId));
  }

  async createSurveyInvitation(insertInvitation: InsertSurveyInvitation): Promise<SurveyInvitation> {
    const [invitation] = await db.insert(surveyInvitations).values(insertInvitation).returning();
    return invitation;
  }

  async getSurveyInvitationByToken(token: string): Promise<SurveyInvitation | undefined> {
    const [invitation] = await db.select().from(surveyInvitations).where(eq(surveyInvitations.inviteToken, token));
    return invitation || undefined;
  }

  async updateInvitationStatus(id: number, status: string, completedAt?: Date): Promise<void> {
    await db.update(surveyInvitations).set({ status, completedAt }).where(eq(surveyInvitations.id, id));
  }

  async createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db.insert(surveyResponses).values(insertResponse).returning();
    return response;
  }

  async getResponsesByCycle(cycleId: number): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses).where(eq(surveyResponses.cycleId, cycleId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
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
    if (status === 'approved') { updateData.approvedAt = new Date(); updateData.approvedBy = userId; }
    else if (status === 'released') { updateData.releasedAt = new Date(); updateData.releasedBy = userId; }
    await db.update(reports).set(updateData).where(eq(reports.id, id));
  }

  async getDashboardStats(): Promise<any> {
    const [activeOrgs] = await db.select({ count: count() }).from(organizations);
    const [activeSurveys] = await db.select({ count: count() }).from(surveyCycles).where(eq(surveyCycles.status, 'active'));
    return { activeOrganizations: activeOrgs.count, activeSurveys: activeSurveys.count };
  }

  async getRecentActivity(limit: number): Promise<AuditLog[]> {
    return await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
  }

  async logActivity(insertAudit: InsertAuditLog): Promise<AuditLog> {
    const [activity] = await db.insert(auditLog).values(insertAudit).returning();
    return activity;
  }

  async getCycleProgress(cycleId: number): Promise<any> {
    const invitations = await db.select().from(surveyInvitations).where(eq(surveyInvitations.cycleId, cycleId));
    return { totalInvites: invitations.length };
  }

  async getActiveCyclesWithProgress(): Promise<any[]> {
    try {
      const activeCycles = await db
        .select({
          cycleId: surveyCycles.id,
          title: surveyCycles.title,
          status: surveyCycles.status,
          endDate: surveyCycles.endDate,
          inviteCode: surveyCycles.inviteCode,
          leaderFirstName: users.firstName,
          leaderLastName: users.lastName,
          surveyTitle: surveys.title,
          totalResponses: sql<number>`count(${surveyResponses.id})::int`
        })
        .from(surveyCycles)
        .leftJoin(users, eq(surveyCycles.leaderId, users.id))
        .leftJoin(surveys, eq(surveyCycles.surveyId, surveys.id))
        .leftJoin(surveyResponses, eq(surveyResponses.cycleId, surveyCycles.id))
        .where(eq(surveyCycles.status, 'active'))
        .groupBy(surveyCycles.id, users.firstName, users.lastName, surveys.title);

      return activeCycles.map(item => ({
        cycle: {
          id: item.cycleId,
          title: item.title,
          status: item.status,
          endDate: item.endDate,
          inviteCode: item.inviteCode
        },
        leaderName: `${item.leaderFirstName || 'Unassigned'} ${item.leaderLastName || ''}`.trim(),
        surveyTitle: item.surveyTitle || 'SyncShift Assessment',
        completionPercentage: Math.min(Math.round(((item.totalResponses || 0) / 5) * 100), 100)
      }));
    } catch (error) {
      console.error("Error building active cycle progress data:", error);
      return [];
    }
  }

  async getAllOrganizationsWithUsage(): Promise<Array<{
    organization: Organization;
    activeSurveys: number;
    totalParticipants: number;
    completedResponses: number;
    pendingResponses: number;
    admins: Array<{ id: number; firstName: string; lastName: string; email: string }>;
    creditBalances: Array<{ surveyType: string; credits: number }>;
  }>> {
    const orgs = await db.select().from(organizations);
    const allUsers = await db.select().from(users);
    const allCycles = await db.select().from(surveyCycles);
    const allResponses = await db.select().from(surveyResponses);
    const userByOrg = new Map<number, User[]>();
    for (const u of allUsers) {
      if (u.organizationId == null) continue;
      const arr = userByOrg.get(u.organizationId) ?? [];
      arr.push(u);
      userByOrg.set(u.organizationId, arr);
    }
    const cycleByOrg = new Map<number, SurveyCycle[]>();
    for (const c of allCycles) {
      if (c.organizationId == null) continue;
      const arr = cycleByOrg.get(c.organizationId) ?? [];
      arr.push(c);
      cycleByOrg.set(c.organizationId, arr);
    }
    const cycleIdToOrg = new Map<number, number>();
    for (const c of allCycles) if (c.organizationId != null) cycleIdToOrg.set(c.id, c.organizationId);

    // Index per-org credit balances once
    const allCreditRows = await db.select().from(surveyCreditBalances);
    const creditRowsByOrg = new Map<number, typeof allCreditRows>();
    for (const r of allCreditRows) {
      const arr = creditRowsByOrg.get(r.organizationId) ?? [];
      arr.push(r);
      creditRowsByOrg.set(r.organizationId, arr);
    }

    return Promise.resolve(orgs.map((org) => {
      const members = userByOrg.get(org.id) ?? [];
      const cycles = cycleByOrg.get(org.id) ?? [];
      const active = cycles.filter(c => c.status === 'active').length;
      const responsesForOrg = allResponses.filter(r => cycleIdToOrg.get(r.cycleId) === org.id);
      const admins = members
        .filter(m => m.role === 'org_admin' || m.role === 'admin' || m.role === 'company_admin')
        .map(m => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, email: m.email }));
      const creditBalances: Array<{ surveyType: string; credits: number }> = [];
      // Seed a zero balance row for every known survey type + any existing balance rows
      const allCreditRows = new Map<string, number>();
      for (const row of creditRowsByOrg.get(org.id) ?? []) allCreditRows.set(row.surveyType, row.credits);
      for (const [st, c] of allCreditRows) creditBalances.push({ surveyType: st, credits: c });
      return {
        organization: org,
        activeSurveys: active,
        totalParticipants: members.length,
        completedResponses: responsesForOrg.length,
        pendingResponses: Math.max(0, cycles.length * 5 - responsesForOrg.length),
        admins,
        creditBalances,
      };
    }));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u || undefined;
  }

  async updateUserProfile(userId: number, data: { firstName?: string; lastName?: string; email?: string }): Promise<User> {
    const patch: any = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.email !== undefined) {
      patch.email = data.email;
      patch.username = data.email.split('@')[0] + '.' + String(userId);
    }
    const [u] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
    return u;
  }

  async resetUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async getSurveyCreditBalances(orgId: number): Promise<Array<{ surveyType: string; credits: number }>> {
    return await db.select({ surveyType: surveyCreditBalances.surveyType, credits: surveyCreditBalances.credits })
      .from(surveyCreditBalances)
      .where(eq(surveyCreditBalances.organizationId, orgId));
  }

  async getSurveyCredit(orgId: number, surveyType: string): Promise<number> {
    const [row] = await db.select().from(surveyCreditBalances).where(
      and(eq(surveyCreditBalances.organizationId, orgId), eq(surveyCreditBalances.surveyType, surveyType))
    ).limit(1);
    return row?.credits ?? 0;
  }

  async addSurveyCredits(orgId: number, surveyType: string, amount: number): Promise<number> {
    const existing = await this.getSurveyCredit(orgId, surveyType);
    const newTotal = Math.max(0, existing + amount);
    const [row] = await db.insert(surveyCreditBalances).values({ organizationId: orgId, surveyType, credits: newTotal })
      .onConflictDoUpdate({ target: [surveyCreditBalances.organizationId, surveyCreditBalances.surveyType], set: { credits: newTotal, updatedAt: new Date() } })
      .returning();
    return row.credits;
  }

  async deductSurveyCredits(orgId: number, surveyType: string, amount: number): Promise<number> {
    return await this.addSurveyCredits(orgId, surveyType, -amount);
  }

  async getOrganizationAdmins(orgId: number): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.organizationId, orgId), eq(users.role, 'org_admin')));
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async assignUserRoleOrg(userId: number, role: string, organizationId: number): Promise<void> {
    await db.update(users).set({ role, organizationId }).where(eq(users.id, userId));
  }

  async createAdminForOrg(orgId: number, data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      username: data.email.split('@')[0],
      password: data.password,
      role: 'org_admin',
      organizationId: orgId,
      firstName: data.firstName || 'Admin',
      lastName: data.lastName || 'User',
      isActive: true,
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
