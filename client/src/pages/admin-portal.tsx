import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import DashboardStats from "@/components/admin/dashboard-stats";
import InvestorPortfolioOverview from "@/components/admin/investor-portfolio-overview";
import TodayInterestBreakdown from "@/components/admin/interest-breakdown";

export default function AdminPortal() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="nav-modern px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="page-header">
              <h1 className="page-title">Investment Dashboard</h1>
              <p className="page-subtitle">Real-time portfolio management and returns tracking</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Today's Date</p>
                <p className="font-semibold text-gray-900">{today}</p>
              </div>

            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 container-modern">
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="slide-up">
              <DashboardStats />
            </div>

            {/* Portfolio Overview and Interest Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
              <div className="lg:col-span-2">
                <InvestorPortfolioOverview />
              </div>
              <div className="lg:col-span-1">
                <TodayInterestBreakdown />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}