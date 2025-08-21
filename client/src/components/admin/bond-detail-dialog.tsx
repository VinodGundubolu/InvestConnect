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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bond Details - {bond.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bond Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bond Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Bond ID</p>
                <p className="text-lg font-semibold text-gray-900">{bond.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Bond Type</p>
                <p className="text-lg font-semibold text-gray-900">Fixed Income Bond</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Investor Name</p>
                <p className="text-lg font-semibold text-gray-900">{bond.investorName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  {bond.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Investment Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(bond.amount)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Units Purchased</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(bond.amount / 2000000)} Unit{Math.floor(bond.amount / 2000000) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Current Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bond.currentRate}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Investment Year</p>
                <p className="text-2xl font-bold text-orange-600">
                  Year {bond.year}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Purchase Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(bond.purchaseDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Maturity Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(bond.maturityDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}