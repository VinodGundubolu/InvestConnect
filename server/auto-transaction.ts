import { storage } from "./storage";
import type { Investment, Transaction, InsertTransaction } from "@shared/schema";

export interface AutoTransactionEntry {
  investmentId: string;
  type: "dividend_disbursement" | "bonus_disbursement" | "maturity_disbursement";
  amount: number;
  transactionDate: string;
  yearCovered?: number;
  interestRate?: number;
  status: "completed" | "pending" | "scheduled";
  notes?: string;
}

export class AutoTransactionRecorder {
  
  /**
   * Automatically creates transaction entries for interest and bonus disbursements
   * based on investment start dates and current date
   */
  async processInvestmentTransactions(investmentId: string): Promise<Transaction[]> {
    try {
      const investment = await storage.getInvestment(investmentId);
      if (!investment) {
        console.error(`Investment not found: ${investmentId}`);
        return [];
      }

      const investmentDate = new Date(investment.investmentDate);
      const currentDate = new Date();
      const yearsSinceStart = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      const createdTransactions: Transaction[] = [];
      const existingTransactions = await storage.getTransactionsByInvestment(investmentId);
      
      // Interest disbursement rates by year
      const interestRates = [
        { year: 1, rate: 0 },
        { year: 2, rate: 6 },
        { year: 3, rate: 9 },
        { year: 4, rate: 12 },
        { year: 5, rate: 18 },
        { year: 6, rate: 18 },
        { year: 7, rate: 18 },
        { year: 8, rate: 18 },
        { year: 9, rate: 18 },
        { year: 10, rate: 0 }
      ];

      const principalAmount = parseFloat(investment.investedAmount);
      
      // Create interest disbursement transactions for completed years
      for (let year = 1; year <= Math.min(yearsSinceStart, 10); year++) {
        const rate = interestRates.find(r => r.year === year)?.rate || 0;
        
        // Skip if rate is 0 or transaction already exists
        const existsForYear = existingTransactions.some(t => 
          t.type === "dividend_disbursement" && t.yearCovered === year
        );
        
        if (rate > 0 && !existsForYear) {
          const interestAmount = Math.round(principalAmount * (rate / 100));
          const disbursementDate = new Date(investmentDate);
          disbursementDate.setFullYear(disbursementDate.getFullYear() + year);
          
          const transaction = await this.createTransaction({
            investmentId,
            type: "dividend_disbursement",
            amount: interestAmount,
            transactionDate: disbursementDate.toISOString().split('T')[0],
            yearCovered: year,
            interestRate: rate,
            status: year <= yearsSinceStart ? "completed" : "pending",
            notes: `Year ${year} Interest Disbursement - ${rate}% of principal`
          });
          
          if (transaction) {
            createdTransactions.push(transaction);
          }
        }
      }

      // Create bonus disbursement transactions for milestone years (5 and 10)
      const milestoneYears = [5, 10];
      for (const milestoneYear of milestoneYears) {
        if (yearsSinceStart >= milestoneYear) {
          const existsBonusForYear = existingTransactions.some(t => 
            t.type === "bonus_disbursement" && t.yearCovered === milestoneYear
          );
          
          if (!existsBonusForYear) {
            const bonusAmount = principalAmount; // 100% of investment as bonus
            const bonusDate = new Date(investmentDate);
            bonusDate.setFullYear(bonusDate.getFullYear() + milestoneYear);
            
            const transaction = await this.createTransaction({
              investmentId,
              type: "bonus_disbursement",
              amount: bonusAmount,
              transactionDate: bonusDate.toISOString().split('T')[0],
              yearCovered: milestoneYear,
              status: "completed",
              notes: `Year ${milestoneYear} Milestone Bonus - 100% of principal investment`
            });
            
            if (transaction) {
              createdTransactions.push(transaction);
            }
          }
        }
      }

      // Create maturity transaction if investment has matured (10 years)
      if (yearsSinceStart >= 10) {
        const existsMaturity = existingTransactions.some(t => t.type === "maturity_disbursement");
        
        if (!existsMaturity) {
          const maturityDate = new Date(investmentDate);
          maturityDate.setFullYear(maturityDate.getFullYear() + 10);
          
          const transaction = await this.createTransaction({
            investmentId,
            type: "maturity_disbursement",
            amount: principalAmount,
            transactionDate: maturityDate.toISOString().split('T')[0],
            yearCovered: 10,
            status: "completed",
            notes: "Investment Maturity - Principal return at end of 10 years"
          });
          
          if (transaction) {
            createdTransactions.push(transaction);
          }
        }
      }

      return createdTransactions;
    } catch (error) {
      console.error("Error processing investment transactions:", error);
      return [];
    }
  }

  /**
   * Creates a single transaction record
   */
  async createTransaction(entry: AutoTransactionEntry): Promise<Transaction | null> {
    try {
      const transactionData: InsertTransaction = {
        investmentId: entry.investmentId,
        type: entry.type,
        amount: entry.amount.toString(),
        transactionDate: entry.transactionDate,
        disbursementDate: entry.status === "completed" ? new Date() : null,
        yearCovered: entry.yearCovered || null,
        interestRate: entry.interestRate?.toString() || null,
        mode: "bank_transfer",
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: entry.status,
        notes: entry.notes || null
      };

      return await storage.createTransaction(transactionData);
    } catch (error) {
      console.error("Error creating transaction:", error);
      return null;
    }
  }

  /**
   * Process all investments and create missing transactions
   */
  async processAllInvestments(): Promise<{ processed: number; created: number }> {
    try {
      const investments = await storage.getAllInvestments();
      let processed = 0;
      let created = 0;

      for (const investment of investments) {
        const transactions = await this.processInvestmentTransactions(investment.id);
        processed++;
        created += transactions.length;
        
        if (transactions.length > 0) {
          console.log(`Created ${transactions.length} transactions for investment ${investment.id}`);
        }
      }

      return { processed, created };
    } catch (error) {
      console.error("Error processing all investments:", error);
      return { processed: 0, created: 0 };
    }
  }
}

export const autoTransactionRecorder = new AutoTransactionRecorder();