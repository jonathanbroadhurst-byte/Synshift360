import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'admin', 'leader', 'participant'
  organizationId: integer("organization_id").references(() => organizations.id),
  position: text("position"),
  department: text("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Survey templates/configurations
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  surveyType: text("survey_type").notNull().default("syncshift"), // 'syncshift' | 'quantum'
  scaleMin: integer("scale_min").default(1),
  scaleMax: integer("scale_max").default(7),
  questions: jsonb("questions").notNull(), // Array of question objects
  maturityCategories: jsonb("maturity_categories"), // For Quantum: scoring ranges to maturity levels
  organizationId: integer("organization_id").references(() => organizations.id),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey cycles/instances for specific leaders
export const surveyCycles = pgTable("survey_cycles", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id),
  leaderId: integer("leader_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  status: text("status").default("active"), // 'active', 'completed', 'cancelled'
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  inviteCode: text("invite_code"),
  totalInvites: integer("total_invites").default(0),
  totalResponses: integer("total_responses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey invitations
export const surveyInvitations = pgTable("survey_invitations", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => surveyCycles.id),
  email: text("email").notNull(),
  participantName: text("participant_name"),
  jobTitle: text("job_title"),
  department: text("department"),
  relationship: text("relationship"), // 'Self', 'Manager', 'Peer', 'Direct Report'
  inviteToken: text("invite_token"),
  status: text("status").default("pending"), // 'pending', 'completed', 'expired'
  sentAt: timestamp("sent_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  remindersSent: integer("reminders_sent").default(0),
});

// Anonymous survey responses
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => surveyCycles.id),
  invitationId: integer("invitation_id").references(() => surveyInvitations.id),
  responses: jsonb("responses").notNull(), // Array of response objects
  responseHash: text("response_hash").notNull(), // For anonymization
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Generated reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => surveyCycles.id),
  leaderId: integer("leader_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  executiveSummary: text("executive_summary"),
  strengths: jsonb("strengths"), // Array of strength objects
  developmentAreas: jsonb("development_areas"), // Array of development area objects
  statistics: jsonb("statistics"), // Report statistics
  status: text("status").default("pending"), // 'pending', 'approved', 'released', 'archived'
  generatedAt: timestamp("generated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  releasedAt: timestamp("released_at"),
  releasedBy: integer("released_by").references(() => users.id),
});

// Audit trail for GDPR compliance
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data retention requests for GDPR
export const dataRetentionRequests = pgTable("data_retention_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  requestType: text("request_type").notNull(), // 'export', 'delete', 'rectify'
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'rejected'
  requestedBy: integer("requested_by").references(() => users.id),
  processedBy: integer("processed_by").references(() => users.id),
  requestDetails: jsonb("request_details"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  surveys: many(surveys),
  surveyCycles: many(surveyCycles),
  reports: many(reports),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  createdSurveys: many(surveys),
  surveyCycles: many(surveyCycles),
  reports: many(reports),
  auditLogs: many(auditLog),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [surveys.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [surveys.createdBy],
    references: [users.id],
  }),
  cycles: many(surveyCycles),
}));

export const surveyCyclesRelations = relations(surveyCycles, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [surveyCycles.surveyId],
    references: [surveys.id],
  }),
  leader: one(users, {
    fields: [surveyCycles.leaderId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [surveyCycles.organizationId],
    references: [organizations.id],
  }),
  invitations: many(surveyInvitations),
  responses: many(surveyResponses),
  reports: many(reports),
}));

export const surveyInvitationsRelations = relations(surveyInvitations, ({ one, many }) => ({
  cycle: one(surveyCycles, {
    fields: [surveyInvitations.cycleId],
    references: [surveyCycles.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  cycle: one(surveyCycles, {
    fields: [surveyResponses.cycleId],
    references: [surveyCycles.id],
  }),
  invitation: one(surveyInvitations, {
    fields: [surveyResponses.invitationId],
    references: [surveyInvitations.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  cycle: one(surveyCycles, {
    fields: [reports.cycleId],
    references: [surveyCycles.id],
  }),
  leader: one(users, {
    fields: [reports.leaderId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [reports.organizationId],
    references: [organizations.id],
  }),
  approvedBy: one(users, {
    fields: [reports.approvedBy],
    references: [users.id],
  }),
  releasedBy: one(users, {
    fields: [reports.releasedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
});

export const insertSurveyCycleSchema = createInsertSchema(surveyCycles).omit({
  id: true,
  createdAt: true,
  inviteCode: true,
});

export const insertSurveyInvitationSchema = createInsertSchema(surveyInvitations).omit({
  id: true,
  sentAt: true,
  inviteToken: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
  approvedAt: true,
  releasedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyCycle = typeof surveyCycles.$inferSelect;
export type InsertSurveyCycle = z.infer<typeof insertSurveyCycleSchema>;

export type SurveyInvitation = typeof surveyInvitations.$inferSelect;
export type InsertSurveyInvitation = z.infer<typeof insertSurveyInvitationSchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
