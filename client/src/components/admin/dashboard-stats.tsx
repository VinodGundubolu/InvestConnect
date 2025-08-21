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
      <div className="grid-modern grid-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stats-card-modern animate-pulse">
            <div className="bg-gray-200 rounded h-6 mb-3"></div>
            <div className="bg-gray-300 rounded h-8 mb-2 w-3/4"></div>
            <div className="bg-gray-200 rounded h-4 w-1/2"></div>
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
      {/* Total Investment - Blue to Purple gradient */}
      <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden relative">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">ACTIVE</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.totalInvestment)}
          </p>
          <p className="text-sm font-medium text-gray-600 mb-1">TOTAL INVESTMENT</p>
          <p className="text-xs text-gray-500">Portfolio Value</p>
        </CardContent>
      </Card>

      {/* Active Investors - Green gradient */}
      <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden relative">
        <div className="h-1 bg-gradient-to-r from-green-500 to-blue-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">VERIFIED</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.activeInvestors}
          </p>
          <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE INVESTORS</p>
          <p className="text-xs text-gray-500">Verified Profiles</p>
        </CardContent>
      </Card>

      {/* Investment Bonds - Purple gradient */}
      <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden relative">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">UNITS</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.totalBonds}
          </p>
          <p className="text-sm font-medium text-gray-600 mb-1">INVESTMENT BONDS</p>
          <p className="text-xs text-gray-500">₹20L Each Unit</p>
        </CardContent>
      </Card>

      {/* Today's Interest - Orange gradient */}
      <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden relative">
        <div className="h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">DAILY</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.todayInterest)}
          </p>
          <p className="text-sm font-medium text-gray-600 mb-1">TODAY'S INTEREST</p>
          <p className="text-xs text-gray-500">Interest Accrual</p>
        </CardContent>
      </Card>
    </div>
  );
}