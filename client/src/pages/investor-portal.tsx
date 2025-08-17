import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import InvestmentSummary from "@/components/investor/investment-summary";
import ReturnsCalculator from "@/components/investor/returns-calculator";
import TransactionHistory from "@/components/investor/transaction-history";
import { InvestorWithInvestments } from "@shared/schema";

export default function InvestorPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: investorProfile, isLoading: profileLoading, error } = useQuery<InvestorWithInvestments>({
    queryKey: ["/api/investor/profile"],
    enabled: isAuthenticated && !isLoading,
  });

  // Redirect to login if not authenticated
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

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!investorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Investor Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Please contact your administrator to set up your investor profile.</p>
          <Button onClick={handleLogout}>Return to Login</Button>
        </div>
      </div>
    );
  }

  const fullName = `${investorProfile.firstName} ${investorProfile.middleName || ''} ${investorProfile.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="investor-portal">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-portal-title">
                My Investment Portal
              </h1>
              <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Investor
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600" data-testid="text-welcome-message">
                Welcome, {fullName}
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

      <div className="container mx-auto px-6 py-8">
        {/* Investment Summary */}
        <InvestmentSummary investor={investorProfile} />

        {/* Returns Calculator */}
        <ReturnsCalculator />

        {/* Transaction History */}
        <TransactionHistory />
      </div>
    </div>
  );
}
