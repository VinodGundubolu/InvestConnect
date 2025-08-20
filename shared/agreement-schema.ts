import { pgTable, varchar, text, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Investment Agreement Templates
export const agreementTemplates = pgTable("agreement_templates", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  version: varchar("version").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(), // HTML content with placeholders
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investor Agreements
export const investorAgreements = pgTable("investor_agreements", {
  id: varchar("id").primaryKey(),
  investorId: varchar("investor_id").notNull(),
  templateId: varchar("template_id").notNull(),
  agreementContent: text("agreement_content").notNull(), // Personalized HTML content
  status: varchar("status").notNull().default("pending"), // pending, signed, rejected, expired
  sentAt: timestamp("sent_at"),
  signedAt: timestamp("signed_at"),
  rejectedAt: timestamp("rejected_at"),
  signature: varchar("signature"), // Digital signature data
  signatoryName: varchar("signatory_name"),
  signatoryEmail: varchar("signatory_email"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  documentHash: varchar("document_hash"), // For integrity verification
  expiresAt: timestamp("expires_at"), // Agreement expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agreement Actions Log
export const agreementActions = pgTable("agreement_actions", {
  id: varchar("id").primaryKey(),
  agreementId: varchar("agreement_id").notNull(),
  action: varchar("action").notNull(), // sent, viewed, signed, rejected, reminded
  performedBy: varchar("performed_by"), // investor_id or admin_id
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type AgreementTemplate = typeof agreementTemplates.$inferSelect;
export type InsertAgreementTemplate = typeof agreementTemplates.$inferInsert;
export type InvestorAgreement = typeof investorAgreements.$inferSelect;
export type InsertInvestorAgreement = typeof investorAgreements.$inferInsert;
export type AgreementAction = typeof agreementActions.$inferSelect;
export type InsertAgreementAction = typeof agreementActions.$inferInsert;

// Validation schemas
export const insertAgreementTemplateSchema = createInsertSchema(agreementTemplates);
export const insertInvestorAgreementSchema = createInsertSchema(investorAgreements);
export const insertAgreementActionSchema = createInsertSchema(agreementActions);

// API schemas
export const signAgreementSchema = z.object({
  agreementId: z.string(),
  signature: z.string(),
  signatoryName: z.string(),
  signatoryEmail: z.string().email(),
});

export const createAgreementSchema = z.object({
  investorId: z.string(),
  templateId: z.string(),
  expiresInDays: z.number().optional().default(30),
});