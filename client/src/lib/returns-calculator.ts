export interface DividendRate {
  year: number;
  rate: number;
}

export interface ReturnsCalculation {
  yearlyBreakdown: Array<{
    year: number;
    rate: number;
    dividend: number;
    bonus: number;
    total: number;
  }>;
  summary: {
    principal: number;
    totalDividends: number;
    totalBonuses: number;
    maturityValue: number;
  };
}

export const DEFAULT_DIVIDEND_RATES: DividendRate[] = [
  { year: 1, rate: 0 },
  { year: 2, rate: 6 },
  { year: 3, rate: 9 },
  { year: 4, rate: 12 },
  { year: 5, rate: 18 },
  { year: 6, rate: 18 },
  { year: 7, rate: 18 },
  { year: 8, rate: 18 },
  { year: 9, rate: 18 },
  { year: 10, rate: 0 }, // No dividend in year 10, only bonus
];

export function calculateReturns(
  principal: number,
  startDate: Date,
  dividendRates: DividendRate[] = DEFAULT_DIVIDEND_RATES
): ReturnsCalculation {
  const yearlyBreakdown = [];
  let totalDividends = 0;
  let totalBonuses = 0;

  for (let year = 1; year <= 10; year++) {
    const rateData = dividendRates.find(r => r.year === year);
    const rate = rateData ? rateData.rate : 0;
    
    // Calculate dividend (always on original principal)
    const dividend = (principal * rate) / 100;
    
    // Calculate bonus
    let bonus = 0;
    if (year === 5 || year === 10) {
      bonus = principal; // 100% bonus on original principal
    }
    
    const total = dividend + bonus;
    
    yearlyBreakdown.push({
      year,
      rate,
      dividend,
      bonus,
      total,
    });
    
    totalDividends += dividend;
    totalBonuses += bonus;
  }
  
  const maturityValue = principal + totalDividends + totalBonuses;
  
  return {
    yearlyBreakdown,
    summary: {
      principal,
      totalDividends,
      totalBonuses,
      maturityValue,
    },
  };
}

export function calculateCurrentInterestRate(investmentDate: Date): number {
  const today = new Date();
  const yearsDiff = today.getFullYear() - investmentDate.getFullYear();
  const monthsDiff = today.getMonth() - investmentDate.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;
  
  // Determine which year of investment we're in
  const currentYear = Math.floor(totalMonths / 12) + 1;
  
  // Clamp to 1-10 years
  const year = Math.max(1, Math.min(10, currentYear));
  
  const rateData = DEFAULT_DIVIDEND_RATES.find(r => r.year === year);
  return rateData ? rateData.rate : 0;
}

export function calculateInterestEarned(
  principal: number,
  investmentDate: Date,
  currentDate: Date = new Date()
): number {
  const yearsDiff = currentDate.getFullYear() - investmentDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - investmentDate.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;
  
  let totalInterest = 0;
  
  // Calculate interest for completed years
  for (let year = 1; year <= Math.floor(totalMonths / 12); year++) {
    const rateData = DEFAULT_DIVIDEND_RATES.find(r => r.year === year);
    const rate = rateData ? rateData.rate : 0;
    totalInterest += (principal * rate) / 100;
  }
  
  // Add partial year interest if applicable
  const remainingMonths = totalMonths % 12;
  if (remainingMonths > 0) {
    const currentYear = Math.floor(totalMonths / 12) + 1;
    if (currentYear <= 10) {
      const rateData = DEFAULT_DIVIDEND_RATES.find(r => r.year === currentYear);
      const rate = rateData ? rateData.rate : 0;
      const partialYearInterest = (principal * rate * remainingMonths) / (100 * 12);
      totalInterest += partialYearInterest;
    }
  }
  
  return totalInterest;
}
