import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface InvestorDetailProps {
  investorId: string;
}

export default function InvestorDetailDialog({ investorId }: InvestorDetailProps) {
  const [open, setOpen] = useState(false);

  const { data: investorDetails, isLoading } = useQuery({
    queryKey: ["/api/admin/investor-details", investorId],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-view-investor-${investorId}`}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investor Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
          </div>
        ) : investorDetails ? (
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{investorDetails.firstName} {investorDetails.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{investorDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{investorDetails.primaryMobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Investor ID</p>
                  <p className="font-medium">{investorDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium">{investorDetails.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{investorDetails.state}</p>
                </div>
              </CardContent>
            </Card>

            {/* Investment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(investorDetails.totalInvestment || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Investment</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {investorDetails.bonds || 0}
                    </p>
                    <p className="text-sm text-gray-600">Bonds</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      Year {investorDetails.currentYear || 1}
                    </p>
                    <p className="text-sm text-gray-600">Investment Year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investments */}
            {investorDetails.investments && investorDetails.investments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investorDetails.investments.map((investment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">₹{parseFloat(investment.investedAmount).toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">
                            {investment.bondsPurchased} bonds • Started {investment.investmentDate}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Investor details not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}