import { addYears, addMonths, format, isAfter, isBefore } from 'date-fns';

export interface InterestCalculation {
  interestEarnedTillDate: number;
  interestDisbursedTillDate: number;
  interestToBeDispursedNext: {
    amount: number;
    disbursementDate: string;
    yearCovered: number;
  };
  nextDisbursementDate: string;
  completedYears: number;
  currentYearProgress: number;
}

export class InterestDisbursementEngine {
  
  /**
   * Calculate disbursement date based on investment start date
   * Rule: 24th of the month following the anniversary
   * Example: Investment on March 5, 2023 -> First disbursement April 24, 2024
   */
  static calculateDisbursementDate(investmentStartDate: Date, yearNumber: number): Date {
    // Add years to get anniversary date
    const anniversaryDate = addYears(investmentStartDate, yearNumber);
    
    // Get the month following the anniversary
    const disbursementMonth = addMonths(anniversaryDate, 1);
    
    // Set to 24th of that month
    const disbursementDate = new Date(disbursementMonth.getFullYear(), disbursementMonth.getMonth(), 24);
    
    return disbursementDate;
  }

  /**
   * Get interest rate for a specific year
   * Year 1: 0%, Year 2: 6%, Year 3: 9%, Year 4: 12%, Year 5+: 18%
   */
  static getInterestRateForYear(year: number): number {
    if (year === 1) return 0;
    if (year === 2) return 6;
    if (year === 3) return 9;
    if (year === 4) return 12;
    return 18; // Year 5 and beyond
  }

  /**
   * Calculate interest for a specific year
   */
  static calculateYearlyInterest(principalAmount: number, year: number): number {
    const rate = this.getInterestRateForYear(year);
    return Math.round(principalAmount * (rate / 100));
  }

  /**
   * Get milestone bonus for completed years
   * 5 years: 5% bonus, 10 years: 10% bonus
   */
  static getMilestoneBonus(principalAmount: number, completedYears: number): number {
    let bonus = 0;
    if (completedYears >= 10) {
      bonus += principalAmount * 0.10; // 10% bonus for 10 years
    } else if (completedYears >= 5) {
      bonus += principalAmount * 0.05; // 5% bonus for 5 years
    }
    return Math.round(bonus);
  }

  /**
   * Calculate comprehensive interest information for an investment
   */
  static calculateInterestDetails(
    investmentStartDate: Date, 
    principalAmount: number, 
    disbursedTransactions: Array<{amount: number, disbursementDate: Date}>
  ): InterestCalculation {
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - investmentStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearsSinceStart = daysSinceStart / 365.25;
    
    // Calculate completed years (full years that have passed)
    const completedYears = Math.floor(yearsSinceStart);
    const currentYearProgress = yearsSinceStart - completedYears;
    
    // Calculate total interest earned till date
    let interestEarnedTillDate = 0;
    
    // Add interest for completed years
    for (let year = 1; year <= completedYears; year++) {
      interestEarnedTillDate += this.calculateYearlyInterest(principalAmount, year);
    }
    
    // Add prorated interest for current year
    if (completedYears + 1 <= 10) { // Only if still within investment period
      const currentYearRate = this.getInterestRateForYear(completedYears + 1);
      const currentYearInterest = principalAmount * (currentYearRate / 100) * currentYearProgress;
      interestEarnedTillDate += Math.round(currentYearInterest);
    }
    
    // Add milestone bonuses for completed milestones
    interestEarnedTillDate += this.getMilestoneBonus(principalAmount, completedYears);
    
    // Calculate total disbursed amount
    const interestDisbursedTillDate = disbursedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Calculate next disbursement
    let nextDisbursementYear = completedYears + 1;
    let nextDisbursementAmount = 0;
    let nextDisbursementDate = '';
    
    // Find the next year that needs disbursement
    while (nextDisbursementYear <= 10) {
      const disbursementDate = this.calculateDisbursementDate(investmentStartDate, nextDisbursementYear);
      
      // Check if this disbursement has already been made
      const alreadyDisbursed = disbursedTransactions.some(transaction => 
        Math.abs(transaction.disbursementDate.getTime() - disbursementDate.getTime()) < 24 * 60 * 60 * 1000 // Within 1 day
      );
      
      if (!alreadyDisbursed && isAfter(disbursementDate, today)) {
        nextDisbursementAmount = this.calculateYearlyInterest(principalAmount, nextDisbursementYear);
        
        // Add milestone bonus if applicable
        if (nextDisbursementYear === 5) {
          nextDisbursementAmount += this.getMilestoneBonus(principalAmount, 5);
        } else if (nextDisbursementYear === 10) {
          nextDisbursementAmount += this.getMilestoneBonus(principalAmount, 10);
        }
        
        nextDisbursementDate = format(disbursementDate, 'MMM dd, yyyy');
        break;
      }
      
      nextDisbursementYear++;
    }
    
    return {
      interestEarnedTillDate: Math.round(interestEarnedTillDate),
      interestDisbursedTillDate: Math.round(interestDisbursedTillDate),
      interestToBeDispursedNext: {
        amount: Math.round(nextDisbursementAmount),
        disbursementDate: nextDisbursementDate,
        yearCovered: nextDisbursementYear
      },
      nextDisbursementDate,
      completedYears,
      currentYearProgress: Math.round(currentYearProgress * 100) / 100
    };
  }

  /**
   * Get all scheduled disbursement dates for an investment
   */
  static getScheduledDisbursements(investmentStartDate: Date, principalAmount: number): Array<{
    year: number;
    disbursementDate: string;
    amount: number;
    interestRate: number;
    milestoneBonus?: number;
  }> {
    const disbursements = [];
    
    for (let year = 1; year <= 10; year++) {
      const disbursementDate = this.calculateDisbursementDate(investmentStartDate, year);
      const interestAmount = this.calculateYearlyInterest(principalAmount, year);
      const interestRate = this.getInterestRateForYear(year);
      
      let milestoneBonus = 0;
      if (year === 5) {
        milestoneBonus = Math.round(principalAmount * 0.05);
      } else if (year === 10) {
        milestoneBonus = Math.round(principalAmount * 0.10);
      }
      
      disbursements.push({
        year,
        disbursementDate: format(disbursementDate, 'MMM dd, yyyy'),
        amount: interestAmount + milestoneBonus,
        interestRate,
        milestoneBonus: milestoneBonus > 0 ? milestoneBonus : undefined
      });
    }
    
    return disbursements;
  }
}