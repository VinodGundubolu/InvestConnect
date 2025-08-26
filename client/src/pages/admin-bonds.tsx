import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, Calendar, DollarSign, Eye } from "lucide-react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

export default function AdminBonds() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedBond, setSelectedBond] = useState<any>(null);
  const [showBondDetails, setShowBondDetails] = useState(false);

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

  const investmentsList = Array.isArray(investments) ? investments : [];
  
  const displayInvestments = investmentsList.map(inv => ({
    id: inv.id || `INV-${Math.random().toString(36).substr(2, 9)}`,
    investorName: inv.investorName || inv.investor_name || 'Unknown Investor',
    bondType: inv.bondType || inv.bond_type || 'Fixed Income Bond',
    amount: inv.amount || inv.total_amount || inv.principal_amount || 0,
    purchaseDate: inv.purchaseDate || inv.purchase_date || inv.created_at || new Date().toISOString().split('T')[0],
    maturityDate: inv.maturityDate || inv.maturity_date || new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0],
    currentRate: inv.currentRate || inv.current_rate || inv.interest_rate || 6,
    status: inv.status || 'Active',
    year: inv.year || inv.current_year || 1
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Debenture Management</h1>
              <p className="text-gray-600">Manage investment debentures and portfolio allocation</p>
            </div>

          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Debentures</p>
                      <p className="text-2xl font-bold">{displayInvestments.length}</p>
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
                        {formatCurrency(displayInvestments.reduce((sum, inv) => sum + inv.amount, 0))}
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
                      <p className="text-sm text-gray-600">Active Debentures</p>
                      <p className="text-2xl font-bold">
                        {displayInvestments.filter(inv => inv.status === 'Active').length}
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
                      <p className="text-2xl font-bold">
                        {displayInvestments.length > 0 ? 
                          (displayInvestments.reduce((sum, inv) => sum + inv.currentRate, 0) / displayInvestments.length).toFixed(1) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bonds Table */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Debentures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Debenture ID</th>
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
                      {displayInvestments.map((investment) => (
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedBond(investment);
                                setShowBondDetails(true);
                              }}
                              data-testid={`button-view-bond-${investment.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
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
      
      {/* Bond Details Modal */}
      {showBondDetails && selectedBond && (
        <Dialog open={showBondDetails} onOpenChange={setShowBondDetails}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle>Debenture Details - {selectedBond.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Investor Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedBond.investorName}</p>
                  <p className="text-sm text-gray-600">Investor ID: {selectedBond.investorId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Debenture Information</h4>
                  <p className="text-sm text-gray-600">Type: {selectedBond.bondType}</p>
                  <p className="text-sm text-gray-600">Debentures: {selectedBond.bondsPurchased}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Investment Details</h4>
                  <p className="text-sm text-gray-600">Amount: {formatCurrency(selectedBond.amount)}</p>
                  <p className="text-sm text-gray-600">Purchase Date: {selectedBond.purchaseDate}</p>
                  <p className="text-sm text-gray-600">Maturity Date: {selectedBond.maturityDate}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Current Status</h4>
                  <p className="text-sm text-gray-600">Year: {selectedBond.year}</p>
                  <p className="text-sm text-gray-600">Current Rate: {selectedBond.currentRate}%</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      {selectedBond.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Investment Timeline</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                    {[1, 2, 3, 4, 5].map((year) => (
                      <div key={year} className={`p-2 rounded ${selectedBond.year >= year ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        <div className="font-semibold">Year {year}</div>
                        <div className="text-xs">
                          {year === 1 ? '0%' : year === 2 ? '6%' : year === 3 ? '9%' : year === 4 ? '12%' : '18%'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowBondDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Debenture editing functionality will be available in the next update.",
                  });
                }}>
                  Edit Debenture
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}