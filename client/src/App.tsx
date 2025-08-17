import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import InvestorPortal from "@/pages/investor-portal";
import AdminPortal from "@/pages/admin-portal";
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
                onClick={() => window.location.href = '/api/login'}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
              >
                Login as Admin
              </button>
            </div>
          </div>
        )}
      </Route>

      {/* Protected Investor Portal - requires investor role */}
      <Route path="/investor">
        {isAuthenticated && ((user as any)?.role === 'investor' || !(user as any)?.role) ? (
          <InvestorPortal />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Investor Access Required</h2>
              <p className="text-gray-600 mb-4">You need investor credentials to access this portal.</p>
              <button 
                onClick={() => window.location.href = '/api/login'}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
              >
                Login as Investor
              </button>
            </div>
          </div>
        )}
      </Route>

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
