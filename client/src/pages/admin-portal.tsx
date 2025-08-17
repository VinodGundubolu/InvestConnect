import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, ChartPie, Users, PlusCircle, FileText, BarChart, Folder, Settings } from "lucide-react";
import PortfolioOverview from "@/components/admin/portfolio-overview";
import InvestorsTable from "@/components/admin/investors-table";
import AddInvestmentForm from "@/components/admin/add-investment-form";
import AddInvestorForm from "@/components/admin/add-investor-form";

type AdminView = "overview" | "investors" | "add-investor" | "add-investment" | "plans" | "reports" | "documents" | "settings";

export default function AdminPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<AdminView>("overview");

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "admin")) {
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
  }, [isAuthenticated, isLoading, user, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigationItems = [
    { id: "overview", label: "Portfolio Overview", icon: ChartPie },
    { id: "investors", label: "All Investors", icon: Users },
    { id: "add-investor", label: "Add Investor", icon: PlusCircle },
    { id: "add-investment", label: "Add Investment", icon: PlusCircle },
    { id: "plans", label: "Investment Plans", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart },
    { id: "documents", label: "Documents", icon: Folder },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <PortfolioOverview />;
      case "investors":
        return <InvestorsTable />;
      case "add-investor":
        return <AddInvestorForm />;
      case "add-investment":
        return <AddInvestmentForm />;
      case "plans":
        return <div className="text-center py-12 text-gray-500">Investment Plans management coming soon...</div>;
      case "reports":
        return <div className="text-center py-12 text-gray-500">Reports section coming soon...</div>;
      case "documents":
        return <div className="text-center py-12 text-gray-500">Documents management coming soon...</div>;
      case "settings":
        return <div className="text-center py-12 text-gray-500">Settings coming soon...</div>;
      default:
        return <PortfolioOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-portal">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-portal-title">
                Admin Dashboard
              </h1>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                Administrator
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600" data-testid="text-welcome-message">
                Welcome, Admin User
              </span>
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id as AdminView)}
                    className={`w-full flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 ${
                      activeView === item.id ? "bg-primary-50 text-primary-700" : ""
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
