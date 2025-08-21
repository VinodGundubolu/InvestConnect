import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Calendar, DollarSign } from "lucide-react";
import BondDetailDialog from "@/components/admin/bond-detail-dialog";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

export default function AdminBonds() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/investments"],
  });

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

  const sampleInvestments = investments || [
    {
      id: "INV-001",
      investorName: "Vinod Sharma",
      bondType: "Fixed Income Bond",
      amount: 2000000,
      purchaseDate: "2024-01-15",
      maturityDate: "2029-01-15",
      currentRate: 6,
      status: "Active",
      year: 2
    },
    {
      id: "INV-002", 
      investorName: "Suresh Kumar",
      bondType: "Fixed Income Bond",
      amount: 6000000,
      purchaseDate: "2024-03-01", 
      maturityDate: "2029-03-01",
      currentRate: 6,
      status: "Active",
      year: 2
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="nav-modern px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="page-header">
              <h1 className="page-title">Bond Management</h1>
              <p className="page-subtitle">Manage investment bonds and portfolio allocation</p>
            </div>
          </div>
        </header>

        <main className="flex-1 container-modern">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Bonds</p>
                      <p className="text-2xl font-bold">{sampleInvestments.length}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(sampleInvestments.reduce((sum, inv) => sum + inv.amount, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Bonds</p>
                      <p className="text-2xl font-bold">
                        {sampleInvestments.filter(inv => inv.status === 'Active').length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg. Rate</p>
                      <p className="text-2xl font-bold">6%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bonds Table */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Bonds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Bond ID</th>
                        <th className="text-left p-4 font-medium">Investor</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-right p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Purchase Date</th>
                        <th className="text-left p-4 font-medium">Maturity</th>
                        <th className="text-left p-4 font-medium">Current Rate</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleInvestments.map((investment) => (
                        <tr key={investment.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{investment.id}</td>
                          <td className="p-4">{investment.investorName}</td>
                          <td className="p-4">{investment.bondType}</td>
                          <td className="p-4 text-right font-semibold">
                            {formatCurrency(investment.amount)}
                          </td>
                          <td className="p-4">{investment.purchaseDate}</td>
                          <td className="p-4">{investment.maturityDate}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              {investment.currentRate}% (Year {investment.year})
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              {investment.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <BondDetailDialog bond={investment} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}