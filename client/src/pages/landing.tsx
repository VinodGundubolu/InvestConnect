import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  // Show portal selection for authenticated users
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="portal-selection-page">
        <div className="bg-primary text-white py-6">
          <div className="container mx-auto px-6">
            <h1 className="text-3xl font-bold">Welcome back, {(user as any)?.firstName || (user as any)?.email}!</h1>
            <p className="text-primary-100 mt-2">Choose your portal to continue</p>
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-investor-portal">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 text-2xl">👤</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Investor Portal</h3>
                  <p className="text-gray-600 mb-4">View your investments, returns, and transaction history</p>
                  <Button 
                    onClick={() => window.location.href = '/investor'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-investor-portal"
                  >
                    Enter Investor Portal
                  </Button>
                </CardContent>
              </Card>
              
              {(user as any)?.role === "admin" && (
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-admin-portal">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 text-2xl">⚙️</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Admin Portal</h3>
                    <p className="text-gray-600 mb-4">Manage investors, investments, and portfolio overview</p>
                    <Button 
                      onClick={() => window.location.href = '/admin'}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid="button-admin-portal"
                    >
                      Enter Admin Portal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => window.location.href = '/api/logout'}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="landing-page">
      {/* Header */}
      <div className="bg-primary text-white py-6">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold" data-testid="text-header-title">
            Investment Relationship Management
          </h1>
          <p className="text-primary-100 mt-2" data-testid="text-header-subtitle">
            Choose your portal to access your account
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-investor-portal">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">👤</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Investor Portal</h3>
                <p className="text-gray-600 mb-4">View your investments, returns, and transaction history</p>
                <Button 
                  onClick={() => window.location.href = '/investor-login'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-investor-login"
                >
                  Access Investor Portal
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-admin-portal">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Admin Portal</h3>
                <p className="text-gray-600 mb-4">Manage investors, investments, and view portfolio overview</p>
                <Button 
                  onClick={() => window.location.href = '/admin-login'}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-admin-login"
                >
                  Access Admin Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}