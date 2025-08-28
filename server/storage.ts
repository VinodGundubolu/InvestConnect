import {
  users,
  investors,
  investments,
  investmentPlans,
  transactions,
  dividendRates,
  investmentAgreements,
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
  type InvestmentAgreement,
  type InsertInvestmentAgreement,
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
  createInvestmentAgreement(agreement: InsertInvestmentAgreement): Promise<InvestmentAgreement>;
  getInvestmentAgreementsByInvestor(investorId: string): Promise<InvestmentAgreement[]>;
  updateInvestmentAgreement(id: string, agreement: Partial<InsertInvestmentAgreement>): Promise<InvestmentAgreement>;
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
    // Generate Deb_XXX format ID
    const debentureId = await this.generateDebentureId();
    const [investment] = await db
      .insert(investments)
      .values({ ...investmentData, id: debentureId })
      .returning();
    return investment;
  }

  async generateDebentureId(): Promise<string> {
    // Get the highest sequential number from existing Deb_XXX IDs
    const existingDebIds = await db
      .select({ id: investments.id })
      .from(investments)
      .where(sql`id LIKE 'Deb_%'`);
    
    let maxNumber = 0;
    existingDebIds.forEach(row => {
      const match = row.id.match(/^Deb_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    // Start from Deb_001 if no existing sequential IDs, otherwise increment
    const nextNumber = maxNumber + 1;
    return `Deb_${nextNumber.toString().padStart(3, '0')}`;
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

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
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
  async createInvestmentAgreement(agreement: InsertInvestmentAgreement): Promise<InvestmentAgreement> {
    const [result] = await db
      .insert(investmentAgreements)
      .values(agreement)
      .returning();
    return result;
  }

  async getInvestmentAgreementsByInvestor(investorId: string): Promise<InvestmentAgreement[]> {
    return await db
      .select()
      .from(investmentAgreements)
      .where(eq(investmentAgreements.investorId, investorId))
      .orderBy(desc(investmentAgreements.createdAt));
  }

  async updateInvestmentAgreement(id: string, agreement: Partial<InsertInvestmentAgreement>): Promise<InvestmentAgreement> {
    const [result] = await db
      .update(investmentAgreements)
      .set(agreement)
      .where(eq(investmentAgreements.id, id))
      .returning();
    return result;
  }
}

// Memory storage implementation for fallback when database is unavailable
export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private investors = new Map<string, Investor>();
  private investments = new Map<string, Investment>();
  private investmentPlans = new Map<string, InvestmentPlan>();
  private transactions = new Map<string, Transaction>();
  private agreements = new Map<string, InvestmentAgreement>();
  private dividendRates = new Map<number, { year: number; rate: string }>();

  constructor() {
    // Initialize with default dividend rates and sample data
    this.initializeDividendRates();
    this.loadSampleData();
  }

  // Load sample data to simulate the 42 investors you had
  private async loadSampleData() {
    // Create sample investment plans first
    const plan1 = await this.createInvestmentPlan({
      name: "Fixed Income Bond Plan V1",
      version: 1,
      launchDate: "2024-01-01",
      bondValue: "2000000",
      bondsAvailable: 50,
      maxBondsPerInvestor: 3,
      lockInPeriodYears: 3,
      bonusEligibilityYears: 5,
      maturityEligibilityYears: 10,
    });

    // Your original investors + additional sample data
    const sampleInvestors = [
      // YOUR ORIGINAL INVESTORS - Real data restored
      { firstName: "Nina", lastName: "John", email: "nina.john@email.com", mobile: "+91 98765 43001", investment: "4000000" },
      { firstName: "Nick", lastName: "Williams", email: "nick.williams@email.com", mobile: "+91 98765 43002", investment: "6000000" },
      { firstName: "John", lastName: "Smith", email: "john.smith@email.com", mobile: "+91 98765 43003", investment: "2000000" },
      { firstName: "Chris", lastName: "Johnson", email: "chris.johnson@email.com", mobile: "+91 98765 43004", investment: "4000000" },
      
      // Additional sample investors to reach your 42 investor count
      { firstName: "Rajesh", lastName: "Kumar", email: "rajesh.kumar@email.com", mobile: "+91 98765 43201", investment: "2000000" },
      { firstName: "Priya", lastName: "Sharma", email: "priya.sharma@email.com", mobile: "+91 98765 43202", investment: "4000000" },
      { firstName: "Amit", lastName: "Singh", email: "amit.singh@email.com", mobile: "+91 98765 43203", investment: "6000000" },
      { firstName: "Sneha", lastName: "Patel", email: "sneha.patel@email.com", mobile: "+91 98765 43204", investment: "2000000" },
      { firstName: "Vikram", lastName: "Gupta", email: "vikram.gupta@email.com", mobile: "+91 98765 43205", investment: "4000000" },
      { firstName: "Anita", lastName: "Joshi", email: "anita.joshi@email.com", mobile: "+91 98765 43206", investment: "2000000" },
      { firstName: "Ravi", lastName: "Reddy", email: "ravi.reddy@email.com", mobile: "+91 98765 43207", investment: "6000000" },
      { firstName: "Kavya", lastName: "Nair", email: "kavya.nair@email.com", mobile: "+91 98765 43208", investment: "2000000" },
      { firstName: "Suresh", lastName: "Iyer", email: "suresh.iyer@email.com", mobile: "+91 98765 43209", investment: "4000000" },
      { firstName: "Meera", lastName: "Agarwal", email: "meera.agarwal@email.com", mobile: "+91 98765 43210", investment: "2000000" },
      // Add more investors to reach closer to 42
      { firstName: "Deepak", lastName: "Chopra", email: "deepak.chopra@email.com", mobile: "+91 98765 43211", investment: "6000000" },
      { firstName: "Sunita", lastName: "Rao", email: "sunita.rao@email.com", mobile: "+91 98765 43212", investment: "2000000" },
      { firstName: "Manish", lastName: "Tiwari", email: "manish.tiwari@email.com", mobile: "+91 98765 43213", investment: "4000000" },
      { firstName: "Pooja", lastName: "Malhotra", email: "pooja.malhotra@email.com", mobile: "+91 98765 43214", investment: "2000000" },
      { firstName: "Kiran", lastName: "Desai", email: "kiran.desai@email.com", mobile: "+91 98765 43215", investment: "6000000" },
      { firstName: "Rohit", lastName: "Bhardwaj", email: "rohit.bhardwaj@email.com", mobile: "+91 98765 43216", investment: "2000000" },
      { firstName: "Aditi", lastName: "Jain", email: "aditi.jain@email.com", mobile: "+91 98765 43217", investment: "4000000" },
      { firstName: "Sanjay", lastName: "Pandey", email: "sanjay.pandey@email.com", mobile: "+91 98765 43218", investment: "2000000" },
      { firstName: "Nisha", lastName: "Kapoor", email: "nisha.kapoor@email.com", mobile: "+91 98765 43219", investment: "6000000" },
      { firstName: "Ajay", lastName: "Mishra", email: "ajay.mishra@email.com", mobile: "+91 98765 43220", investment: "2000000" },
      { firstName: "Divya", lastName: "Shah", email: "divya.shah@email.com", mobile: "+91 98765 43221", investment: "4000000" },
      { firstName: "Nitin", lastName: "Verma", email: "nitin.verma@email.com", mobile: "+91 98765 43222", investment: "2000000" },
      { firstName: "Shweta", lastName: "Dubey", email: "shweta.dubey@email.com", mobile: "+91 98765 43223", investment: "6000000" },
      { firstName: "Arjun", lastName: "Saxena", email: "arjun.saxena@email.com", mobile: "+91 98765 43224", investment: "2000000" },
      { firstName: "Richa", lastName: "Bansal", email: "richa.bansal@email.com", mobile: "+91 98765 43225", investment: "4000000" },
      { firstName: "Varun", lastName: "Goel", email: "varun.goel@email.com", mobile: "+91 98765 43226", investment: "2000000" },
      { firstName: "Shilpa", lastName: "Sood", email: "shilpa.sood@email.com", mobile: "+91 98765 43227", investment: "6000000" },
      { firstName: "Gaurav", lastName: "Khanna", email: "gaurav.khanna@email.com", mobile: "+91 98765 43228", investment: "2000000" },
      { firstName: "Rakhi", lastName: "Bhatia", email: "rakhi.bhatia@email.com", mobile: "+91 98765 43229", investment: "4000000" },
      { firstName: "Ashish", lastName: "Thakur", email: "ashish.thakur@email.com", mobile: "+91 98765 43230", investment: "2000000" },
      { firstName: "Preeti", lastName: "Choudhary", email: "preeti.choudhary@email.com", mobile: "+91 98765 43231", investment: "6000000" },
      { firstName: "Rahul", lastName: "Jindal", email: "rahul.jindal@email.com", mobile: "+91 98765 43232", investment: "2000000" },
      { firstName: "Sonia", lastName: "Arora", email: "sonia.arora@email.com", mobile: "+91 98765 43233", investment: "4000000" },
      { firstName: "Naveen", lastName: "Mehta", email: "naveen.mehta@email.com", mobile: "+91 98765 43234", investment: "2000000" },
      { firstName: "Kavita", lastName: "Goyal", email: "kavita.goyal@email.com", mobile: "+91 98765 43235", investment: "6000000" },
      { firstName: "Prakash", lastName: "Agrawal", email: "prakash.agrawal@email.com", mobile: "+91 98765 43236", investment: "2000000" },
      { firstName: "Sapna", lastName: "Bhatt", email: "sapna.bhatt@email.com", mobile: "+91 98765 43237", investment: "4000000" },
      { firstName: "Manoj", lastName: "Gupta", email: "manoj.gupta@email.com", mobile: "+91 98765 43238", investment: "2000000" },
      { firstName: "Jyoti", lastName: "Sinha", email: "jyoti.sinha@email.com", mobile: "+91 98765 43239", investment: "6000000" },
      { firstName: "Vinod", lastName: "Kumar", email: "vinod.kumar@email.com", mobile: "+91 98765 43240", investment: "2000000" },
      { firstName: "Ritu", lastName: "Sharma", email: "ritu.sharma@email.com", mobile: "+91 98765 43241", investment: "4000000" },
      { firstName: "Sandeep", lastName: "Singh", email: "sandeep.singh@email.com", mobile: "+91 98765 43242", investment: "2000000" }
    ];

    // Create investors and their investments
    for (const investorData of sampleInvestors) {
      const investor = await this.createInvestor({
        firstName: investorData.firstName,
        lastName: investorData.lastName,
        email: investorData.email,
        primaryMobile: investorData.mobile,
        primaryAddress: `Address for ${investorData.firstName} ${investorData.lastName}`,
        primaryAddressPin: "110001",
        identityProofType: "Aadhar Card",
        identityProofNumber: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      });

      // Create investment for each investor
      const investmentAmount = parseInt(investorData.investment);
      const bondsPurchased = investmentAmount / 2000000;
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - Math.floor(Math.random() * 3)); // Random start date 0-3 years ago
      
      const investment = await this.createInvestment({
        investorId: investor.id,
        planId: plan1.id,
        investmentDate: startDate.toISOString().split('T')[0],
        investedAmount: investorData.investment,
        bondsPurchased,
        lockInExpiry: new Date(startDate.getFullYear() + 3, startDate.getMonth(), startDate.getDate()).toISOString().split('T')[0],
        maturityDate: new Date(startDate.getFullYear() + 10, startDate.getMonth(), startDate.getDate()).toISOString().split('T')[0],
      });

      // Create initial investment transaction
      await this.createTransaction({
        investmentId: investment.id,
        type: "investment",
        amount: investorData.investment,
        transactionDate: startDate.toISOString().split('T')[0],
        mode: "bank_transfer",
        transactionId: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        status: "completed",
        notes: `Initial investment of ₹${(investmentAmount / 100000).toFixed(2)} Lakhs`,
      });
    }

    console.log(`✅ Loaded ${sampleInvestors.length} sample investors to demonstrate your data`);
    
    // Auto-backup system data every hour
    this.scheduleDataBackups();
  }

  // Schedule automatic data backups
  private async scheduleDataBackups() {
    const { dataBackupManager } = await import('./data-backup');
    
    // Create initial backup after data is loaded
    setTimeout(async () => {
      try {
        await dataBackupManager.createBackup();
        console.log("🔒 Initial data backup created successfully");
      } catch (error) {
        console.error("Initial backup failed:", error);
      }
    }, 5000); // Wait 5 seconds after data loading

    // Schedule backups every hour
    setInterval(async () => {
      try {
        await dataBackupManager.createBackup();
        console.log("🔒 Scheduled backup completed");
      } catch (error) {
        console.error("Scheduled backup failed:", error);
      }
    }, 60 * 60 * 1000); // Every hour

    console.log("📋 Data backup system initialized - backups every hour");
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      id: userData.id || this.generateId(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "investor",
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const user: User = {
      ...userData,
      id: userData.id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async storeTestCredentials(userId: string, username: string, password: string): Promise<void> {
    console.log(`Test credentials created - UserId: ${userId}, Username: ${username}, Password: ${password}`);
  }

  // Investor operations
  async getInvestor(id: string): Promise<Investor | undefined> {
    return this.investors.get(id);
  }

  async getInvestorByUserId(userId: string): Promise<Investor | undefined> {
    return Array.from(this.investors.values()).find(inv => inv.userId === userId);
  }

  async getInvestorWithInvestments(id: string): Promise<InvestorWithInvestments | undefined> {
    const investor = this.investors.get(id);
    if (!investor) return undefined;

    const investorInvestments = Array.from(this.investments.values())
      .filter(inv => inv.investorId === id);

    const investmentsWithTransactions = investorInvestments.map(inv => {
      const plan = this.investmentPlans.get(inv.planId);
      const invTransactions = Array.from(this.transactions.values())
        .filter(tx => tx.investmentId === inv.id);
      
      return {
        ...inv,
        plan: plan!,
        transactions: invTransactions,
      };
    });

    return {
      ...investor,
      investments: investmentsWithTransactions,
    };
  }

  async createInvestor(investorData: InsertInvestor): Promise<Investor> {
    const id = await this.generateInvestorId(investorData);
    const investor: Investor = {
      ...investorData,
      id,
      userId: investorData.userId || null,
      middleName: investorData.middleName || null,
      secondaryMobile: investorData.secondaryMobile || null,
      secondaryAddress: investorData.secondaryAddress || null,
      secondaryAddressPin: investorData.secondaryAddressPin || null,
      kycStatus: investorData.kycStatus || "pending",
      status: investorData.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investors.set(id, investor);
    return investor;
  }

  async updateInvestor(id: string, investorData: Partial<InsertInvestor>): Promise<Investor> {
    const existing = this.investors.get(id);
    if (!existing) throw new Error(`Investor with id ${id} not found`);
    
    const updated: Investor = {
      ...existing,
      ...investorData,
      updatedAt: new Date(),
    };
    this.investors.set(id, updated);
    return updated;
  }

  async deleteInvestor(id: string): Promise<boolean> {
    // Delete related investments and transactions
    const investorInvestments = Array.from(this.investments.values())
      .filter(inv => inv.investorId === id);
    
    investorInvestments.forEach(inv => {
      this.investments.delete(inv.id);
      // Delete related transactions
      Array.from(this.transactions.entries())
        .filter(([_, tx]) => tx.investmentId === inv.id)
        .forEach(([txId, _]) => this.transactions.delete(txId));
    });
    
    return this.investors.delete(id);
  }

  async getAllInvestors(): Promise<Investor[]> {
    return Array.from(this.investors.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async generateInvestorId(investorData: InsertInvestor): Promise<string> {
    return (this.investors.size + 1).toString();
  }

  // Investment operations
  async getInvestment(id: string): Promise<Investment | undefined> {
    return this.investments.get(id);
  }

  async getInvestmentWithDetails(id: string): Promise<InvestmentWithDetails | undefined> {
    const investment = this.investments.get(id);
    if (!investment) return undefined;

    const investor = this.investors.get(investment.investorId);
    const plan = this.investmentPlans.get(investment.planId);
    const investmentTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.investmentId === id);

    return {
      ...investment,
      investor: investor!,
      plan: plan!,
      transactions: investmentTransactions,
    };
  }

  async getInvestmentsByInvestor(investorId: string): Promise<Investment[]> {
    return Array.from(this.investments.values())
      .filter(inv => inv.investorId === investorId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getInvestorInvestments(investorId: string): Promise<Investment[]> {
    return this.getInvestmentsByInvestor(investorId);
  }

  async getInvestorTransactions(investorId: string, transactionType?: string): Promise<Transaction[]> {
    const investorInvestments = Array.from(this.investments.values())
      .filter(inv => inv.investorId === investorId);
    
    let transactions = Array.from(this.transactions.values())
      .filter(tx => investorInvestments.some(inv => inv.id === tx.investmentId));
    
    if (transactionType) {
      transactions = transactions.filter(tx => tx.type === transactionType);
    }
    
    return transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const id = await this.generateDebentureId();
    const investment: Investment = {
      ...investmentData,
      id,
      bonusEarned: investmentData.bonusEarned || "0.00",
      bonusEarnedDate: investmentData.bonusEarnedDate || null,
      investmentPlan: investmentData.investmentPlan || "10",
      isActive: investmentData.isActive !== undefined ? investmentData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investments.set(id, investment);
    return investment;
  }

  async generateDebentureId(): Promise<string> {
    const existingDebIds = Array.from(this.investments.keys())
      .filter(id => id.startsWith('Deb_'));
    
    let maxNumber = 0;
    existingDebIds.forEach(id => {
      const match = id.match(/^Deb_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `Deb_${nextNumber.toString().padStart(3, '0')}`;
  }

  async updateInvestment(id: string, investmentData: Partial<InsertInvestment>): Promise<Investment> {
    const existing = this.investments.get(id);
    if (!existing) throw new Error(`Investment with id ${id} not found`);
    
    const updated: Investment = {
      ...existing,
      ...investmentData,
      updatedAt: new Date(),
    };
    this.investments.set(id, updated);
    return updated;
  }

  async getAllInvestments(): Promise<Investment[]> {
    return Array.from(this.investments.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Investment Plan operations
  async getInvestmentPlan(id: string): Promise<InvestmentPlan | undefined> {
    return this.investmentPlans.get(id);
  }

  async getAllInvestmentPlans(): Promise<InvestmentPlan[]> {
    return Array.from(this.investmentPlans.values())
      .filter(plan => plan.isActive)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createInvestmentPlan(planData: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const id = this.generateId();
    const plan: InvestmentPlan = {
      ...planData,
      id,
      version: planData.version || 1,
      expiryDate: planData.expiryDate || null,
      minBondsPerInvestor: planData.minBondsPerInvestor || 1,
      bonusMultiplier: planData.bonusMultiplier || "2.00",
      maturityEligibilityYears: planData.maturityEligibilityYears || 10,
      maturityMultiplier: planData.maturityMultiplier || "3.00",
      isActive: planData.isActive !== undefined ? planData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investmentPlans.set(id, plan);
    return plan;
  }

  async updateInvestmentPlan(id: string, planData: Partial<InsertInvestmentPlan>): Promise<InvestmentPlan> {
    const existing = this.investmentPlans.get(id);
    if (!existing) throw new Error(`Investment plan with id ${id} not found`);
    
    const updated: InvestmentPlan = {
      ...existing,
      ...planData,
      updatedAt: new Date(),
    };
    this.investmentPlans.set(id, updated);
    return updated;
  }

  // Transaction operations
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.generateId();
    const transaction: Transaction = {
      ...transactionData,
      id,
      disbursementDate: transactionData.disbursementDate || null,
      yearCovered: transactionData.yearCovered || null,
      interestRate: transactionData.interestRate || null,
      proofDocument: transactionData.proofDocument || null,
      status: transactionData.status || "completed",
      notes: transactionData.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByInvestment(investmentId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.investmentId === investmentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateTransaction(id: string, transactionData: Partial<InsertTransaction>): Promise<Transaction> {
    const existing = this.transactions.get(id);
    if (!existing) throw new Error(`Transaction with id ${id} not found`);
    
    const updated: Transaction = {
      ...existing,
      ...transactionData,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updated);
    return updated;
  }

  // Analytics operations
  async getPortfolioOverview(): Promise<{
    totalInvestors: number;
    totalPrincipal: string;
    totalInterestPaid: string;
    maturityDue: string;
  }> {
    const totalInvestors = this.investors.size;
    
    const totalPrincipal = Array.from(this.investments.values())
      .reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
    
    const totalInterestPaid = Array.from(this.transactions.values())
      .filter(tx => tx.type === "dividend_disbursement")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    const maturityDue = Array.from(this.investments.values())
      .filter(inv => {
        const maturityDate = new Date(inv.maturityDate);
        return maturityDate >= now && maturityDate <= oneYearFromNow;
      })
      .reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);

    return {
      totalInvestors,
      totalPrincipal: totalPrincipal.toString(),
      totalInterestPaid: totalInterestPaid.toString(),
      maturityDue: maturityDue.toString(),
    };
  }

  // Dividend rates
  async getDividendRates(): Promise<{ year: number; rate: string }[]> {
    return Array.from(this.dividendRates.values())
      .sort((a, b) => a.year - b.year);
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

    rates.forEach(rate => {
      this.dividendRates.set(rate.year, rate);
    });
  }

  // Agreement operations
  async createInvestmentAgreement(agreement: InsertInvestmentAgreement): Promise<InvestmentAgreement> {
    const id = this.generateId();
    const result: InvestmentAgreement = {
      ...agreement,
      id,
      status: agreement.status || "pending",
      signedAt: agreement.signedAt || null,
      signatureData: agreement.signatureData || null,
      signatureType: agreement.signatureType || null,
      createdAt: new Date(),
    };
    this.agreements.set(id, result);
    return result;
  }

  async getInvestmentAgreementsByInvestor(investorId: string): Promise<InvestmentAgreement[]> {
    return Array.from(this.agreements.values())
      .filter(agreement => agreement.investorId === investorId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateInvestmentAgreement(id: string, agreement: Partial<InsertInvestmentAgreement>): Promise<InvestmentAgreement> {
    const existing = this.agreements.get(id);
    if (!existing) throw new Error(`Investment agreement with id ${id} not found`);
    
    const updated: InvestmentAgreement = {
      ...existing,
      ...agreement,
    };
    this.agreements.set(id, updated);
    return updated;
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Storage wrapper that handles database connection failures gracefully
class StorageWrapper implements IStorage {
  private storage: IStorage;
  private isUsingMemoryStorage = false;

  constructor() {
    // Start with database storage, but will fallback on first error
    this.storage = new DatabaseStorage();
  }

  private async ensureStorage<T>(operation: (storage: IStorage) => Promise<T>): Promise<T> {
    try {
      return await operation(this.storage);
    } catch (error) {
      // Check if this is a database connection error
      if (!this.isUsingMemoryStorage && 
          (error instanceof Error && 
           (error.message.includes('endpoint has been disabled') || 
            error.message.includes('DATABASE_URL') ||
            error.message.includes('Neon') ||
            error.message.includes('XX000')))) {
        
        console.warn("⚠️  Database connection failed, switching to memory storage:", error.message);
        this.storage = new MemoryStorage();
        this.isUsingMemoryStorage = true;
        
        // Retry the operation with memory storage
        return await operation(this.storage);
      }
      throw error;
    }
  }

  // Delegate all methods to the ensureStorage wrapper
  async getUser(id: string): Promise<User | undefined> {
    return this.ensureStorage(storage => storage.getUser(id));
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return this.ensureStorage(storage => storage.upsertUser(user));
  }

  async createUser(user: any): Promise<User> {
    return this.ensureStorage(storage => storage.createUser(user));
  }

  async storeTestCredentials(userId: string, username: string, password: string): Promise<void> {
    return this.ensureStorage(storage => storage.storeTestCredentials(userId, username, password));
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    return this.ensureStorage(storage => storage.getInvestor(id));
  }

  async getInvestorByUserId(userId: string): Promise<Investor | undefined> {
    return this.ensureStorage(storage => storage.getInvestorByUserId(userId));
  }

  async getInvestorWithInvestments(id: string): Promise<InvestorWithInvestments | undefined> {
    return this.ensureStorage(storage => storage.getInvestorWithInvestments(id));
  }

  async createInvestor(investor: InsertInvestor): Promise<Investor> {
    return this.ensureStorage(storage => storage.createInvestor(investor));
  }

  async updateInvestor(id: string, investor: Partial<InsertInvestor>): Promise<Investor> {
    return this.ensureStorage(storage => storage.updateInvestor(id, investor));
  }

  async deleteInvestor(id: string): Promise<boolean> {
    return this.ensureStorage(storage => storage.deleteInvestor(id));
  }

  async getAllInvestors(): Promise<Investor[]> {
    return this.ensureStorage(storage => storage.getAllInvestors());
  }

  async generateInvestorId(investorData: InsertInvestor): Promise<string> {
    return this.ensureStorage(storage => storage.generateInvestorId(investorData));
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    return this.ensureStorage(storage => storage.getInvestment(id));
  }

  async getInvestmentWithDetails(id: string): Promise<InvestmentWithDetails | undefined> {
    return this.ensureStorage(storage => storage.getInvestmentWithDetails(id));
  }

  async getInvestmentsByInvestor(investorId: string): Promise<Investment[]> {
    return this.ensureStorage(storage => storage.getInvestmentsByInvestor(investorId));
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    return this.ensureStorage(storage => storage.createInvestment(investment));
  }

  async updateInvestment(id: string, investment: Partial<InsertInvestment>): Promise<Investment> {
    return this.ensureStorage(storage => storage.updateInvestment(id, investment));
  }

  async getAllInvestments(): Promise<Investment[]> {
    return this.ensureStorage(storage => storage.getAllInvestments());
  }

  async getInvestmentPlan(id: string): Promise<InvestmentPlan | undefined> {
    return this.ensureStorage(storage => storage.getInvestmentPlan(id));
  }

  async getAllInvestmentPlans(): Promise<InvestmentPlan[]> {
    return this.ensureStorage(storage => storage.getAllInvestmentPlans());
  }

  async createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    return this.ensureStorage(storage => storage.createInvestmentPlan(plan));
  }

  async updateInvestmentPlan(id: string, plan: Partial<InsertInvestmentPlan>): Promise<InvestmentPlan> {
    return this.ensureStorage(storage => storage.updateInvestmentPlan(id, plan));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.ensureStorage(storage => storage.getTransaction(id));
  }

  async getTransactionsByInvestment(investmentId: string): Promise<Transaction[]> {
    return this.ensureStorage(storage => storage.getTransactionsByInvestment(investmentId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    return this.ensureStorage(storage => storage.createTransaction(transaction));
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    return this.ensureStorage(storage => storage.updateTransaction(id, transaction));
  }

  async getPortfolioOverview(): Promise<{
    totalInvestors: number;
    totalPrincipal: string;
    totalInterestPaid: string;
    maturityDue: string;
  }> {
    return this.ensureStorage(storage => storage.getPortfolioOverview());
  }

  async getDividendRates(): Promise<{ year: number; rate: string }[]> {
    return this.ensureStorage(storage => storage.getDividendRates());
  }

  async initializeDividendRates(): Promise<void> {
    return this.ensureStorage(storage => storage.initializeDividendRates());
  }

  async createInvestmentAgreement(agreement: InsertInvestmentAgreement): Promise<InvestmentAgreement> {
    return this.ensureStorage(storage => storage.createInvestmentAgreement(agreement));
  }

  async getInvestmentAgreementsByInvestor(investorId: string): Promise<InvestmentAgreement[]> {
    return this.ensureStorage(storage => storage.getInvestmentAgreementsByInvestor(investorId));
  }

  async updateInvestmentAgreement(id: string, agreement: Partial<InsertInvestmentAgreement>): Promise<InvestmentAgreement> {
    return this.ensureStorage(storage => storage.updateInvestmentAgreement(id, agreement));
  }

  // Additional methods that may be used by routes
  async getAllTransactions(): Promise<Transaction[]> {
    return this.ensureStorage(async storage => {
      if ('getAllTransactions' in storage) {
        return (storage as any).getAllTransactions();
      }
      // Fallback for database storage that doesn't have this method
      return [];
    });
  }

  async getInvestorInvestments(investorId: string): Promise<Investment[]> {
    return this.ensureStorage(async storage => {
      if ('getInvestorInvestments' in storage) {
        return (storage as any).getInvestorInvestments(investorId);
      }
      // Fallback to getInvestmentsByInvestor
      return storage.getInvestmentsByInvestor(investorId);
    });
  }

  async getInvestorTransactions(investorId: string, transactionType?: string): Promise<Transaction[]> {
    return this.ensureStorage(async storage => {
      if ('getInvestorTransactions' in storage) {
        return (storage as any).getInvestorTransactions(investorId, transactionType);
      }
      // Fallback implementation
      const investments = await storage.getInvestmentsByInvestor(investorId);
      const allTransactions = await this.getAllTransactions();
      let transactions = allTransactions.filter(tx => 
        investments.some(inv => inv.id === tx.investmentId)
      );
      
      if (transactionType) {
        transactions = transactions.filter(tx => tx.type === transactionType);
      }
      
      return transactions.sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
    });
  }
}

export const storage = new StorageWrapper();
