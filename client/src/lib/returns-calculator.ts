import { differenceInDays, differenceInYears, addYears } from "date-fns";

export interface DailyReturnsData {
  principalInvestment: number;
  interestTillDate: number;
  milestoneBonus: number;
  dailyInterestRate: number;
  dailyInterestAmount: number;
  currentYear: number;
  currentRate: number;
  exitValue: string; // "N/A" until after lock-in period
  daysSinceInvestment: number;
  yearsSinceInvestment: number;
}

export interface YearlyBreakdown {
  year: number;
  rate: number;
  dividend: number;
  bonus: number;
  total: number;
}

export interface ReturnsCalculation {
  dailyReturns: DailyReturnsData;
  yearlyBreakdown: YearlyBreakdown[];
  summary: {
    principal: number;
    totalDividends: number;
    totalBonuses: number;
    maturityValue: number;
  };
}

// Dividend rates by year as per the bond returns schedule
const DIVIDEND_RATES = {
  1: 0,    // 0% in year 1
  2: 6,    // 6% in year 2
  3: 9,    // 9% in year 3  
  4: 12,   // 12% in year 4
  5: 18,   // 18% in year 5
  6: 18,   // 18% in year 6
  7: 18,   // 18% in year 7
  8: 18,   // 18% in year 8
  9: 18,   // 18% in year 9
  10: 0,   // 0% in year 10 (only bonus)
};

const BONUS_YEARS = [5, 10]; // 100% bonus at years 5 and 10
const LOCK_IN_PERIOD_YEARS = 3;

export function calculateReturns(
  principalAmount: number,
  investmentDate: Date,
  currentDate: Date = new Date()
): ReturnsCalculation {
  const daysSinceInvestment = differenceInDays(currentDate, investmentDate);
  const yearsSinceInvestment = differenceInYears(currentDate, investmentDate);
  
  // Calculate current year (1-10)
  const currentYear = Math.min(Math.floor(yearsSinceInvestment) + 1, 10);
  const currentRate = DIVIDEND_RATES[currentYear as keyof typeof DIVIDEND_RATES] || 0;
  
  // Calculate interest till date
  let totalInterest = 0;
  let totalBonuses = 0;
  const yearlyBreakdown: YearlyBreakdown[] = [];
  
  for (let year = 1; year <= 10; year++) {
    const rate = DIVIDEND_RATES[year as keyof typeof DIVIDEND_RATES];
    const yearStartDate = addYears(investmentDate, year - 1);
    const yearEndDate = addYears(investmentDate, year);
    
    let dividend = 0;
    let bonus = 0;
    
    if (currentDate >= yearEndDate) {
      // Full year completed
      dividend = principalAmount * (rate / 100);
      if (BONUS_YEARS.includes(year)) {
        bonus = principalAmount; // 100% bonus
      }
    } else if (currentDate >= yearStartDate && year === currentYear) {
      // Partial current year
      const daysInCurrentYear = differenceInDays(currentDate, yearStartDate);
      const totalDaysInYear = differenceInDays(yearEndDate, yearStartDate);
      dividend = (principalAmount * (rate / 100) * daysInCurrentYear) / totalDaysInYear;
    }
    
    totalInterest += dividend;
    totalBonuses += bonus;
    
    yearlyBreakdown.push({
      year,
      rate,
      dividend,
      bonus,
      total: dividend + bonus,
    });
  }
  
  // Calculate daily interest for current year
  const dailyInterestRate = currentRate / 365; // Daily rate as percentage
  const dailyInterestAmount = (principalAmount * currentRate) / (100 * 365);
  
  // Determine exit value availability
  const isAfterLockIn = yearsSinceInvestment >= LOCK_IN_PERIOD_YEARS;
  const exitValue = isAfterLockIn ? "Available" : "N/A";
  
  // Calculate milestone bonus earned so far
  let milestoneBonus = 0;
  for (const bonusYear of BONUS_YEARS) {
    if (yearsSinceInvestment >= bonusYear) {
      milestoneBonus += principalAmount; // 100% bonus per milestone
    }
  }
  
  const dailyReturns: DailyReturnsData = {
    principalInvestment: principalAmount,
    interestTillDate: totalInterest,
    milestoneBonus,
    dailyInterestRate,
    dailyInterestAmount,
    currentYear,
    currentRate,
    exitValue,
    daysSinceInvestment,
    yearsSinceInvestment,
  };
  
  const summary = {
    principal: principalAmount,
    totalDividends: totalInterest,
    totalBonuses: totalBonuses,
    maturityValue: principalAmount + totalInterest + totalBonuses,
  };
  
  return {
    dailyReturns,
    yearlyBreakdown,
    summary,
  };
}

export function getInvestmentUnits(amount: number): number {
  const UNIT_VALUE = 2000000; // ₹20 lakhs per unit
  return Math.floor(amount / UNIT_VALUE);
}

export function getMaxInvestmentAmount(): number {
  const MAX_UNITS = 3;
  const UNIT_VALUE = 2000000; // ₹20 lakhs per unit
  return MAX_UNITS * UNIT_VALUE; // ₹60 lakhs (6 crores) maximum
}

export function validateInvestmentAmount(amount: number): {
  isValid: boolean;
  error?: string;
  units?: number;
} {
  const UNIT_VALUE = 2000000;
  const MAX_UNITS = 3;
  
  if (amount <= 0) {
    return { isValid: false, error: "Investment amount must be greater than 0" };
  }
  
  if (amount % UNIT_VALUE !== 0) {
    return { 
      isValid: false, 
      error: `Investment must be in multiples of ₹20 lakhs (₹20L, ₹40L, or ₹60L only)` 
    };
  }
  
  const units = amount / UNIT_VALUE;
  if (units > MAX_UNITS) {
    return { 
      isValid: false, 
      error: `Maximum ${MAX_UNITS} units (₹60 lakhs total) allowed per investor` 
    };
  }
  
  return { isValid: true, units };
}