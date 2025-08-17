import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Coins, TrendingUp, Calendar, Plus, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PortfolioOverview() {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["/api/admin/portfolio-overview"],
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading portfolio overview</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Investors",
      value: overview?.totalInvestors?.toString() || "0",
      subtitle: "+12 this month",
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      dataTestId: "card-total-investors",
    },
    {
      title: "Total Principal",
      value: formatCurrency(parseFloat(overview?.totalPrincipal || "0")),
      subtitle: "+₹45L this month",
      icon: Coins,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      dataTestId: "card-total-principal",
    },
    {
      title: "Interest Paid",
      value: formatCurrency(parseFloat(overview?.totalInterestPaid || "0")),
      subtitle: "₹12L this month",
      icon: TrendingUp,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
      dataTestId: "card-interest-paid",
    },
    {
      title: "Maturity Due",
      value: formatCurrency(parseFloat(overview?.maturityDue || "0")),
      subtitle: "Next 12 months",
      icon: Calendar,
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      dataTestId: "card-maturity-due",
    },
  ];

  return (
    <div data-testid="portfolio-overview">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Portfolio Overview</h2>
        <div className="flex gap-3">
          <Button className="bg-primary hover:bg-primary-600" data-testid="button-add-investor">
            <Plus className="mr-2 h-4 w-4" />
            Add New Investor
          </Button>
          <Button className="bg-success-500 hover:bg-success-600" data-testid="button-export-portfolio">
            <Download className="mr-2 h-4 w-4" />
            Export Portfolio
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => (
          <Card key={card.title} className="border shadow-sm" data-testid={card.dataTestId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid={`text-${card.dataTestId}-value`}>
                    {card.value}
                  </p>
                  <p className="text-sm text-success-600">{card.subtitle}</p>
                </div>
                <div className={`p-3 ${card.bgColor} rounded-lg`}>
                  <card.icon className={`${card.iconColor} text-xl h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="border shadow-sm" data-testid="card-quick-stats">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Quick Statistics</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">85%</div>
              <div className="text-sm text-gray-600">Active Investments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-500">₹4.2Cr</div>
              <div className="text-sm text-gray-600">Average Portfolio Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-500">15.6%</div>
              <div className="text-sm text-gray-600">Average Annual Return</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
