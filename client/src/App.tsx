import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import InvestorPortal from "@/pages/investor-portal";
import AdminPortal from "@/pages/admin-portal";
import AdminInvestors from "@/pages/admin-investors";
import AdminBonds from "@/pages/admin-bonds";
import AdminTransactions from "@/pages/admin-transactions";
import AdminCalculator from "@/pages/admin-calculator";
import AdminReports from "@/pages/admin-reports";
import EmailManagementPage from "@/pages/email-management";
import InvestorLogin from "@/pages/investor-login";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Separate Login Pages */}
      <Route path="/investor-login" component={InvestorLogin} />
      <Route path="/login" component={InvestorLogin} />
      <Route path="/admin-login" component={AdminLogin} />

      {/* Protected Admin Portal - requires admin role */}
      <Route path="/admin">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminPortal />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-gray-600 mb-4">You need admin credentials to access this portal.</p>
              <button 
                onClick={() => window.location.href = '/admin-login'}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Admin Login
              </button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/investors">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminInvestors />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/bonds">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminBonds />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/transactions">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminTransactions />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/calculator">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminCalculator />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/reports">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <AdminReports />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      <Route path="/admin/email-management">
        {isAuthenticated && (user as any)?.role === 'admin' ? (
          <EmailManagementPage />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <button onClick={() => window.location.href = '/admin-login'}>Go to Admin Login</button>
            </div>
          </div>
        )}
      </Route>

      {/* Investor Portal - uses its own authentication */}
      <Route path="/investor" component={InvestorPortal} />

      {/* Landing page with portal selection */}
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
