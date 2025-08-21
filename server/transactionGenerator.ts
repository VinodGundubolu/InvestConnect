import { db } from "./db";
import { investors, investments, transactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface TransactionGenerationResult {
  generated: number;
  skipped: number;
  errors: string[];
}

/**
 * Automatically generates transaction history for all investors based on their investment timeline
 * This ensures every investor has proper transaction records for interest and bonus disbursements
 */
export class TransactionGenerator {
  
  /**
   * Generate all missing transactions for all investors
   */
  async generateAllMissingTransactions(): Promise<TransactionGenerationResult> {
    const result: TransactionGenerationResult = {
      generated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Get all investors with their investments
      const investorsWithInvestments = await db
        .select()
        .from(investors)
        .leftJoin(investments, eq(investors.id, investments.investorId));

      const investorGroups = new Map<string, { investor: any, investments: any[] }>();
      
      // Group by investor
      for (const row of investorsWithInvestments) {
        const investor = row.investors;
        const investment = row.investments;
        
        if (!investment) continue;
        
        if (!investorGroups.has(investor.id)) {
          investorGroups.set(investor.id, {
            investor,
            investments: []
          });
        }
        investorGroups.get(investor.id)!.investments.push(investment);
      }

      // Generate transactions for each investor
      for (const [investorId, data] of Array.from(investorGroups.entries())) {
        try {
          const generated = await this.generateTransactionsForInvestor(data.investor, data.investments);
          result.generated += generated;
        } catch (error: any) {
          result.errors.push(`Error for investor ${investorId}: ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`System error: ${error.message}`);
      return result;
    }
  }

  /**
   * Generate transactions for a specific investor based on their investment timeline
   */
  async generateTransactionsForInvestor(investor: any, investorInvestments: any[]): Promise<number> {
    let transactionsGenerated = 0;

    for (const investment of investorInvestments) {
      const investmentDate = new Date(investment.investmentDate);
      const currentDate = new Date();
      const investedAmount = parseFloat(investment.investedAmount);

      // Calculate years since investment
      const yearsSinceInvestment = Math.floor(
        (currentDate.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );

      // Generate transactions for each completed year
      for (let year = 1; year <= Math.min(yearsSinceInvestment, 10); year++) {
        // Check if transaction already exists for this year
        const existingTransaction = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.investmentId, investment.id),
            eq(transactions.yearCovered, year)
          ));

        if (existingTransaction.length > 0) {
          continue; // Skip if transaction already exists
        }

        // Calculate interest rate based on year
        let interestRate = 0;
        if (year === 1) interestRate = 0;
        else if (year === 2) interestRate = 6;
        else if (year === 3) interestRate = 9;
        else if (year === 4) interestRate = 12;
        else interestRate = 18;

        // Generate interest transaction (if rate > 0)
        if (interestRate > 0) {
          const interestAmount = Math.round(investedAmount * (interestRate / 100));
          const transactionDate = new Date(investmentDate);
          transactionDate.setFullYear(transactionDate.getFullYear() + year);
          transactionDate.setMonth(11, 31); // December 31st

          await db.insert(transactions).values({
            investmentId: investment.id,
            type: 'dividend_disbursement',
            amount: interestAmount.toString(),
            transactionDate: transactionDate.toISOString().split('T')[0],
            mode: 'bank_transfer',
            status: 'completed',
            yearCovered: year,
            interestRate: interestRate.toString(),
            notes: `Year ${year} Interest Disbursement - ${interestRate}% on ₹${(investedAmount / 100000).toFixed(1)}L`,
            transactionId: `TXN-${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(transactionDate.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          });

          transactionsGenerated++;
        }

        // Generate milestone bonus transactions
        if (year === 5) {
          // 5-year milestone bonus: ₹20L
          const bonusDate = new Date(investmentDate);
          bonusDate.setFullYear(bonusDate.getFullYear() + 5);
          bonusDate.setMonth(11, 31);

          await db.insert(transactions).values({
            investmentId: investment.id,
            type: 'bonus_disbursement',
            amount: '2000000', // ₹20L
            transactionDate: bonusDate.toISOString().split('T')[0],
            mode: 'bank_transfer',
            status: 'completed',
            yearCovered: 5,
            interestRate: '0',
            notes: `5-Year Milestone Bonus - ₹20L for completing 5 years`,
            transactionId: `BONUS-${bonusDate.getFullYear()}-${String(bonusDate.getMonth() + 1).padStart(2, '0')}-${String(bonusDate.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          });

          transactionsGenerated++;
        }

        if (year === 10) {
          // 10-year milestone bonus: ₹30L
          const bonusDate = new Date(investmentDate);
          bonusDate.setFullYear(bonusDate.getFullYear() + 10);
          bonusDate.setMonth(11, 31);

          await db.insert(transactions).values({
            investmentId: investment.id,
            type: 'bonus_disbursement',
            amount: '3000000', // ₹30L
            transactionDate: bonusDate.toISOString().split('T')[0],
            mode: 'bank_transfer',
            status: 'completed',
            yearCovered: 10,
            interestRate: '0',
            notes: `10-Year Milestone Bonus - ₹30L for completing 10 years`,
            transactionId: `BONUS-${bonusDate.getFullYear()}-${String(bonusDate.getMonth() + 1).padStart(2, '0')}-${String(bonusDate.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          });

          transactionsGenerated++;
        }
      }
    }

    return transactionsGenerated;
  }

  /**
   * Generate transactions for a specific investor by ID
   */
  async generateTransactionsForSpecificInvestor(investorId: string): Promise<number> {
    const investorData = await db
      .select()
      .from(investors)
      .leftJoin(investments, eq(investors.id, investments.investorId))
      .where(eq(investors.id, investorId));

    if (investorData.length === 0) {
      throw new Error(`Investor ${investorId} not found`);
    }

    const investor = investorData[0].investors;
    const investorInvestments = investorData
      .filter(row => row.investments !== null)
      .map(row => row.investments);

    return await this.generateTransactionsForInvestor(investor, investorInvestments);
  }
}

export const transactionGenerator = new TransactionGenerator();