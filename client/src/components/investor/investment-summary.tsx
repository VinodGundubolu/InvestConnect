import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateReturns, type DailyReturnsData } from "@/lib/returns-calculator";
import { InvestorWithInvestments } from "@shared/schema";
import { User } from "lucide-react";
import InvestorProfileModal from "./investor-profile-modal";

interface InvestmentSummaryProps {
  investor: InvestorWithInvestments;
}

export default function InvestmentSummary({ investor }: InvestmentSummaryProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Calculate combined daily returns for all investments
  const combinedReturns = (investor.investments || []).reduce(
    (acc, investment) => {
      const calculation = calculateReturns(
        parseFloat(investment.investedAmount),
        new Date(investment.investmentDate)
      );
      
      return {
        principalInvestment: acc.principalInvestment + calculation.dailyReturns.principalInvestment,
        interestTillDate: acc.interestTillDate + calculation.dailyReturns.interestTillDate,
        milestoneBonus: acc.milestoneBonus + calculation.dailyReturns.milestoneBonus,
        dailyInterestAmount: acc.dailyInterestAmount + calculation.dailyReturns.dailyInterestAmount,
        currentRate: calculation.dailyReturns.currentRate, // Take rate from last investment
      };
    },
    {
      principalInvestment: 0,
      interestTillDate: 0,
      milestoneBonus: 0,
      dailyInterestAmount: 0,
      currentRate: 0,
    }
  );

  const totalInvestments = (investor.investments || []).length;
  const totalUnits = (investor.investments || []).reduce((sum, inv) => sum + inv.bondsPurchased, 0);

  return (
    <>
      {/* Investor Name Header - Clickable */}
      <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome, {`${investor.firstName} ${investor.middleName || ''} ${investor.lastName}`.trim()}
            </h2>
            <p className="text-sm text-gray-600">Investor ID: {investor.id}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2"
            data-testid="button-view-profile"
          >
            <User className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="investment-summary-grid">
      {/* Your Principal Investment */}
      <Card className="bg-gray-800 text-white" data-testid="card-principal-investment">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Your Principal Investment</h3>
            <div className="text-3xl font-bold" data-testid="text-principal-amount">
              {formatCurrency(combinedReturns.principalInvestment)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Till Date */}
      <Card className="bg-gray-800 text-white" data-testid="card-interest-till-date">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Interest Till Date</h3>
            <div className="text-3xl font-bold" data-testid="text-interest-amount">
              {formatCurrency(combinedReturns.interestTillDate)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Bonus Earned */}
      <Card className="bg-gray-800 text-white" data-testid="card-milestone-bonus">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Milestone Bonus Earned</h3>
            <div className="text-3xl font-bold" data-testid="text-bonus-amount">
              {formatCurrency(combinedReturns.milestoneBonus)}
            </div>
            <div className="text-sm text-gray-400" data-testid="text-bonus-status">
              {combinedReturns.milestoneBonus > 0 ? "Bonus earned" : "No bonus earned yet"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Interest Rate */}
      <Card className="bg-gray-800 text-white" data-testid="card-daily-interest-rate">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Daily Interest Rate</h3>
            <div className="text-3xl font-bold" data-testid="text-daily-rate">
              {formatCurrency(combinedReturns.dailyInterestAmount)}
            </div>
            <div className="text-sm text-gray-400" data-testid="text-current-year-rate">
              Current year: {combinedReturns.currentRate}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Exit Value */}
      <Card className="bg-gray-800 text-white" data-testid="card-early-exit-value">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Early Exit Value</h3>
            {(() => {
              // Check if any investment has passed 3-year lock-in
              const hasPassedLockIn = (investor.investments || []).some(inv => {
                const yearsSince = Math.floor((new Date().getTime() - new Date(inv.investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                return yearsSince >= 3;
              });
              
              if (hasPassedLockIn) {
                const exitValue = combinedReturns.principalInvestment + combinedReturns.interestTillDate;
                return (
                  <>
                    <div className="text-3xl font-bold text-green-400" data-testid="text-exit-value">
                      {formatCurrency(exitValue)}
                    </div>
                    <div className="text-sm text-green-300" data-testid="text-exit-status">
                      Available (Principal + Interest Till Date)
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="text-3xl font-bold" data-testid="text-exit-value">
                      N/A
                    </div>
                    <div className="text-sm text-gray-400" data-testid="text-exit-status">
                      Exit only available after Month 36 (3-Year Lock-in)
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Investment Timeline & Milestones */}
      <Card className="bg-gray-800 text-white" data-testid="card-investment-milestones">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-300">Investment Milestones</h3>
            
            {/* Investment Dates */}
            {(investor.investments || []).map((investment, index) => (
              <div key={investment.id} className="border-l-2 border-blue-400 pl-3 py-2">
                <div className="text-sm space-y-1">
                  <div className="font-medium">Investment {index + 1} ({investment.bondsPurchased} Unit{investment.bondsPurchased > 1 ? 's' : ''})</div>
                  <div className="text-gray-400">Start: {formatDate(investment.investmentDate)}</div>
                  <div className="text-gray-400">Maturity: {formatDate(investment.maturityDate)}</div>
                </div>
              </div>
            ))}
            
            {/* Milestone Status */}
            <div className="pt-2 border-t border-gray-600">
              <div className="text-sm font-medium text-gray-300 mb-2">Milestone Bonuses:</div>
              <div className="space-y-2">
                {[5, 10].map(year => {
                  // Find investment and check completion status
                  let isCompleted = false;
                  let completionDate = null;
                  
                  (investor.investments || []).forEach(inv => {
                    const investmentDate = new Date(inv.investmentDate);
                    const yearsSince = Math.floor((new Date().getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    if (yearsSince >= year) {
                      isCompleted = true;
                      // Calculate the exact milestone completion date
                      const milestoneDate = new Date(investmentDate);
                      milestoneDate.setFullYear(milestoneDate.getFullYear() + year);
                      completionDate = milestoneDate;
                    }
                  });
                  
                  return (
                    <div key={year} className="bg-gray-700 rounded p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Year {year} Milestone:</span>
                        <span className={isCompleted ? "text-green-400 font-medium" : "text-gray-400"}>
                          {isCompleted ? "✓ Completed" : "Pending"}
                        </span>
                      </div>
                      {isCompleted && completionDate && (
                        <div className="text-xs text-green-300 mt-1">
                          Completed on: {formatDate(completionDate.toISOString())}
                        </div>
                      )}
                      {!isCompleted && (investor.investments || []).length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Expected: {(() => {
                            const firstInvestment = investor.investments[0];
                            const expectedDate = new Date(firstInvestment.investmentDate);
                            expectedDate.setFullYear(expectedDate.getFullYear() + year);
                            return formatDate(expectedDate.toISOString());
                          })()}
                        </div>
                      )}
                      <div className="text-xs text-gray-300 mt-1">
                        Bonus: ₹20,00,000 (100% of investment)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    {/* Profile Modal */}
    <InvestorProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      investor={investor}
    />
    </>
  );
}