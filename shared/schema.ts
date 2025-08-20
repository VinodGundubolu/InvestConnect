import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("investor"), // "investor" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment Plans
export const investmentPlans = pgTable("investment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  launchDate: date("launch_date").notNull(),
  expiryDate: date("expiry_date"),
  bondValue: decimal("bond_value", { precision: 15, scale: 2 }).notNull(),
  bondsAvailable: integer("bonds_available").notNull(),
  minBondsPerInvestor: integer("min_bonds_per_investor").notNull().default(1),
  maxBondsPerInvestor: integer("max_bonds_per_investor").notNull(),
  lockInPeriodYears: integer("lock_in_period_years").notNull(),
  bonusEligibilityYears: integer("bonus_eligibility_years").notNull(),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 5, scale: 2 }).notNull().default("2.00"),
  maturityEligibilityYears: integer("maturity_eligibility_years").notNull().default(10),
  maturityMultiplier: decimal("maturity_multiplier", { precision: 5, scale: 2 }).notNull().default("3.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investors
export const investors = pgTable("investors", {
  id: varchar("id").primaryKey(), // Auto-generated ID following the formula
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  middleName: varchar("middle_name"),
  lastName: varchar("last_name").notNull(),
  primaryMobile: varchar("primary_mobile").notNull(),
  secondaryMobile: varchar("secondary_mobile"),
  email: varchar("email").notNull(),
  primaryAddress: text("primary_address").notNull(),
  primaryAddressPin: varchar("primary_address_pin").notNull(),
  secondaryAddress: text("secondary_address"),
  secondaryAddressPin: varchar("secondary_address_pin"),
  identityProofType: varchar("identity_proof_type").notNull(),
  identityProofNumber: varchar("identity_proof_number").notNull(),
  proofType: varchar("proof_type"), // For new form compatibility
  proofNumber: varchar("proof_number"), // For new form compatibility
  address: varchar("address"), // For new form compatibility  
  city: varchar("city"), // For new form compatibility
  state: varchar("state"), // For new form compatibility
  zipcode: varchar("zipcode"), // For new form compatibility
  kycStatus: varchar("kyc_status").default("pending"),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investments
export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investorId: varchar("investor_id").references(() => investors.id).notNull(),
  planId: varchar("plan_id").references(() => investmentPlans.id).notNull(),
  investmentDate: date("investment_date").notNull(),
  investedAmount: decimal("invested_amount", { precision: 15, scale: 2 }).notNull(),
  bondsPurchased: integer("bonds_purchased").notNull(),
  lockInExpiry: date("lock_in_expiry").notNull(),
  maturityDate: date("maturity_date").notNull(),
  bonusEarned: decimal("bonus_earned", { precision: 15, scale: 2 }).notNull().default("0.00"),
  bonusEarnedDate: date("bonus_earned_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Types
export const transactionTypeEnum = pgEnum("transaction_type", [
  "investment",
  "dividend_disbursement",
  "bonus_disbursement",
  "maturity_disbursement",
]);

export const transactionModeEnum = pgEnum("transaction_mode", [
  "bank_transfer",
  "cheque",
  "cash",
  "upi",
  "card",
]);

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: varchar("investment_id").references(() => investments.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionDate: date("transaction_date").notNull(),
  disbursementDate: timestamp("disbursement_date"), // Actual disbursement date for interest payments
  yearCovered: integer("year_covered"), // Which year this interest payment covers (1-10)
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }), // Interest rate used for calculation
  mode: transactionModeEnum("mode").notNull(),
  transactionId: varchar("transaction_id").notNull(),
  proofDocument: varchar("proof_document"), // File path or URL
  status: varchar("status").notNull().default("completed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dividend Rates by Year
export const dividendRates = pgTable("dividend_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  investor: one(investors, {
    fields: [users.id],
    references: [investors.userId],
  }),
}));

export const investorsRelations = relations(investors, ({ one, many }) => ({
  user: one(users, {
    fields: [investors.userId],
    references: [users.id],
  }),
  investments: many(investments),
}));

export const investmentPlansRelations = relations(investmentPlans, ({ many }) => ({
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  investor: one(investors, {
    fields: [investments.investorId],
    references: [investors.id],
  }),
  plan: one(investmentPlans, {
    fields: [investments.planId],
    references: [investmentPlans.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  investment: one(investments, {
    fields: [transactions.investmentId],
    references: [investments.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertInvestorSchema = createInsertSchema(investors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Import agreement schemas
export * from './agreement-schema';
export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Extended types for API responses
export type InvestorWithInvestments = Investor & {
  investments: (Investment & {
    plan: InvestmentPlan;
    transactions: Transaction[];
  })[];
};

export type InvestmentWithDetails = Investment & {
  investor: Investor;
  plan: InvestmentPlan;
  transactions: Transaction[];
};
