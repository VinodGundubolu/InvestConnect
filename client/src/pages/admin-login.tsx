import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Shield, Users } from "lucide-react";

export default function AdminLogin() {
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to admin portal
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/admin';
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // Add portal type to login URL for backend tracking
    window.location.href = '/api/login?portal=admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100" data-testid="admin-login-page">
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-login-title">
                  Admin Portal
                </h1>
                <p className="text-gray-600" data-testid="text-login-subtitle">
                  Manage investors, investments, and portfolio overview
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-900">For Administrators</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Full access to investor management, investment creation, portfolio oversight, and system administration
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  size="lg"
                  data-testid="button-admin-login"
                >
                  Login to Admin Portal
                </Button>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure authentication with admin verification</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-center text-sm text-gray-600">
                    Are you an investor?{" "}
                    <a 
                      href="/investor-login" 
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      data-testid="link-investor-portal"
                    >
                      Access Investor Portal
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