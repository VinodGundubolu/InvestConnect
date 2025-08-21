import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import AddInvestorForm from "./add-investor-form";
import DeleteInvestorDialog from "./delete-investor-dialog";
import { useState } from "react";
import InvestorProfileModal from "../investor/investor-profile-modal";

export default function InvestorsTable() {
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { data: investors, isLoading } = useQuery({
    queryKey: ["/api/admin/investors"],
  });

  const investorsList = Array.isArray(investors) ? investors : [];
  
  const displayInvestors = investorsList.map(inv => ({
    id: inv.id,
    name: `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.name || 'Unknown',
    email: inv.email || 'No email',
    phone: inv.primary_mobile || inv.phone || 'No phone',
    totalInvestment: inv.investment || inv.totalInvestment || 0,
    bondsCount: inv.bonds || inv.bondsCount || 0,
    joinDate: new Date(inv.created_at || Date.now()).toLocaleDateString(),
    investmentStartDate: inv.investmentStartDate || new Date(inv.created_at || Date.now()).toLocaleDateString(),
    maturityDate: inv.maturityDate || new Date(new Date(inv.created_at || Date.now()).getTime() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: inv.status || 'Active',
    currentYear: inv.currentYear || 1,
    currentRate: inv.rate || 0,
    totalReturns: inv.totalReturns || 0,
    maturityProgress: inv.maturityProgress || 0
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">All Investors</h2>
          <p className="text-gray-600">Manage investor profiles and portfolios</p>
        </div>
        <AddInvestorForm />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Investors</p>
              <p className="text-2xl font-bold">{displayInvestors.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold">
                {formatCurrency(displayInvestors.reduce((sum, inv) => sum + inv.totalInvestment, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Bonds</p>
              <p className="text-2xl font-bold">
                {displayInvestors.reduce((sum, inv) => sum + inv.bondsCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold">
                {formatCurrency(displayInvestors.reduce((sum, inv) => sum + inv.totalReturns, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Investor ID</th>
                  <th className="text-left p-4 font-medium">Name & Contact</th>
                  <th className="text-right p-4 font-medium">Investment</th>
                  <th className="text-left p-4 font-medium">Bonds</th>
                  <th className="text-left p-4 font-medium">Investment Start</th>
                  <th className="text-left p-4 font-medium">Maturity Date</th>
                  <th className="text-left p-4 font-medium">Current Status</th>
                  <th className="text-right p-4 font-medium">Total Returns</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayInvestors.map((investor) => (
                  <tr key={investor.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{investor.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{investor.name}</p>
                        <p className="text-sm text-gray-600">{investor.email}</p>
                        <p className="text-sm text-gray-600">{investor.phone}</p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {formatCurrency(investor.totalInvestment)}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {investor.bondsCount} Bond{investor.bondsCount > 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="p-4">{investor.investmentStartDate || investor.joinDate}</td>
                    <td className="p-4">{investor.maturityDate || 'TBD'}</td>
                    <td className="p-4">
                      <div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 mb-1">
                          {investor.status}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          Year {investor.currentYear} @ {investor.currentRate}%
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-semibold text-green-600">
                      {formatCurrency(investor.totalReturns)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-view-investor-${investor.id}`}
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setIsEditMode(false);
                            setShowEditDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-edit-investor-${investor.id}`}
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setIsEditMode(true);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteInvestorDialog 
                          investor={{
                            id: investor.id,
                            firstName: investor.name.split(' ')[0],
                            lastName: investor.name.split(' ').slice(1).join(' '),
                            email: investor.email,
                            totalInvestment: investor.totalInvestment
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit/View Modal */}
      {showEditDialog && selectedInvestor && (
        <InvestorProfileModal
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedInvestor(null);
            setIsEditMode(false);
          }}
          investorId={selectedInvestor.id}
          editMode={isEditMode}
        />
      )}
    </div>
  );
}