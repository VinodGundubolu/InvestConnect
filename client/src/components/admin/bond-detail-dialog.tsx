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

interface BondDetailProps {
  bond: any; // Using any to handle the actual data structure from API
}

export default function BondDetailDialog({ bond }: BondDetailProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-view-bond-${bond.id}`}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white z-50">
        <DialogHeader className="pb-4 border-b bg-white">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Bond Details - {bond.id}
          </DialogTitle>
          <p className="text-sm text-gray-600">Complete investment bond information</p>
        </DialogHeader>
        
        <div className="space-y-8 mt-6 bg-white">
          {/* Bond Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-blue-600 mb-2">BOND ID</h3>
                <p className="text-lg font-bold text-blue-900 break-all">{bond.id}</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-green-600 mb-2">INVESTOR</h3>
                <p className="text-lg font-bold text-green-900">{bond.investorName}</p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-purple-600 mb-2">STATUS</h3>
                <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                  {bond.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl text-gray-800">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">INVESTMENT AMOUNT</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(bond.amount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">UNITS PURCHASED</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.floor(bond.amount / 2000000)} Unit{Math.floor(bond.amount / 2000000) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">CURRENT RATE</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {bond.currentRate}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">INVESTMENT YEAR</p>
                  <p className="text-3xl font-bold text-orange-600">
                    Year {bond.year}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl text-gray-800">Investment Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">PURCHASE DATE</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {new Date(bond.purchaseDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-3">MATURITY DATE</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {new Date(bond.maturityDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bond Type Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl text-gray-800">Bond Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-3">BOND TYPE</p>
                <p className="text-xl font-semibold text-gray-900">Fixed Income Bond</p>
                <p className="text-sm text-gray-500 mt-2">₹20 Lakh per unit investment vehicle</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}