import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, CreditCard, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendColor?: "green" | "blue" | "purple";
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, trendColor = "green" }: StatsCardProps) {
  const trendColors = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50", 
    purple: "text-purple-600 bg-purple-50"
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <Badge variant="secondary" className={`mt-2 ${trendColors[trendColor]}`}>
                {trend}
              </Badge>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default stats if no data available
  const stats = dashboardData ? {
    totalInvestment: dashboardData.totalInvestment || 8000000,
    activeInvestors: dashboardData.activeInvestors || 2,
    totalBonds: dashboardData.totalBonds || 4,
    todayInterest: dashboardData.todayInterest || 1973
  } : {
    totalInvestment: 8000000,
    activeInvestors: 2,
    totalBonds: 4,
    todayInterest: 1973
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Investment"
        value={formatCurrency(stats.totalInvestment)}
        subtitle="Active Portfolio"
        icon={TrendingUp}
        trend="Active Portfolio"
        trendColor="green"
      />
      
      <StatsCard
        title="Active Investors"
        value={stats.activeInvestors.toString()}
        subtitle="Verified Profiles"
        icon={Users}
        trend="Verified"
        trendColor="green"
      />
      
      <StatsCard
        title="Total Bonds"
        value={stats.totalBonds.toString()}
        subtitle="Active Bonds"
        icon={CreditCard}
        trend="Active Bonds"
        trendColor="green"
      />
      
      <StatsCard
        title="Today's Interest"
        value={`₹${stats.todayInterest.toLocaleString('en-IN')}`}
        subtitle="% Daily Accrual"
        icon={Percent}
        trend="% Daily Accrual"
        trendColor="green"
      />
    </div>
  );
}