import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, User, Shield } from "lucide-react";

export default function InvestorLogin() {
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to investor portal
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/investor';
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // Add portal type to login URL for backend tracking
    window.location.href = '/api/login?portal=investor';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" data-testid="investor-login-page">
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-login-title">
                  Investor Portal
                </h1>
                <p className="text-gray-600" data-testid="text-login-subtitle">
                  Access your investment dashboard and portfolio details
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">For Investors</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        View your investment portfolio, returns, transaction history, and daily interest calculations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                    data-testid="button-investor-login"
                  >
                    Login with Replit Account
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="font-medium text-yellow-800 mb-1">Test Demo Account:</p>
                      <p><strong>Username:</strong> Suresh</p>
                      <p><strong>Password:</strong> Test@1234</p>
                      <p className="text-xs text-yellow-700 mt-1">Use these credentials to test the investor portal</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure authentication powered by Replit</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-center text-sm text-gray-600">
                    Are you an administrator?{" "}
                    <a 
                      href="/admin-login" 
                      className="text-green-600 hover:text-green-700 font-medium"
                      data-testid="link-admin-portal"
                    >
                      Access Admin Portal
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}