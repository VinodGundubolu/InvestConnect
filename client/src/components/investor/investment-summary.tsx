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
  const combinedReturns = investor.investments.reduce(
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

  const totalInvestments = investor.investments.length;
  const totalUnits = investor.investments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);

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
            <div className="text-3xl font-bold" data-testid="text-exit-value">
              N/A
            </div>
            <div className="text-sm text-gray-400" data-testid="text-exit-status">
              Exit only available after Month 36 (3-Year Lock-in)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <Card className="bg-gray-800 text-white" data-testid="card-investment-summary">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-300">Investment Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total Investments:</span>
                <span data-testid="text-total-investments">{totalInvestments}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Units:</span>
                <span data-testid="text-total-units">{totalUnits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Investor ID:</span>
                <span data-testid="text-investor-id" className="font-mono">{investor.id}</span>
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