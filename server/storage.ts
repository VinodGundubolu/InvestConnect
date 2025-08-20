import {
  users,
  investors,
  investments,
  investmentPlans,
  transactions,
  dividendRates,
  type User,
  type UpsertUser,
  type Investor,
  type InsertInvestor,
  type Investment,
  type InsertInvestment,
  type InvestmentPlan,
  type InsertInvestmentPlan,
  type Transaction,
  type InsertTransaction,
  type InvestorWithInvestments,
  type InvestmentWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: any): Promise<User>;
  
  // Test credentials for demo
  storeTestCredentials(userId: string, username: string, password: string): Promise<void>;

  // Investor operations
  getInvestor(id: string): Promise<Investor | undefined>;
  getInvestorByUserId(userId: string): Promise<Investor | undefined>;
  getInvestorWithInvestments(id: string): Promise<InvestorWithInvestments | undefined>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: string, investor: Partial<InsertInvestor>): Promise<Investor>;
  deleteInvestor(id: string): Promise<boolean>;
  getAllInvestors(): Promise<Investor[]>;
  generateInvestorId(investorData: InsertInvestor): Promise<string>;

  // Investment operations
  getInvestment(id: string): Promise<Investment | undefined>;
  getInvestmentWithDetails(id: string): Promise<InvestmentWithDetails | undefined>;
  getInvestmentsByInvestor(investorId: string): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, investment: Partial<InsertInvestment>): Promise<Investment>;
  getAllInvestments(): Promise<Investment[]>;

  // Investment Plan operations
  getInvestmentPlan(id: string): Promise<InvestmentPlan | undefined>;
  getAllInvestmentPlans(): Promise<InvestmentPlan[]>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  updateInvestmentPlan(id: string, plan: Partial<InsertInvestmentPlan>): Promise<InvestmentPlan>;

  // Transaction operations
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByInvestment(investmentId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;

  // Analytics operations
  getPortfolioOverview(): Promise<{
    totalInvestors: number;
    totalPrincipal: string;
    totalInterestPaid: string;
    maturityDue: string;
  }>;

  // Dividend rates
  getDividendRates(): Promise<{ year: number; rate: string }[]>;
  initializeDividendRates(): Promise<void>;

  // Agreement operations
  getAgreementTemplate(id: string): Promise<any | undefined>;
  createAgreementTemplate(template: any): Promise<any>;
  getInvestorAgreement(id: string): Promise<any | undefined>;
  createInvestorAgreement(agreement: any): Promise<any>;
  updateInvestorAgreement(id: string, updates: any): Promise<any>;
  getInvestorAgreements(investorId: string): Promise<any[]>;
  getAllInvestorAgreements(): Promise<any[]>;
  createAgreementAction(action: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async storeTestCredentials(userId: string, username: string, password: string): Promise<void> {
    // In a real app, you'd store this in a credentials table with hashed passwords
    // For demo purposes, we'll just log it
    console.log(`Test credentials created - UserId: ${userId}, Username: ${username}, Password: ${password}`);
  }

  // Investor operations
  async getInvestor(id: string): Promise<Investor | undefined> {
    const [investor] = await db.select().from(investors).where(eq(investors.id, id));
    return investor;
  }

  async getInvestorByUserId(userId: string): Promise<Investor | undefined> {
    const [investor] = await db.select().from(investors).where(eq(investors.userId, userId));
    return investor;
  }

  async getInvestorWithInvestments(id: string): Promise<InvestorWithInvestments | undefined> {
    const investor = await this.getInvestor(id);
    if (!investor) return undefined;

    const investorInvestments = await db
      .select()
      .from(investments)
      .leftJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
      .where(eq(investments.investorId, id));

    const investmentsWithTransactions = await Promise.all(
      investorInvestments.map(async (inv) => {
        const invTransactions = await this.getTransactionsByInvestment(inv.investments.id);
        return {
          ...inv.investments,
          plan: inv.investment_plans!,
          transactions: invTransactions,
        };
      })
    );

    return {
      ...investor,
      investments: investmentsWithTransactions,
    };
  }

  async createInvestor(investorData: InsertInvestor): Promise<Investor> {
    const id = await this.generateInvestorId(investorData);
    const [investor] = await db
      .insert(investors)
      .values({ ...investorData, id })
      .returning();
    return investor;
  }

  async updateInvestor(id: string, investorData: Partial<InsertInvestor>): Promise<Investor> {
    const [investor] = await db
      .update(investors)
      .set({ ...investorData, updatedAt: new Date() })
      .where(eq(investors.id, id))
      .returning();
    
    if (!investor) {
      throw new Error(`Investor with id ${id} not found`);
    }
    
    return investor;
  }

  async deleteInvestor(id: string): Promise<boolean> {
    try {
      // First delete all related investments
      await db.delete(investments).where(eq(investments.investorId, id));
      
      // Then delete the investor
      const result = await db.delete(investors).where(eq(investors.id, id));
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting investor:", error);
      return false;
    }
  }

  async getAllInvestors(): Promise<Investor[]> {
    return await db.select().from(investors).orderBy(desc(investors.createdAt));
  }

  async generateInvestorId(investorData: InsertInvestor): Promise<string> {
    // Get total count of investors + 1 to get the next sequential number
    const totalInvestors = await db
      .select({ count: sql<number>`count(*)` })
      .from(investors);
    
    const nextId = (totalInvestors[0]?.count || 0) + 1;
    
    return nextId.toString();
  }

  // Investment operations
  async getInvestment(id: string): Promise<Investment | undefined> {
    const [investment] = await db.select().from(investments).where(eq(investments.id, id));
    return investment;
  }

  async getInvestmentWithDetails(id: string): Promise<InvestmentWithDetails | undefined> {
    const [investment] = await db
      .select()
      .from(investments)
      .leftJoin(investors, eq(investments.investorId, investors.id))
      .leftJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
      .where(eq(investments.id, id));

    if (!investment) return undefined;

    const investmentTransactions = await this.getTransactionsByInvestment(id);

    return {
      ...investment.investments,
      investor: investment.investors!,
      plan: investment.investment_plans!,
      transactions: investmentTransactions,
    };
  }

  async getInvestmentsByInvestor(investorId: string): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.investorId, investorId))
      .orderBy(desc(investments.createdAt));
  }

  // Alias for compatibility with interest calculation API
  async getInvestorInvestments(investorId: string): Promise<Investment[]> {
    return this.getInvestmentsByInvestor(investorId);
  }

  // Get transactions for an investor with optional filtering by type
  async getInvestorTransactions(investorId: string, transactionType?: string): Promise<Transaction[]> {
    try {
      let whereConditions = [eq(investments.investorId, investorId)];
      
      if (transactionType) {
        whereConditions.push(eq(transactions.type, transactionType as any));
      }

      const result = await db
        .select()
        .from(transactions)
        .innerJoin(investments, eq(transactions.investmentId, investments.id))
        .where(and(...whereConditions))
        .orderBy(desc(transactions.transactionDate));

      return result.map(row => row.transactions);
    } catch (error) {
      console.error("Error fetching investor transactions:", error);
      return [];
    }
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const [investment] = await db
      .insert(investments)
      .values(investmentData)
      .returning();
    return investment;
  }

  async updateInvestment(id: string, investmentData: Partial<InsertInvestment>): Promise<Investment> {
    const [investment] = await db
      .update(investments)
      .set({ ...investmentData, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return investment;
  }

  async getAllInvestments(): Promise<Investment[]> {
    return await db.select().from(investments).orderBy(desc(investments.createdAt));
  }

  // Investment Plan operations
  async getInvestmentPlan(id: string): Promise<InvestmentPlan | undefined> {
    const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
    return plan;
  }

  async getAllInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await db
      .select()
      .from(investmentPlans)
      .where(eq(investmentPlans.isActive, true))
      .orderBy(desc(investmentPlans.createdAt));
  }

  async createInvestmentPlan(planData: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [plan] = await db
      .insert(investmentPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async updateInvestmentPlan(id: string, planData: Partial<InsertInvestmentPlan>): Promise<InvestmentPlan> {
    const [plan] = await db
      .update(investmentPlans)
      .set({ ...planData, updatedAt: new Date() })
      .where(eq(investmentPlans.id, id))
      .returning();
    return plan;
  }

  // Transaction operations
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getTransactionsByInvestment(investmentId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.investmentId, investmentId))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransaction(id: string, transactionData: Partial<InsertTransaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...transactionData, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // Analytics operations
  async getPortfolioOverview(): Promise<{
    totalInvestors: number;
    totalPrincipal: string;
    totalInterestPaid: string;
    maturityDue: string;
  }> {
    const [investorCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(investors);

    const [principalSum] = await db
      .select({ sum: sql<string>`coalesce(sum(invested_amount), 0)` })
      .from(investments);

    const [interestPaid] = await db
      .select({ sum: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactions)
      .where(eq(transactions.type, "dividend_disbursement"));

    const [maturityDue] = await db
      .select({ sum: sql<string>`coalesce(sum(invested_amount), 0)` })
      .from(investments)
      .where(
        and(
          sql`maturity_date >= current_date`,
          sql`maturity_date <= current_date + interval '12 months'`
        )
      );

    return {
      totalInvestors: investorCount.count || 0,
      totalPrincipal: principalSum.sum || "0",
      totalInterestPaid: interestPaid.sum || "0",
      maturityDue: maturityDue.sum || "0",
    };
  }

  // Dividend rates
  async getDividendRates(): Promise<{ year: number; rate: string }[]> {
    return await db
      .select({
        year: dividendRates.year,
        rate: dividendRates.rate,
      })
      .from(dividendRates)
      .orderBy(dividendRates.year);
  }

  async initializeDividendRates(): Promise<void> {
    const rates = [
      { year: 1, rate: "0.00" },
      { year: 2, rate: "6.00" },
      { year: 3, rate: "9.00" },
      { year: 4, rate: "12.00" },
      { year: 5, rate: "18.00" },
      { year: 6, rate: "18.00" },
      { year: 7, rate: "18.00" },
      { year: 8, rate: "18.00" },
      { year: 9, rate: "18.00" },
      { year: 10, rate: "0.00" },
    ];

    for (const rate of rates) {
      await db
        .insert(dividendRates)
        .values(rate)
        .onConflictDoNothing();
    }
  }

  // Agreement operations
  async getAgreementTemplate(id: string): Promise<any | undefined> {
    const { agreementTemplates } = await import('@shared/agreement-schema');
    const [template] = await db.select().from(agreementTemplates).where(eq(agreementTemplates.id, id));
    return template;
  }

  async createAgreementTemplate(template: any): Promise<any> {
    const { agreementTemplates } = await import('@shared/agreement-schema');
    const [created] = await db.insert(agreementTemplates).values(template).returning();
    return created;
  }

  async getInvestorAgreement(id: string): Promise<any | undefined> {
    const { investorAgreements } = await import('@shared/agreement-schema');
    const [agreement] = await db.select().from(investorAgreements).where(eq(investorAgreements.id, id));
    return agreement;
  }

  async createInvestorAgreement(agreement: any): Promise<any> {
    const { investorAgreements } = await import('@shared/agreement-schema');
    const [created] = await db.insert(investorAgreements).values(agreement).returning();
    return created;
  }

  async updateInvestorAgreement(id: string, updates: any): Promise<any> {
    const { investorAgreements } = await import('@shared/agreement-schema');
    const [updated] = await db
      .update(investorAgreements)
      .set(updates)
      .where(eq(investorAgreements.id, id))
      .returning();
    return updated;
  }

  async getInvestorAgreements(investorId: string): Promise<any[]> {
    const { investorAgreements } = await import('@shared/agreement-schema');
    return await db
      .select()
      .from(investorAgreements)
      .where(eq(investorAgreements.investorId, investorId))
      .orderBy(desc(investorAgreements.createdAt));
  }

  async getAllInvestorAgreements(): Promise<any[]> {
    const { investorAgreements } = await import('@shared/agreement-schema');
    return await db
      .select()
      .from(investorAgreements)
      .orderBy(desc(investorAgreements.createdAt));
  }

  async createAgreementAction(action: any): Promise<any> {
    const { agreementActions } = await import('@shared/agreement-schema');
    const [created] = await db.insert(agreementActions).values(action).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
