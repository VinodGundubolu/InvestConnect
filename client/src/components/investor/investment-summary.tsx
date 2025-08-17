import { Card, CardContent } from "@/components/ui/card";
import { Coins, TrendingUp, Percent, Calendar } from "lucide-react";
import { InvestorWithInvestments } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvestmentSummaryProps {
  investorProfile: InvestorWithInvestments;
}

export default function InvestmentSummary({ investorProfile }: InvestmentSummaryProps) {
  // Calculate aggregated investment data
  const totalPrincipal = investorProfile.investments.reduce(
    (sum, inv) => sum + parseFloat(inv.investedAmount),
    0
  );

  const totalInterestEarned = investorProfile.investments.reduce((sum, inv) => {
    const dividendTransactions = inv.transactions.filter(
      (t) => t.type === "dividend_disbursement"
    );
    return sum + dividendTransactions.reduce((tSum, t) => tSum + parseFloat(t.amount), 0);
  }, 0);

  const latestInvestment = investorProfile.investments[0]; // Assuming sorted by date desc
  const currentRate = latestInvestment ? 12 : 0; // This would be calculated based on investment age

  const nearestMaturity = investorProfile.investments.reduce((nearest, inv) => {
    if (!nearest || new Date(inv.maturityDate) < new Date(nearest.maturityDate)) {
      return inv;
    }
    return nearest;
  }, investorProfile.investments[0]);

  const summaryCards = [
    {
      title: "Principal Amount",
      value: formatCurrency(totalPrincipal),
      icon: Coins,
      bgColor: "bg-primary-50",
      iconColor: "text-primary-500",
      dataTestId: "card-principal-amount",
    },
    {
      title: "Interest Earned",
      value: formatCurrency(totalInterestEarned),
      icon: TrendingUp,
      bgColor: "bg-success-50",
      iconColor: "text-success-500",
      dataTestId: "card-interest-earned",
    },
    {
      title: "Current Rate",
      value: `${currentRate}%`,
      icon: Percent,
      bgColor: "bg-orange-50",
      iconColor: "text-warning-500",
      dataTestId: "card-current-rate",
    },
    {
      title: "Maturity Date",
      value: nearestMaturity ? formatDate(nearestMaturity.maturityDate) : "N/A",
      icon: Calendar,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-500",
      dataTestId: "card-maturity-date",
    },
  ];

  return (
    <div className="mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border shadow-sm" data-testid={card.dataTestId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid={`text-${card.dataTestId}-value`}>
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 ${card.bgColor} rounded-lg`}>
                  <card.icon className={`${card.iconColor} h-5 w-5`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investor Information */}
        <Card className="border shadow-sm" data-testid="card-investor-info">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Investor Information</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium" data-testid="text-investor-name">
                  {`${investorProfile.firstName} ${investorProfile.middleName || ''} ${investorProfile.lastName}`.trim()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Investor ID</label>
                <p className="font-medium font-mono" data-testid="text-investor-id">
                  {investorProfile.id}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Mobile</label>
                <p className="font-medium" data-testid="text-investor-mobile">
                  {investorProfile.primaryMobile}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="font-medium" data-testid="text-investor-email">
                  {investorProfile.email}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="font-medium" data-testid="text-investor-address">
                {investorProfile.primaryAddress}, {investorProfile.primaryAddressPin}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card className="border shadow-sm" data-testid="card-investment-details">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Investment Details</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            {latestInvestment ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <p className="font-medium" data-testid="text-plan-type">
                      {latestInvestment.plan.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Investment Date</label>
                    <p className="font-medium" data-testid="text-investment-date">
                      {formatDate(latestInvestment.investmentDate)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bonds Purchased</label>
                    <p className="font-medium" data-testid="text-bonds-purchased">
                      {latestInvestment.bondsPurchased}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lock-in Expires</label>
                    <p className="font-medium" data-testid="text-lock-expiry">
                      {formatDate(latestInvestment.lockInExpiry)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bonus Earned</label>
                    <p className="font-medium text-success-600" data-testid="text-bonus-earned">
                      {formatCurrency(parseFloat(latestInvestment.bonusEarned))}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Bonus</label>
                    <p className="font-medium" data-testid="text-next-bonus">
                      Year 5 ({new Date(latestInvestment.investmentDate).getFullYear() + 5})
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No investment data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
