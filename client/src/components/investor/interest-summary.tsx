import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, ArrowUpRight, Clock, DollarSign } from "lucide-react";

interface InterestDetails {
  totalInterestTillDate: number;
  totalInterestDisbursedTillDate: number;
  interestToBeDispursedNext: {
    amount: number;
    disbursementDate: string;
    yearCovered: number;
  };
  investmentBreakdown: Array<{
    investmentId: string;
    investmentDate: string;
    principalAmount: number;
    bondsPurchased: number;
    interestEarnedTillDate: number;
    interestDisbursedTillDate: number;
    completedYears: number;
    currentYearProgress: number;
  }>;
  disbursementSchedule: Array<{
    year: number;
    disbursementDate: string;
    amount: number;
    interestRate: number;
    milestoneBonus?: number;
  }>;
}

export default function InterestSummary() {
  const { data: interestDetails, isLoading } = useQuery<InterestDetails>({
    queryKey: ["/api/investor/interest-details", Date.now()],
    refetchOnMount: 'always',
    staleTime: 0,
    cacheTime: 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="stats-card-modern animate-pulse">
            <div className="bg-gray-200 rounded h-6 mb-3"></div>
            <div className="bg-gray-300 rounded h-8 mb-2 w-3/4"></div>
            <div className="bg-gray-200 rounded h-4 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!interestDetails) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Interest Calculation Unavailable</h3>
          <p className="text-orange-600">Unable to calculate interest details at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Interest Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Interest Earned Till Date */}
        <div className="stats-card-modern">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Earned
            </Badge>
          </div>
          <div className="stats-value text-green-600">
            {formatCurrency(interestDetails.totalInterestTillDate)}
          </div>
          <div className="stats-label">Interest Till Date</div>
          <p className="text-sm text-gray-500 mt-2">
            Total interest earned based on completed years
          </p>
        </div>

        {/* Interest Disbursed Till Date */}
        <div className="stats-card-modern">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-blue-500" />
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              Paid Out
            </Badge>
          </div>
          <div className="stats-value text-blue-600">
            {formatCurrency(interestDetails.totalInterestDisbursedTillDate)}
          </div>
          <div className="stats-label">Interest Disbursed Till Date</div>
          <p className="text-sm text-gray-500 mt-2">
            Total interest amount paid out
          </p>
        </div>

        {/* Interest to be Disbursed Next */}
        <div className="stats-card-modern">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-purple-500" />
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              Upcoming
            </Badge>
          </div>
          <div className="stats-value text-purple-600">
            {formatCurrency(interestDetails.interestToBeDispursedNext.amount)}
          </div>
          <div className="stats-label">Next Disbursement</div>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(interestDetails.interestToBeDispursedNext.disbursementDate)}
          </div>
          {interestDetails.interestToBeDispursedNext.yearCovered > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Year {interestDetails.interestToBeDispursedNext.yearCovered} Interest
            </p>
          )}
        </div>
      </div>

      {/* Investment Breakdown */}
      {interestDetails.investmentBreakdown.length > 0 && (
        <Card className="modern-card-elevated">
          <CardHeader>
            <CardTitle className="modern-heading flex items-center">
              <ArrowUpRight className="w-5 h-5 mr-2 text-blue-500" />
              Investment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interestDetails.investmentBreakdown.map((investment) => (
                <div key={investment.investmentId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Investment #{investment.investmentId.slice(-8)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Started: {formatDate(investment.investmentDate)} • 
                        {investment.bondsPurchased} bonds • 
                        {formatCurrency(investment.principalAmount)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Year {investment.completedYears + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Interest Earned:</span>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(investment.interestEarnedTillDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Interest Disbursed:</span>
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(investment.interestDisbursedTillDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Year Progress:</span>
                      <p className="font-semibold text-purple-600">
                        {Math.round(investment.currentYearProgress * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Schedule */}
      {interestDetails.disbursementSchedule.length > 0 && (
        <Card className="modern-card-elevated">
          <CardHeader>
            <CardTitle className="modern-heading flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              Complete Disbursement Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="table-modern w-full">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Disbursement Date</th>
                    <th>Interest Rate</th>
                    <th>Interest Amount</th>
                    <th>Milestone Bonus</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {interestDetails.disbursementSchedule.map((schedule) => (
                    <tr key={schedule.year}>
                      <td className="font-semibold">Year {schedule.year}</td>
                      <td>{schedule.disbursementDate}</td>
                      <td>
                        <Badge variant={schedule.interestRate === 0 ? "secondary" : "default"}>
                          {schedule.interestRate}%
                        </Badge>
                      </td>
                      <td className="font-semibold">
                        {formatCurrency(schedule.amount - (schedule.milestoneBonus || 0))}
                      </td>
                      <td>
                        {schedule.milestoneBonus ? (
                          <Badge className="bg-orange-100 text-orange-700">
                            {formatCurrency(schedule.milestoneBonus)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="font-bold text-green-600">
                        {formatCurrency(schedule.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Disbursement Schedule Notes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Interest is disbursed annually on the 24th of the month following each anniversary</li>
                <li>• Year 1 has 0% interest as per investment terms</li>
                <li>• Milestone bonuses: 5% at year 5, 10% at year 10</li>
                <li>• All amounts are calculated on the principal investment amount</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}