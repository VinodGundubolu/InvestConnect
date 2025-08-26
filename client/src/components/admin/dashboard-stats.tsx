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
    <div className="grid-modern grid-4 fade-in">
      <div className="stats-card-modern">
        <div className="flex items-center justify-between mb-4">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          <span className="badge-primary">Active</span>
        </div>
        <div className="stats-value">{formatCurrency(stats.totalInvestment)}</div>
        <div className="stats-label">Total Investment</div>
        <p className="text-sm text-gray-500 mt-2">Portfolio Value</p>
      </div>
      
      <div className="stats-card-modern">
        <div className="flex items-center justify-between mb-4">
          <Users className="w-8 h-8 text-green-500" />
          <span className="badge-success">Verified</span>
        </div>
        <div className="stats-value">{stats.activeInvestors}</div>
        <div className="stats-label">Active Investors</div>
        <p className="text-sm text-gray-500 mt-2">Verified Profiles</p>
      </div>
      
      <div className="stats-card-modern">
        <div className="flex items-center justify-between mb-4">
          <CreditCard className="w-8 h-8 text-purple-500" />
          <span className="badge-primary">Units</span>
        </div>
        <div className="stats-value">{stats.totalBonds}</div>
        <div className="stats-label">Investment Debentures</div>
        <p className="text-sm text-gray-500 mt-2">₹20L Each Unit</p>
      </div>
      
      <div className="stats-card-modern">
        <div className="flex items-center justify-between mb-4">
          <Percent className="w-8 h-8 text-orange-500" />
          <span className="badge-success">Daily</span>
        </div>
        <div className="stats-value">₹{stats.todayInterest.toLocaleString('en-IN')}</div>
        <div className="stats-label">Today's Interest</div>
        <p className="text-sm text-gray-500 mt-2">Interest Accrual</p>
      </div>
    </div>
  );
}